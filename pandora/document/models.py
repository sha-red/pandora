# -*- coding: utf-8 -*-

from glob import glob
from urllib.parse import quote, unquote
import os
import re
import unicodedata

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models, transaction
from django.db.models import Q, Sum, Max
from django.db.models.signals import pre_delete
from django.utils import datetime_safe
from oxdjango.fields import JSONField

from PIL import Image
import ox


from oxdjango.sortmodel import get_sort_field
from person.models import get_name_sort
from item.models import Item
from annotation.models import Annotation
from archive.extract import resize_image, open_image_rgb
from archive.chunk import save_chunk
from user.models import Group
from user.utils import update_groups

from . import managers
from . import utils
from . import tasks
from .fulltext import FulltextMixin, FulltextPageMixin

User = get_user_model()

def get_path(f, x):
    return f.path(x)

class Document(models.Model, FulltextMixin):

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(User, related_name='documents', on_delete=models.CASCADE)
    groups = models.ManyToManyField(Group, blank=True, related_name='documents')

    extension = models.CharField(max_length=255)
    size = models.IntegerField(default=0)
    matches = models.IntegerField(default=0)
    ratio = models.FloatField(default=-1)
    pages = models.IntegerField(default=-1)
    width = models.IntegerField(default=-1)
    height = models.IntegerField(default=-1)

    oshash = models.CharField(max_length=16, unique=True, null=True)

    file = models.FileField(default=None, blank=True, null=True, upload_to=get_path)

    objects = managers.DocumentManager()
    uploading = models.BooleanField(default=False)

    items = models.ManyToManyField(Item, through='ItemProperties', related_name='documents')
    annotations = models.ManyToManyField(Annotation, related_name='documents')
    linked_documents = models.ManyToManyField('Document', related_name='linking_documents')

    rightslevel = models.IntegerField(db_index=True, default=0)
    data = JSONField(default=dict, editable=False)

    def update_access(self, user):
        if not user.is_authenticated:
            user = None
        access, created = Access.objects.get_or_create(document=self, user=user)
        if not created:
            access.save()

    def update_facet(self, key):
        current_values = self.get_value(key, [])
        if key == 'name':
            current_values = []
            for k in settings.CONFIG['documentKeys']:
                if k.get('sortType') == 'person':
                    current_values += self.get_value(k['id'], [])
        if not isinstance(current_values, list):
            if not current_values:
                current_values = []
            else:
                current_values = [str(current_values)]

        filter_map = utils.get_by_id(settings.CONFIG['documentKeys'], key).get('filterMap')
        if filter_map:
            filter_map = re.compile(filter_map)
            _current_values = []
            for value in current_values:
                value = filter_map.findall(value)
                if value:
                    _current_values.append(value[0])
            current_values = _current_values

        current_values = list(set(current_values))
        current_values = [ox.decode_html(ox.strip_tags(v)) for v in current_values]
        current_values = [unicodedata.normalize('NFKD', v) for v in current_values]
        self.update_facet_values(key, current_values)

    def update_facet_values(self, key, current_values):
        current_sortvalues = set([value.lower() for value in current_values])
        saved_values = [i.value.lower() for i in Facet.objects.filter(document=self, key=key)]
        removed_values = list(filter(lambda i: i not in current_sortvalues, saved_values))

        if removed_values:
            q = Q()
            for v in removed_values:
                q |= Q(value__iexact=v)
            r = Facet.objects.filter(document=self, key=key).filter(q).delete()

        for value in current_values:
            if value.lower() not in saved_values:
                sortvalue = value
                if key in self.person_keys + ['name']:
                    sortvalue = get_name_sort(value)
                sortvalue = utils.sort_string(sortvalue).lower()[:900]
                f, created = Facet.objects.get_or_create(document=self, key=key, value=value, sortvalue=sortvalue)
                if created:
                    Facet.objects.filter(document=self, key=key, value__iexact=value).exclude(value=value).delete()
                    Facet.objects.filter(key=key, value__iexact=value).exclude(value=value).update(value=value)
                saved_values.append(value.lower())

    def update_facets(self):
        for key in set(self.facet_keys + ['title']):
            self.update_facet(key)

    def update_find(self):

        def save(key, value):
            if value not in ('', None):
                f, created = Find.objects.get_or_create(document=self, key=key)
                if isinstance(value, bool):
                    value = value and 'true' or 'false'
                if isinstance(value, str):
                    value = ox.decode_html(ox.strip_tags(value.strip()))
                    value = unicodedata.normalize('NFKD', value).lower()
                f.value = value
                f.save()
            else:
                Find.objects.filter(document=self, key=key).delete()

        with transaction.atomic():
            data = self.json()
            for key in settings.CONFIG['documentKeys']:
                i = key['id']
                if i == 'rightslevel':
                    save(i, self.rightslevel)
                if key.get('fulltext'):
                    continue
                elif i not in ('*', 'dimensions') and i not in self.facet_keys:
                    value = data.get(i)
                    if isinstance(value, list):
                        value = '\n'.join(value)
                    save(i, value)

    base_keys = ('id', 'size', 'dimensions', 'extension', 'matches')

    def update_sort(self):
        try:
            s = self.sort
        except Sort.DoesNotExist:
            s = Sort(document=self)

        s.id = self.id
        s.extension = self.extension
        s.size = self.size
        s.matches = self.matches

        if self.extension == 'pdf':
            prefix = 2
            value = self.pages
        else:
            if self.extension == 'html':
                prefix = 1
                value = self.dimensions
            else:
                prefix = 0
                value = self.width * self.height
        if value < 0:
            value = 0
        s.dimensions = ox.sort_string('%d' % prefix) + ox.sort_string('%d' % value)

        def sortNames(values):
            sort_value = ''
            if values:
                sort_value = '; '.join([get_name_sort(name) for name in values])
            if not sort_value:
                sort_value = ''
            return sort_value.lower()

        def set_value(s, name, value):
            if isinstance(value, str):
                value = ox.decode_html(value.lower())
                if not value:
                    value = None
            setattr(s, name, value)

        def get_value(source, key):
            value = self.get_value(source)
            return value

        def get_words(source, key):
            value = get_value(source, key)
            if isinstance(value, list):
                value = '\n'.join(value)
            value = len(value.split(' ')) if value else 0
            return value

        for key in list(filter(lambda k: k.get('sort', False), settings.CONFIG['documentKeys'])):
            name = key['id']
            if name not in self.base_keys:
                source = name
                sort_type = key.get('sortType', key['type'])
                if 'value' in key:
                    if 'key' in key['value']:
                        source = key['value']['key']
                    sort_type = key['value'].get('type', sort_type)
                if isinstance(sort_type, list):
                    sort_type = sort_type[0]
                if sort_type == 'title':
                    value = self.get_value(source, 'Untitled')
                    value = utils.sort_title(value)[:955]
                    set_value(s, name, value)
                elif sort_type == 'person':
                    value = sortNames(self.get_value(source, []))
                    value = utils.sort_string(value)[:955]
                    set_value(s, name, value)
                elif sort_type == 'string':
                    value = self.get_value(source, '')
                    if isinstance(value, list):
                        value = ','.join(value)
                    if not isinstance(value, str):
                        value = str(value)
                    value = utils.sort_string(value)[:955]
                    set_value(s, name, value)
                elif sort_type == 'words':
                    value = get_words(source, key) if s.duration else None
                    set_value(s, name, value)
                elif sort_type == 'wordsperminute':
                    value = get_words(source, key)
                    value = value / (s.duration / 60) if value and s.duration else None
                    set_value(s, name, value)
                elif sort_type in ('length', 'integer', 'time', 'float'):
                    # can be length of strings or length of arrays, i.e. keywords
                    value = self.get_value(source)
                    if isinstance(value, list):
                        value = len(value)
                    set_value(s, name, value)
                elif sort_type == 'year':
                    value = self.get_value(source)
                    set_value(s, name, value)
                elif sort_type == 'date':
                    value = self.get_value(source)
                    if isinstance(value, str):
                        value = datetime_safe.datetime.strptime(value, '%Y-%m-%d')
                    set_value(s, name, value)
        s.save()

    def save(self, *args, **kwargs):
        if not self.uploading:
            if self.file:
                self.size = self.file.size
                self.get_info()
        if self.extension == 'html':
            self.size = len(self.data.get('text', ''))

        is_ready = not self.uploading and (self.file or self.extension == 'html')

        if self.id:
            if is_ready:
                self.update_sort()
                self.update_find()
                self.update_facets()
            new = False
        else:
            new = True
        super(Document, self).save(*args, **kwargs)
        if new:
            if is_ready:
                self.update_sort()
                self.update_find()
                self.update_facets()
        self.update_matches()
        self.update_linked_documents()

    def __str__(self):
        return self.get_id()

    def add(self, item):
        p, created = ItemProperties.objects.get_or_create(item=item, document=self)
        if created:
            p.index = ItemProperties.objects.filter(item=item).aggregate(Max('index'))['index__max'] + 1
            p.save()
            p.document.update_matches()
            item.update_sort()

    def remove(self, item):
        ItemProperties.objects.filter(item=item, document=self).delete()

    @classmethod
    def get(cls, id):
        return cls.objects.get(pk=ox.fromAZ(id))

    def get_absolute_url(self):
        return ('/documents/%s' % quote(self.get_id())).replace('%3A', ':')

    def get_id(self):
        return ox.toAZ(self.id)

    def access(self, user):
        if user.is_anonymous:
            level = 'guest'
        else:
            level = user.profile.get_level()
        editable = self.editable(user)
        if editable:
            return True
        allowed_level = settings.CONFIG['capabilities']['canSeeDocument'][level]
        if self.rightslevel <= allowed_level:
            return True
        return False

    def editable(self, user, item=None):
        if not user or user.is_anonymous:
            return False
        max_level = len(settings.CONFIG['rightsLevels'])
        if self.rightslevel > max_level:
            return False
        if self.user == user or \
           self.groups.filter(id__in=user.groups.all()).count() > 0 or \
           user.is_staff or \
           user.profile.capability('canEditDocuments') is True or \
           (item and item.editable(user)):
            return True
        return False

    def edit(self, data, user, item=None):
        if item:
            p, created = ItemProperties.objects.get_or_create(item=item, document=self)
            if 'description' in data:
                p.description = ox.sanitize_html(data['description'])
                p.save()
        else:
            if 'groups' in data:
                groups = data.pop('groups')
                update_groups(self, groups)
            for key in data:
                if key == "id":
                    continue
                k = list(filter(lambda i: i['id'] == key, settings.CONFIG['documentKeys']))
                ktype = k and k[0].get('type') or ''
                if key == 'text' and self.extension == 'html':
                    self.data['text'] = ox.sanitize_html(data['text'], global_attributes=[
                        'data-name',
                        'data-type',
                        'data-value',
                        'lang'
                    ])
                elif key == 'rightslevel':
                    setattr(self, key, int(data[key]))
                elif ktype == 'text':
                    if data[key]:
                        self.data[key] = ox.sanitize_html(data[key])
                    elif key in self.data:
                        del self.data[key]
                elif ktype == '[text]':
                    self.data[key] = [ox.sanitize_html(t) for t in data[key]]
                elif ktype == '[string]':
                    self.data[key] = [ox.escape_html(t) for t in data[key]]
                elif isinstance(data[key], str):
                    self.data[key] = ox.escape_html(data[key])
                elif isinstance(data[key], list):
                    def cleanup(i):
                        if isinstance(i, str):
                            i = ox.escape_html(i)
                        return i
                    self.data[key] = [cleanup(i) for i in data[key]]
                elif isinstance(data[key], int) or isinstance(data[key], float):
                    self.data[key] = data[key]
                else:
                    if data[key]:
                        self.data[key] = ox.escape_html(data[key])
                    elif key in self.data:
                        del self.data[key]

    @property
    def dimensions(self):
        if self.extension == 'pdf':
            return self.pages
        elif self.extension == 'html':
            return len(self.data.get('text', '').split(' '))
        else:
            return self.resolution

    @property
    def resolution(self):
        return [self.width, self.height]

    def get_value(self, key, default=None):
        if key in (
            'extension',
            'id',
            'matches',
            'ratio',
            'size',
            'rightslevel',
        ):
            return getattr(self, key)
        document_key = utils.get_by_id(settings.CONFIG['documentKeys'], key)
        if document_key and 'value' in document_key \
                and isinstance(document_key['value'], dict) \
                and document_key['value'].get('type') == 'map' \
                and self.get_value(document_key['value']['key']):
            value = re.compile(document_key['value']['map']).findall(self.get_value(document_key['value']['key']))
            if value and document_key['value'].get('format'):
                value = [document_key['value']['format'].format(value[0])]
            return value[0] if value else default
        elif key == 'user':
            return self.user.username
        else:
            return self.data.get(key, default)

    def json(self, keys=None, user=None, item=None):
        if not keys:
            keys = [
                'description',
                'dimensions',
                'editable',
                'entities',
                'extension',
                'id',
                'oshash',
                'title',
                'ratio',
                'matches',
                'size',
                'user',
                'groups',
                'referenced',
            ]
            if self.extension in ('html', 'txt'):
                keys.append('text')
            for key in settings.CONFIG['documentKeys']:
                if key['id'] in ('*', ):
                    continue
                if key['id'] not in keys:
                    keys.append(key['id'])
        response = {}
        _map = {
        }
        for key in keys:
            if key == 'id':
                response[key] = self.get_id()
            elif key == 'editable':
                response[key] = self.editable(user)
            elif key == 'user':
                response[key] = self.user.username
            elif key == 'groups':
                response[key] = [g.name for g in self.groups.all()]
            elif key == 'accessed':
                response[key] = self.accessed.aggregate(Max('access'))['access__max']
            elif key == 'timesaccessed':
                response[key] = self.accessed.aggregate(Sum('accessed'))['accessed__sum']
            elif key == 'entities':
                dps = self.documentproperties.select_related('entity').order_by('index')
                response[key] = entity_jsons = []
                for dp in dps:
                    entity_json = dp.entity.json(['id', 'type', 'name'])
                    entity_json['data'] = dp.data
                    entity_jsons.append(entity_json)
            elif key == 'referenced':
                response[key] = self.referenced()
            elif key in self.data:
                response[key] = self.data[key]
            elif hasattr(self, _map.get(key, key)):
                response[key] = getattr(self, _map.get(key, key)) or ''
        if self.extension == 'html':
            response['text'] = self.data.get('text', '')
        if item:
            if isinstance(item, str):
                item = Item.objects.get(public_id=item)
            d = self.descriptions.filter(item=item)
            if d.exists():
                if 'description' in keys and d[0].description:
                    response['description'] = d[0].description
                response['index'] = d[0].index
        if response.get('ratio') == -1:
            response['ratio'] = settings.CONFIG['posters']['ratio']
        if keys:
            for key in list(response):
                if key not in keys:
                    del response[key]
        return response

    def path(self, name=''):
        h = ox.toAZ(self.id)
        h = (7-len(h))*'0' + h
        return os.path.join('documents', h[:2], h[2:4], h[4:6], h[6:], name)

    def save_chunk(self, chunk, offset=None, done=False):
        if self.uploading:
            name = 'data.%s' % self.extension
            name = self.path(name)

            def done_cb():
                if done:
                    self.uploading = False
                    self.get_info()
                    self.get_ratio()
                    self.oshash = ox.oshash(self.file.path)
                    self.save()
                    self.delete_cache()
                    tasks.extract_fulltext.delay(self.id)
                return True, self.file.size

            return save_chunk(self, self.file, chunk, offset, name, done_cb)
        return False, 0

    def thumbnail(self, size=None, page=None):
        if not self.file:
            return os.path.join(settings.STATIC_ROOT, 'png/document.png')
        src = self.file.path
        folder = os.path.dirname(src)
        if size:
            size = int(size)
            path = os.path.join(folder, '%d.jpg' % size)
        else:
            path = src
        if self.extension == 'pdf':
            crop = []
            if page:
                if ',' in page:
                    crop = list(map(int, page.split(',')))
                    page = crop[0]
                    crop = crop[1:]
                else:
                    page = int(page)
            if page and page > 1 and page <= self.pages:
                src = os.path.join(folder, '1024p%d.jpg' % page)
            else:
                src = os.path.join(folder, '1024p1.jpg')
                page = 1
            if not os.path.exists(src):
                self.extract_page(page)
            if size:
                path = os.path.join(folder, '%dp%d.jpg' % (size, page))
            if len(crop) == 4:
                path = os.path.join(folder, '%dp%d,%s.jpg' % (1024, page, ','.join(map(str, crop))))
                if not os.path.exists(path):
                    img = open_image_rgb(src).crop(crop)
                    img.save(path)
                else:
                    img = open_image_rgb(path)
                src = path
                if size < max(img.size):
                    path = os.path.join(folder, '%dp%d,%s.jpg' % (size, page, ','.join(map(str, crop))))
                    if not os.path.exists(path):
                        resize_image(src, path, size=size)
        elif self.extension in ('jpg', 'png', 'gif'):
            if os.path.exists(src):
                if size and page:
                    crop = list(map(int, page.split(',')))
                    if len(crop) == 4:
                        path = os.path.join(folder, '%s.jpg' % ','.join(map(str, crop)))
                        if not os.path.exists(path):
                            img = open_image_rgb(src).convert('RGB').crop(crop)
                            img.save(path)
                        else:
                            img = open_image_rgb(path)
                        src = path
                        if size < max(img.size):
                            path = os.path.join(folder, '%sp%s.jpg' % (size, ','.join(map(str, crop))))
                            if not os.path.exists(path):
                                resize_image(src, path, size=size)
        if os.path.exists(src) and not os.path.exists(path):
            image_size = max(self.width, self.height)
            if image_size == -1:
                image_size = max(*open_image_rgb(src).size)
            if size > image_size:
                path = src
            else:
                resize_image(src, path, size=size)
        return path

    def extract_page(self, page):
        pdf = self.file.path
        image = os.path.join(os.path.dirname(pdf), '1024p%d.jpg' % page)
        utils.extract_pdfpage(pdf, image, page)

    def create_pages(self):
        for page in range(self.pages):
            page += 1
            p, c = Page.objects.get_or_create(document=self, page=page)

    def get_info(self):
        if self.extension == 'pdf':
            self.thumbnail(1024)
            if self.pages == -1:
                self.width = -1
                self.height = -1
                self.pages = utils.pdfpages(self.file.path)
        elif self.width == -1:
            self.pages = -1
            self.width, self.height = open_image_rgb(self.file.path).size

    def get_ratio(self):
        if self.extension == 'pdf':
            image = self.thumbnail(1024)
            try:
                size = Image.open(image).size
            except:
                size = [1, 1]
        else:
            if self.width > 0:
                size = self.resolution
            else:
                size = [-1, 1]
        self.ratio = size[0] / size[1]
        return self.ratio

    def urls(self):
        urls = [self.get_absolute_url()]
        url = unquote(urls[0])
        if url != urls[0]:
            urls.append(url)
        return urls

    def referenced(self):
        result = {}
        result['items'] = [
            i.json(keys=['id', 'title'])
            for i in self.items.all().order_by('sort__title')
        ]
        result['annotations'] = [
            a.json(keys=['id', 'title', 'in'])
            for a in self.annotations.all().order_by('start', 'end')
        ]
        result['documents'] = [
            d.json(keys=['id', 'title'])
            for d in self.linking_documents.all().order_by('sort__title')
        ]
        result['entities'] = [
            e.json(keys=['id', 'name'])
            for e in self.entities.all()
        ]
        return result

    def update_linked_documents(self):
        if self.extension == 'html':
            old = [d.id for d in self.linked_documents.all()]
            current = utils.get_documents(self.data.get('text', ''))
            removed = list(set(old) - set(current))
            added = list(set(current) - set(old))
            if removed:
                for document in Document.objects.filter(id__in=removed):
                    self.linked_documents.remove(document)
            if added:
                for document in Document.objects.filter(id__in=added):
                    self.linked_documents.add(document)

    def update_matches(self):
        urls = self.urls()
        matches = self.items.count() + self.entities.count()
        for url in urls:
            matches += Annotation.objects.filter(value__contains=url).count()
            matches += Item.objects.filter(data__contains=url).count()
            matches += Document.objects.filter(extension='html', data__contains=url).count()
        if matches != self.matches:
            Document.objects.filter(id=self.id).update(matches=matches)
            self.matches = matches

    def delete_cache(self):
        if self.file:
            folder = os.path.dirname(self.file.path)
            for f in glob('%s/*' % folder):
                if f != self.file.path:
                    os.unlink(f)

