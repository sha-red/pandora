# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement
import os
import re
from glob import glob
import subprocess
from urllib import quote, unquote

from django.db import models
from django.db.models import Max
from django.contrib.auth.models import User
from django.db.models.signals import pre_delete

import Image
import ox

from item.models import Item
from archive.extract import resize_image
from archive.chunk import save_chunk

import managers
import utils


class Document(models.Model):

    class Meta:
        unique_together = ("user", "name", "extension")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(User, related_name='files')
    name = models.CharField(max_length=255)
    extension = models.CharField(max_length=255)
    size = models.IntegerField(default=0)
    matches = models.IntegerField(default=0)
    ratio = models.FloatField(default=1)
    pages = models.IntegerField(default=-1)
    width = models.IntegerField(default=-1)
    height = models.IntegerField(default=-1)
    description = models.TextField(default="")
    oshash = models.CharField(max_length=16, unique=True, null=True)

    file = models.FileField(default=None, blank=True,null=True, upload_to=lambda f, x: f.path(x))

    objects = managers.DocumentManager()
    uploading = models.BooleanField(default = False)

    name_sort = models.CharField(max_length=255, null=True)
    description_sort = models.CharField(max_length=512, null=True)
    dimensions_sort = models.CharField(max_length=512)

    items = models.ManyToManyField(Item, through='ItemProperties', related_name='documents')

    def save(self, *args, **kwargs):
        if not self.uploading:
            if self.file:
                self.size = self.file.size
                self.get_info()

        self.name_sort = ox.sort_string(self.name or u'')[:255].lower()
        if self.description:
            self.description_sort = ox.sort_string(self.description)[:512].lower()
        else:
            self.description_sort = None
        if self.extension == 'pdf':
            self.dimensions_sort = ox.sort_string('1') + ox.sort_string('%d' % self.pages)
        else:
            resolution_sort = self.width * self.height
            self.dimensions_sort = ox.sort_string('0') + ox.sort_string('%d' % resolution_sort)

        super(Document, self).save(*args, **kwargs)
        self.update_matches()

    def __unicode__(self):
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

    def editable(self, user):
        if not user or user.is_anonymous():
            return False
        if self.user == user or \
           user.is_staff or \
           user.get_profile().capability('canEditDocuments') == True:
            return True
        return False

    def edit(self, data, user, item=None):
        for key in data:
            if key == 'name':
                data['name'] = re.sub(' \[\d+\]$', '', data['name']).strip()
                if not data['name']:
                    data['name'] = "Untitled"
                name = data['name']
                num = 1
                while Document.objects.filter(name=name, user=self.user, extension=self.extension).exclude(id=self.id).count()>0:
                    num += 1
                    name = data['name'] + ' [%d]' % num
                self.name = name
            elif key == 'description' and not item:
                self.description = ox.sanitize_html(data['description'])
        if item:
            p, created = ItemProperties.objects.get_or_create(item=item, document=self)
            if 'description' in data:
                p.description = ox.sanitize_html(data['description'])
                p.save()

    @property
    def dimensions(self):
        if self.extension == 'pdf':
            return self.pages
        else:
            return self.resolution

    @property
    def resolution(self):
        return [self.width, self.height]

    def json(self, keys=None, user=None, item=None):
        if not keys:
            keys=[
                'description',
                'dimensions',
                'editable',
                'id',
                'name',
                'extension',
                'oshash',
                'size',
                'ratio',
                'user',
            ]
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
            elif hasattr(self, _map.get(key, key)):
                response[key] = getattr(self, _map.get(key,key)) or ''
        if item:
            if isinstance(item, basestring):
                item = Item.objects.get(itemId=item)
            d = self.descriptions.filter(item=item)
            if d.exists():
                if 'description' in keys and d[0].description:
                    response['description'] = d[0].description
                response['index'] = d[0].index
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
                return True, self.file.size

            return save_chunk(self, self.file, chunk, offset, name, done_cb)
        return False, 0

    def thumbnail(self, size=None, page=None):
        src = self.file.path
        folder = os.path.dirname(src)
        if size:
            size = int(size)
            path = os.path.join(folder, '%d.jpg' % size)
        else:
            path = src
        if self.extension == 'pdf':
            if page:
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
        if os.path.exists(src) and not os.path.exists(path):
            image_size = max(self.width, self.height)
            if image_size == -1:
                image_size = max(*Image.open(src).size)
            if size > image_size:
                path = src
            else:
                resize_image(src, path, size=size)
        return path

    def extract_page(self, page):
        pdf = self.file.path
        image = os.path.join(os.path.dirname(pdf), '1024p%d.jpg' % page)
        utils.extract_pdfpage(pdf, image, page)

    def get_info(self):
        if self.extension == 'pdf':
            self.thumbnail()
            if self.pages == -1:
                self.width = -1
                self.height = -1
                self.pages = utils.pdfpages(self.file.path)
        elif self.width == -1:
            self.pages = -1
            self.width, self.height = Image.open(self.file.path).size

    def get_ratio(self):
        if self.extension == 'pdf':
            image = self.thumbnail()
            try:
                size = Image.open(image).size
            except:
                size = [1,1]
        else:
            if self.width > 0:
                size = self.resolution
            else:
                size = [1,1]
        self.ratio = size[0] / size[1]
        return self.ratio

    def update_matches(self):
        import annotation.models
        import item.models
        import text.models
        urls = [self.get_absolute_url()]
        url = unquote(urls[0])
        if url != urls[0]:
            urls.append(url)
        matches = self.items.count()
        for url in urls:
            matches += annotation.models.Annotation.objects.filter(value__contains=url).count()
            matches += item.models.Item.objects.filter(data__contains=url).count()
            matches += text.models.Text.objects.filter(text__contains=url).count()
        if matches != self.matches:
            Document.objects.filter(id=self.id).update(matches=matches)
            self.matches = matches

def delete_document(sender, **kwargs):
    t = kwargs['instance']
    if t.file:
        folder = os.path.dirname(t.file.path)
        for f in glob('%s/*' % folder):
            if f != t.file.path:
                os.unlink(f)
        t.file.delete()
pre_delete.connect(delete_document, sender=Document)

class ItemProperties(models.Model):

    class Meta:
        unique_together = ("item", "document")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    item = models.ForeignKey(Item)
    document = models.ForeignKey(Document, related_name='descriptions')
    description = models.TextField(default="")
    index = models.IntegerField(default=0)

    description_sort = models.CharField(max_length=512, null=True)

    def save(self, *args, **kwargs):
        if self.description:
            self.description_sort = ox.sort_string(self.description)[:512].lower()
        else:
            self.description_sort = self.document.description_sort

        super(ItemProperties, self).save(*args, **kwargs)
