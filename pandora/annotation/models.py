# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models
from django.contrib.auth.models import User
import ox

from archive import extract
from clip.models import Clip


import managers
import utils
from tasks import update_matching_events, update_matching_places



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

    #class Meta:
    #    ordering = ('position', )

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
    objects = managers.AnnotationManager()

    #FIXME: here having a item,start index would be good
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User)
    item = models.ForeignKey('item.Item', related_name='annotations')
    clip = models.ForeignKey('clip.Clip', null=True, related_name='annotations')

    public_id = models.CharField(max_length=128, unique=True, null=True)
    #seconds
    start = models.FloatField(default=-1, db_index=True)
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
    
    def set_public_id(self):
        if self.id:
            public_id = Annotation.objects.filter(item=self.item, id__lt=self.id).count()
            self.public_id = "%s/%s" % (self.item.itemId, ox.to26(public_id))
            Annotation.objects.filter(id=self.id).update(public_id=self.public_id)

    def save(self, *args, **kwargs):
        set_public_id = not self.id or not self.public_id

        #no clip or update clip
        if not self.clip and not self.layer.private or \
            (self.clip and not self.layer.private and \
                self.start != self.clip.start or self.end != self.clip.end):
            self.clip, created = Clip.get_or_create(self.item, self.start, self.end)

        super(Annotation, self).save(*args, **kwargs)
        if set_public_id:
            self.set_public_id()

        Clip.objects.filter(**{
            'id': self.clip.id,
            self.layer.name: False
        }).update(**{self.layer.name: True})

        #how expensive is this?
        #update_matching_events.delay(self.value)
        #update_matching_places.delay(self.value)

    def json(self, layer=False, keys=None):
        j = {
            'user': self.user.username,
        }
        for field in ('id', 'in', 'out', 'value', 'created', 'modified'):

            j[field] = getattr(self, {
                'duration': 'clip__duration',
                'hue': 'clip__hue',
                'id': 'public_id',
                'in': 'start',
                'lightness': 'clip__lightness',
                'out': 'end',
                'saturation': 'clip__saturation',
                'volume': 'clip__volume',
            }.get(field, field))
        if layer or (keys and 'layer' in keys):
            j['layer'] = self.layer.name
        if keys:
            _j = {}
            for key in keys:
                if key in j:
                    _j[key] = j[key]
            j = _j
            if 'videoRatio' in keys:
                streams = self.item.streams()
                if streams:
                    j['videoRatio'] = streams[0].aspect_ratio
        return j

    def __unicode__(self):
        return u"%s %s-%s" %(self.public_id, self.start, self.end)