def delete_document(sender, **kwargs):
    t = kwargs['instance']
    if t.file:
        t.delete_cache()
        t.file.delete(save=False)
    t.delete_fulltext()
pre_delete.connect(delete_document, sender=Document)

class ItemProperties(models.Model):

    class Meta:
        unique_together = ("item", "document")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    document = models.ForeignKey(Document, related_name='descriptions', on_delete=models.CASCADE)
    description = models.TextField(default="")
    index = models.IntegerField(default=0)

    description_sort = models.CharField(max_length=512, null=True)

    def save(self, *args, **kwargs):
        if self.description:
            self.description_sort = ox.sort_string(self.description)[:512].lower()
        else:
            self.description_sort = self.document.sort.description

        super(ItemProperties, self).save(*args, **kwargs)


class Page(models.Model, FulltextPageMixin):

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    document = models.ForeignKey(Document, related_name='pages_set', on_delete=models.CASCADE)
    page = models.IntegerField(default=1)
    data = JSONField(default=dict, editable=False)

    objects = managers.PageManager()

    def __str__(self):
        return u"%s:%s" % (self.document, self.page)

    def json(self, keys=None, user=None):
        data = {}
        data['document'] = ox.toAZ(self.document.id)
        data['page'] = self.page
        data['id'] = '{document}/{page}'.format(**data)
        document_keys = []
        if keys:
            for key in list(data):
                if key not in keys:
                    del data[key]
            for key in keys:
                if 'fulltext' in key:
                    data['fulltext'] = self.extract_fulltext()
                elif key in ('document', 'page', 'id'):
                    pass
                else:
                    document_keys.append(key)
        if document_keys:
            data.update(self.document.json(document_keys, user))
        return data

