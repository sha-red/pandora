# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, print_function, absolute_import

import os
import re
from glob import glob
import unicodedata

from six import string_types
from six.moves.urllib.parse import quote, unquote
from django.db import models, transaction
from django.db.models import Max
from django.contrib.auth.models import User
from django.db.models.signals import pre_delete, post_init
from django.conf import settings

import ox
from oxdjango import fields

from person.models import get_name_sort
from item.utils import get_by_id
from document.models import Document

from . import managers


class Entity(models.Model):

    class Meta:
        unique_together = ("type", "name")

    user = models.ForeignKey(User, related_name='entities', null=True, default=None)

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    type = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    alternativeNames = fields.TupleField(default=())

    data = fields.DictField(default={}, editable=False)
    matches = models.IntegerField(default=0)

    objects = managers.EntityManager()

    name_sort = models.CharField(max_length=255, null=True)
    name_find = models.TextField(default='', editable=True)

    documents = models.ManyToManyField(Document, through='DocumentProperties', related_name='entities')

    def save(self, *args, **kwargs):
        entity = get_by_id(settings.CONFIG['entities'], self.type)
        if entity.get('sortType') == 'person' and self.name:
            if isinstance(self.name, str):
                self.name = self.name.decode('utf-8')
            self.name_sort = get_name_sort(self.name)[:255].lower()
        else:
            self.name_sort = ox.sort_string(self.name or u'')[:255].lower() or None
        self.name_find = '||' + '||'.join((self.name,) + self.alternativeNames) + '||'
        self.name_find = self.name_find.lower()
        super(Entity, self).save(*args, **kwargs)
        self.update_matches()
        self.update_annotations()
        self.update_find()

    def __unicode__(self):
        return self.get_id()

    @classmethod
    def get(cls, id):
        return cls.objects.get(pk=ox.fromAZ(id))

    @classmethod
    def get_by_name(cls, name, type):
        return cls.objects.get(name_find__contains=u'|%s|' % name.lower(), type=type)

    @classmethod
    def get_or_create(model, name):
        qs = model.objects.filter(name_find__contains=u'|%s|' % name.lower())
        if qs.count() == 0:
            instance = model(name=name)
            instance.save()
        else:
            instance = qs[0]
        return instance

    def get_absolute_url(self):
        return ('/entities/%s' % quote(self.get_id())).replace('%3A', ':')

    def get_id(self):
        return ox.toAZ(self.id)

    def add(self, document):
        p, created = DocumentProperties.objects.get_or_create(document=document, entity=self)
        if created:
            p.index = DocumentProperties.objects.filter(entity=self).aggregate(Max('index'))['index__max'] + 1
            p.save()
            p.document.update_matches()

    def remove(self, document):
        DocumentProperties.objects.filter(document=document, entity=self).delete()

    def editable(self, user, item=None):
        if not user or user.is_anonymous():
            return False
        if user.is_staff or \
           user.profile.capability('canEditEntities') == True or \
           (item and item.editable(user)):
            return True
        return False

    def edit(self, data):
        for key in data:
            if key == 'name':
                data['name'] = re.sub(' \[\d+\]$', '', data['name']).strip()
                if not data['name']:
                    data['name'] = "Unnamed"
                name = data['name']
                n = 1
                while Entity.objects.filter(name_find__contains=u'|%s|' % name.lower()).exclude(id=self.id).count() > 0:
                    n += 1
                    name = data['name'] + ' [%d]' % n
                self.name = name
            elif key == 'type':
                self.type = data[key]
            elif key == 'alternativeNames':
                used_names = [self.name.lower()]
                names = []
                for v in data[key]:
                    name = ox.decode_html(v)
                    name = re.sub(' \[\d+\]$', '', name).strip()
                    name_ = name
                    n = 1
                    while name in used_names or \
                        Entity.objects.filter(name_find__contains=u'|%s|' % name.lower()).exclude(id=self.id).count() > 0:
                        n += 1
                        name = name_ + ' [%d]' % n
                    names.append(name)
                    used_names.append(name.lower())
                self.alternativeNames = tuple(ox.escape_html(n) for n in names)
            else:
                #FIXME: more data validation
                if isinstance(data[key], string_types):
                    self.data[key] = ox.sanitize_html(data[key])
                else:
                    self.data[key] = data[key]

    def json(self, keys=None, user=None):
        if not keys:
            keys = [
                'alternativeNames',
                'editable',
                'id',
                'name',
                'sortName',
                'type',
                'user',
                'documents',
            ] + list(self.data)
        response = {}
        for key in keys:
            if key == 'id':
                response[key] = self.get_id()
            elif key == 'editable':
                response[key] = self.editable(user)
            elif key == 'user':
                response[key] = self.user and self.user.username
            elif key in ('name', 'alternativeNames', 'type'):
                response[key] = getattr(self, key)
            elif key == 'sortName':
                response[key] = self.name_sort
            elif key == 'documents':
                response[key] = [ox.toAZ(id_)
                    for id_, in self.documentproperties.order_by('index').values_list('document_id')]
            elif key in self.data:
                response[key] = self.data[key]
        return response

    def annotation_value(self):
        #return u'<a href="/entities/%s">%s</a>' % (self.get_id(), ox.escape_html(self.name))
        return ox.escape_html(self.name)

    def update_find(self):

        def save(key, value):
            if value not in ('', None):
                f, created = Find.objects.get_or_create(entity=self, key=key)
                if isinstance(value, bool):
                    value = value and 'true' or 'false'
                if isinstance(value, string_types):
                    value = ox.decode_html(ox.strip_tags(value.strip()))
                    value = unicodedata.normalize('NFKD', value).lower()
                f.value = value
                f.save()
            else:
                Find.objects.filter(entity=self, key=key).delete()

        entity = get_by_id(settings.CONFIG['entities'], self.type)
        if not entity:
            return
        with transaction.atomic():
            ids = ['name']
            for key in entity['keys']:
                value = self.data.get(key['id'])
                if isinstance(value, list):
                    value = u'\n'.join(value)
                save(key['id'], value)
                ids.append(key['id'])
            save('name', u'\n'.join([self.name] + list(self.alternativeNames)))
            self.find.exclude(key__in=ids).delete()

    def update_matches(self):
        import annotation.models
        import item.models
        import text.models
        urls = [self.get_absolute_url()]
        url = unquote(urls[0])
        if url != urls[0]:
            urls.append(url)
        entity_layers = [l['id'] for l in settings.CONFIG['layers'] if l['type'] == 'entity']
        if entity_layers:
            matches = annotation.models.Annotation.objects.filter(layer__in=entity_layers, value=self.get_id()).count()
        else:
            matches = 0
        for url in urls:
            matches += annotation.models.Annotation.objects.filter(value__contains=url).count()
            matches += item.models.Item.objects.filter(data__contains=url).count()
            matches += text.models.Text.objects.filter(text__contains=url).count()
        if matches != self.matches:
            Entity.objects.filter(id=self.id).update(matches=matches)
            self.matches = matches

    def update_annotations(self):
        import annotation.models
        import annotation.tasks

        if self.name == self._original_name:
            return

        entity_layers = [l['id'] for l in settings.CONFIG['layers'] if l['type'] == 'entity']
        if entity_layers:
            annotation.tasks.update_annotations.delay(entity_layers, self.get_id())


def entity_post_init(sender, instance, **kwargs):
    instance._original_name = instance.name


post_init.connect(
    entity_post_init,
    sender=Entity,
)


class DocumentProperties(models.Model):

    class Meta:
        unique_together = ("entity", "document")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    document = models.ForeignKey(Document, related_name='documentproperties')
    entity = models.ForeignKey(Entity, related_name='documentproperties')
    index = models.IntegerField(default=0)
    data = fields.DictField(default={})

    def __unicode__(self):
        return u"%r-%r" % (self.document, self.entity)

    def save(self, *args, **kwargs):

        super(DocumentProperties, self).save(*args, **kwargs)

class Find(models.Model):

    class Meta:
        unique_together = ("entity", "key")

    entity = models.ForeignKey('Entity', related_name='find', db_index=True)
    key = models.CharField(max_length=200, db_index=True)
    value = models.TextField(blank=True, db_index=settings.DB_GIN_TRGM)

    def __unicode__(self):
        return u"%s=%s" % (self.key, self.value)
