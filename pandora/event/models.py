# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models
from django.contrib.auth.models import User, Group
from django.db.models import Q

import ox
from ox.django import fields

from annotation.models import Annotation
from item.models import Item
import managers


class Event(models.Model):
    '''
        Events are events in time that can be once or recurring,
        From Mondays to Spring to 1989 to Roman Empire
    '''
    class Meta:
        ordering = ('name_sort', )

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(User, null=True, related_name='events')

    name = models.CharField(null=True, max_length=255, unique=True)
    name_sort = models.CharField(null=True, max_length=255, unique=True)
    name_find = models.TextField(default='', editable=True)
    wikipediaId = models.CharField(max_length=1000, blank=True)

    alternativeNames = fields.TupleField(default=[])

    objects = managers.EventManager()

    #start yyyy-mm-dd|mm-dd|dow 00:00|00:00
    start = models.CharField(default='', max_length=255)
    startTime = models.BigIntegerField(default=0)
    
    #end   yyyy-mm-dd|mm-dd|dow 00:00|00:01
    end = models.CharField(default='', max_length=255)
    endTime = models.BigIntegerField(default=0)

    duration = models.CharField(default='', max_length=255)
    durationTime = models.BigIntegerField(default=0)

    type = models.CharField(default='', max_length=255)

    matches = models.IntegerField(default=0)
    items = models.ManyToManyField(Item, blank=True, related_name='events')
    annotations = models.ManyToManyField(Annotation, blank=True, related_name='events')

    def __unicode__(self):
        return self.name
 
    def get_matches(self):
        q = Q(value__icontains=" " + self.name)|Q(value__startswith=self.name)
        for name in self.alternativeNames:
            q = q|Q(value__icontains=" " + name)|Q(value__startswith=name)
        return Annotation.objects.filter(q)

    def update_matches(self):
        matches = self.get_matches()
        self.matches = matches.count()
        for i in self.annotations.exclude(id__in=matches):
            self.annotations.remove(i)
        for i in matches.exclude(id__in=self.annotations.all()):
            self.annotations.add(i)
        ids = list(set([a.item.id for a in matches]))
        for i in self.items.exclude(id__in=ids):
            self.items.remove(i)
        for i in Item.objects.filter(id__in=ids).exclude(id__in=self.items.all()):
            self.items.add(i)
        self.save()

    def save(self, *args, **kwargs):
        if not self.name_sort:
            self.name_sort = self.name
        self.name_find = self.name + '||'.join(self.alternativeNames)
        super(Event, self).save(*args, **kwargs)

    def get_id(self):
        return ox.to32(self.id)

    def json(self, user=None):
        j = {
            'id': self.get_id(),
        }
        if self.user:
            j['user'] = self.user.username
        for key in ('created', 'modified',
                    'name', 'alternativeNames',
                    'start', 'end', 'duration',
                    'type', 'matches'):
            j[key] = getattr(self, key)
        return j
