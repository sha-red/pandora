# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, print_function, absolute_import

from six import string_types
from six.moves.urllib.parse import quote

from django.db import models
from django.db.models import Max
import ox

from oxdjango import fields


class Item(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    active = models.BooleanField(default=True)
    index = models.IntegerField(default=-1)
    data = fields.DictField(default={}, editable=False)

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

    def json(self, keys=None):
        j = {
            'id': self.get_id(),
            'active': self.active,
            'index': self.index,
        }
        j.update(self.data)
        if 'contentid' in j:
            content_keys = [
                'description',
                'modified',
                'name',
                'user',
            ]
            type = j.get('type')
            if type == 'list':
                from itemlist.models import List
                content = List.get(j['contentid']).json(keys=content_keys)
            elif type == 'edit':
                from edit.models import Edit
                content = Edit.get(j['contentid']).json(keys=content_keys)
            elif type == 'collection':
                from documentcollection.models import Collection
                content = Collection.get(j['contentid']).json(keys=content_keys)
            j['title'] = content['name']
            j['text'] = content['description']

            j['image'] = '/' + '/'.join([
                type, quote(content['user'] + ':' + content['name']),
                'icon256.jpg?%s' % content['modified'].strftime('%Y-%m-%dT%H:%M:%SZ')
            ])
        if keys:
            for key in list(j):
                if key not in keys:
                    del j[key]
        return j

    def __unicode__(self):
        return u"%s" % (self.get_id())
