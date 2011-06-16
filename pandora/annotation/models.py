# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models
from django.contrib.auth.models import User
import ox

import utils


def load_layers(layers):
    for l in layers:
        create_or_update_layer(l)

def create_or_update_layer(data):
    layer, created = Layer.objects.get_or_create(name=data['id'])
    for key in ('title', 'type', 'overlap', 'overlay', 'private'):
        if key in data and getattr(layer, key) != data[key]:
            setattr(layer, key, data[key])
            created = True
    if created:
        layer.save()
    return layer

class Layer(models.Model):

    class Meta:
        ordering = ('position', )

    enabled = models.BooleanField(default=True)

    name = models.CharField(null=True, max_length=255, unique=True)
    title = models.CharField(null=True, max_length=255)
    #text, string, string from list(fixme), date, place, person, pingback,
    #What about: smart layers? for date, place, person
    type = models.CharField(null=True, max_length=255)

    #can this be changed per user?
    position = models.IntegerField(default=0)

    overlap = models.BooleanField(default=True)
    overlay = models.BooleanField(default=True)
    private = models.BooleanField(default=False)   #false=users only see there own bins

    #find/sort integration
    find = models.BooleanField(default=True) #true part of find all
    #words / item duration(wpm), total words, cuts per minute, cuts, number of annotations, number of annotations/duration
    sort = models.CharField(null=True, max_length=255)

    def properties(self):
        p = {}
        if self.find:
            p[self.name] = {'type': 'bin', 'find': True}
        if self.sort:
            print 'FIXME: need to add sort stuff'
        return p

    def json(self):
        return {
            'id': self.name,
            'overlap': self.overlap,
            'private': self.private,
            'title': self.title,
            'type': self.type
        }

    def __unicode__(self):
        return self.title


class Annotation(models.Model):

    #FIXME: here having a item,start index would be good
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User)
    item = models.ForeignKey('item.Item', related_name='annotations')

    #seconds
    start = models.FloatField(default=-1)
    end = models.FloatField(default=-1)

    layer = models.ForeignKey(Layer)
    value = models.TextField()

    def editable(self, user):
        if user.is_authenticated():
            if user.is_staff or \
               self.user == user or \
               user.groups.filter(id__in=self.groups.all()).count() > 0:
                return True
        return False

    def html(self):
        if self.layer.type == 'string':
            return utils.html_parser(self.value)
        else:
            return self.value

    def get_id(self):
        return ox.to32(self.id)

    def json(self, layer=False, keys=None):
        j = {
            'id': self.get_id(),
            'user': self.user.username,
            'in': self.start,
            'out': self.end,
            'value': self.value,
            'created': self.created,
            'modified': self.modified
        }
        if layer:
            j['layer'] = self.layer.name
        if keys:
            _j = {}
            for key in keys:
                if key in j:
                    _j[key] = j[key]
            j = _j
            if 'aspectRatio' in keys:
                j['aspectRatio'] = self.item.stream_aspect
            if 'item' in keys:
                j['item'] = self.item.itemId
        return j

    def __unicode__(self):
        return u"%s/%s-%s" %(self.item, self.start, self.end)

