# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models
from django.contrib.auth.models import User

import utils


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
    public = models.BooleanField(default=True)   #false=users only see there own bins

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
        return {'id': self.name, 'title': self.title, 'type': self.type}

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

    def json(self):
        return {
            'id': self.get_id(),
            'user': self.user.username,
            'start': self.start,
            'end': self.end,
            'value': self.value,
            'value_html': self.html(),
            'layer': self.layer.name
        }

    def __unicode__(self):
        return u"%s/%s-%s" %(self.item, self.start, self.end)