class Access(models.Model):
    class Meta:
        unique_together = ("document", "user")

    access = models.DateTimeField(auto_now=True)
    document = models.ForeignKey(Document, related_name='accessed', on_delete=models.CASCADE)
    user = models.ForeignKey(User, null=True, related_name='accessed_documents', on_delete=models.CASCADE)
    accessed = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.accessed:
            self.accessed = 0
        self.accessed += 1
        super(Access, self).save(*args, **kwargs)
        timesaccessed = Access.objects.filter(document=self.document).aggregate(Sum('accessed'))['accessed__sum']
        Sort.objects.filter(document=self.document).update(timesaccessed=timesaccessed, accessed=self.access)

    def __str__(self):
        if self.user:
            return "%s/%s/%s" % (self.user, self.document, self.access)
        return "%s/%s" % (self.item, self.access)

class Facet(models.Model):
    '''
        used for keys that can have multiple values like people, languages etc.
        does not perform to well if total number of items goes above 10k
        this happens for keywords in 0xdb right now
    '''

    class Meta:
        unique_together = ("document", "key", "value")

    document = models.ForeignKey('Document', related_name='facets', on_delete=models.CASCADE)
    key = models.CharField(max_length=200, db_index=True)
    value = models.CharField(max_length=1000, db_index=True)
    sortvalue = models.CharField(max_length=1000, db_index=True)

    def __str__(self):
        return "%s=%s" % (self.key, self.value)

    def save(self, *args, **kwargs):
        if not self.sortvalue:
            self.sortvalue = utils.sort_string(self.value).lower()[:900]
        self.sotvalue = self.sortvalue.lower()
        super(Facet, self).save(*args, **kwargs)

