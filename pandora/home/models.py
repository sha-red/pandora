# -*- coding: utf-8 -*-
from __future__ import division, print_function, absolute_import

from six import string_types
from six.moves.urllib.parse import quote

from django.db import models
from django.db.models import Max
from django.db.models.signals import pre_delete
from django.utils.encoding import python_2_unicode_compatible
from oxdjango.fields import JSONField

import ox

from itemlist.models import List
from edit.models import Edit
from documentcollection.models import Collection


@python_2_unicode_compatible
class Item(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    active = models.BooleanField(default=True)
    index = models.IntegerField(default=-1)
    data = JSONField(default=dict, editable=False)

    def editable(self, user):
        return user.is_authenticated() and user.profile.capability("canManageHome")

    def edit(self, data):
        changed = False
        for key in (
            'contentid',
            'crop',
            'image',
            'link',
            'text',
            'title',
            'type',
        ):
            if key in data and self.data.get(key) != data[key]:
                if key == 'crop':
                    if not (isinstance(data[key], list) and
                            len([d for d in data[key] if isinstance(d, int)]) == 4):
                        return False
                else:
                    if not isinstance(data[key], string_types):
                        return False
                self.data[key] = data[key]
                if key == 'contentid' and self.data[key]:
                    content = self.get_content()
                    if not content:
                        return False
                changed = True
        if 'type' in data:
            if data['type'] == 'custom':
                if 'contentid' in self.data:
                    del self.data['contentid']
                    changed = True
            else:
                for key in list(self.data):
                    if key not in ('contentid', 'type'):
                        del self.data[key]
                        changed = True
        if 'active' in data:
            self.active = data['active'] is True
            idx = Item.objects.filter(active=self.active).aggregate(Max('index'))['index__max']
            if idx is None:
                self.index = 0
            else:
                self.index = idx + 1
            changed = True
        if changed:
            self.save()
        return True

    def save(self, *args, **kwargs):
        if self.index == -1:
            idx = Item.objects.all().aggregate(Max('index'))['index__max']
            idx = 0 if idx is None else idx + 1
            self.index = idx
        super(Item, self).save(*args, **kwargs)

    def get(self, id):
        return self.objects.get(id=ox.fromAZ(id))

    def get_id(self):
        return ox.toAZ(self.id)

    def get_content(self):
        content_keys = [
            'description',
            'modified',
            'name',
            'user',
        ]
        type = self.data.get('type')
        contentid = self.data.get('contentid')
        if not contentid:
            return None
        data = None
        content = None
        try:
            if type == 'list':
                content = List.get(contentid)
                data = content.json(keys=content_keys)
                data['link'] = '/list==' + quote(data['user'] + ':' + data['name'])
            elif type == 'edit':
                content = Edit.get(contentid)
                data = content.json(keys=content_keys)
                data['link'] = '/edits/' + quote(data['user'] + ':' + data['name'])
            elif type == 'collection':
                content = Collection.get(contentid)
                data = content.json(keys=content_keys)
                data['link'] = '/documents/collection==' + quote(data['user'] + ':' + data['name'])
        except:
            return None
        if content and content.status == 'private':
            self.delete()
            data = None
        return data

    def is_public(self):
        type = self.data.get('type')
        return type == 'custom' or self.get_content() is not None

    def json(self, keys=None):
        j = {
            'id': self.get_id(),
            'active': self.active,
            'index': self.index,
        }
        j.update(self.data)
        if 'contentid' in j:
            try:
                content = self.get_content()
                if content:
                    j['title'] = content['name']
                    j['text'] = content['description']
                    j['link'] = content['link']
                    j['image'] = '/' + '/'.join([
                        j['type'], quote(content['user'] + ':' + content['name']),
                        'icon256.jpg?%s' % content['modified'].strftime('%Y-%m-%dT%H:%M:%SZ')
                    ])
            except:
                pass
        if keys:
            for key in list(j):
                if key not in keys:
                    del j[key]
        return j

    def __str__(self):
        return u"%s" % (self.get_id())

def delete_item(type, contentid):
    for home in Item.objects.all():
        if type == home.data.get('type') and contentid == home.data.get('contentid'):
            home.delete()

def delete_list(sender, **kwargs):
    delete_item('list', kwargs['instance'].get_id())
pre_delete.connect(delete_list, sender=List)

def delete_edit(sender, **kwargs):
    delete_item('edit', kwargs['instance'].get_id())
pre_delete.connect(delete_edit, sender=Edit)

def delete_collection(sender, **kwargs):
    delete_item('collection', kwargs['instance'].get_id())
pre_delete.connect(delete_collection, sender=Collection)