Document.facet_keys = []
for key in settings.CONFIG['documentKeys']:
    if 'autocomplete' in key and 'autocompleteSortKey' not in key or \
            key.get('filter'):
        Document.facet_keys.append(key['id'])

Document.person_keys = []
for key in settings.CONFIG['itemKeys']:
    if key.get('sortType') == 'person':
        Document.person_keys.append(key['id'])

class Find(models.Model):

    class Meta:
        unique_together = ('document', 'key')

    document = models.ForeignKey('Document', related_name='find', db_index=True, on_delete=models.CASCADE)
    key = models.CharField(max_length=200, db_index=True)
    value = models.TextField(blank=True, db_index=settings.DB_GIN_TRGM)

    def __str__(self):
        return '%s=%s' % (self.key, self.value)

'''
Sort
table constructed based on info in settings.CONFIG['documentKeys']
'''
attrs = {
    '__module__': 'document.models',
    'document': models.OneToOneField('Document', related_name='sort', primary_key=True, on_delete=models.CASCADE),
    'created': models.DateTimeField(null=True, blank=True, db_index=True),
}
for key in list(filter(lambda k: k.get('sort', False) or k['type'] in ('integer', 'time', 'float', 'date', 'enum'), settings.CONFIG['documentKeys'])):
    name = key['id']
    sort_type = key.get('sortType', key['type'])
    if isinstance(sort_type, list):
        sort_type = sort_type[0]
    field = get_sort_field(sort_type)
    if name not in attrs:
        attrs[name] = field[0](**field[1])

Sort = type('Sort', (models.Model,), attrs)
Sort.fields = [f.name for f in Sort._meta.fields]
