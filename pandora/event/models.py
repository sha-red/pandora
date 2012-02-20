# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import re

from django.db import models, transaction
from django.contrib.auth.models import User
from django.db.models import Q
from django.conf import settings
import ox
from ox.django import fields

from annotation.models import Annotation, get_matches
from item.models import Item
from item import utils
from person.models import get_name_sort
from title.models import get_title_sort
from changelog.models import Changelog

import managers


class Event(models.Model):
    '''
        Events are events in time that can be once or recurring,
        From Mondays to Spring to 1989 to Roman Empire
    '''
    #class Meta:
    #    ordering = ('name_sort', )


    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    defined = models.BooleanField(default=False)

    user = models.ForeignKey(User, null=True, related_name='events')

    name = models.CharField(null=True, max_length=255, unique=True)
    name_sort = models.CharField(null=True, max_length=255, db_index=True)
    name_find = models.TextField(default='', editable=True)
    wikipediaId = models.CharField(max_length=1000, blank=True)

    alternativeNames = fields.TupleField(default=[])

    objects = managers.EventManager()

    #start yyyy-mm-dd|mm-dd|dow 00:00|00:00
    start = models.CharField(default='', max_length=255)
    startTime = models.BigIntegerField(default=None, null=True)
    
    #end   yyyy-mm-dd|mm-dd|dow 00:00|00:01
    end = models.CharField(default='', max_length=255)
    endTime = models.BigIntegerField(default=None, null=True)

    duration = models.CharField(default='', max_length=255)
    durationTime = models.BigIntegerField(default=None, null=True)

    type = models.CharField(default='', max_length=255)

    matches = models.IntegerField(default=0)
    items = models.ManyToManyField(Item, blank=True, related_name='events')
    annotations = models.ManyToManyField(Annotation, blank=True, related_name='events')

    def __unicode__(self):
        return self.name

    @classmethod
    def get_or_create(model, name):
        qs = model.objects.filter(name_find__icontains=u'|%s|'%name)
        if qs.count() == 0:
            instance = model(name=name)
            instance.save()
        else:
            instance = qs[0]
        return instance

    def editable(self, user):
        if user and not user.is_anonymous() \
            and (not self.user or \
                 self.user == user or \
                 user.get_profile().capability('canEditEvents')):
                return True
        return False
     
    def get_matches(self):
        return get_matches(self, Event, 'event')

    @transaction.commit_on_success
    def update_matches(self):
        matches = self.get_matches()
        numberofmatches = matches.count()
        for a in self.annotations.exclude(id__in=matches):
            self.annotations.remove(a)
            #annotations of type event always need an event
            if a.get_layer().get('type') == 'event' and a.events.count() == 0:
                a.events.add(Event.get_or_create(a.value))
                for e in a.events.all():
                    e.update_matches()
        for i in matches.exclude(id__in=self.annotations.all()):
            #need to check again since editEvent might have been called again
            if self.annotations.filter(id=i.id).count() == 0:
                self.annotations.add(i)
        ids = list(set([a.item.id for a in matches]))
        for i in self.items.exclude(id__in=ids):
            self.items.remove(i)
        for i in Item.objects.filter(id__in=ids).exclude(id__in=self.items.all()):
            if self.items.filter(id=i.id).count() == 0:
                self.items.add(i)
        if self.matches != numberofmatches:
            self.matches = numberofmatches
            if numberofmatches:
                Event.objects.filter(id=self.id).update(matches=numberofmatches)
            else:
                self.save()

    def set_name_sort(self, value=None):
        if not value:
            value = self.name
            if self.type == 'person':
                value = get_name_sort(value)
            else:
                value = get_title_sort(value)
        self.name_sort = utils.sort_string(value)

    def save(self, *args, **kwargs):
        if not self.name_sort:
            self.set_name_sort()
        self.name_find = '||' + self.name + '||'.join(self.alternativeNames) + '||'
        self.defined = len(filter(None, [getattr(self, key)
                             for key in ('start', 'end')])) > 0
        if self.endTime and self.startTime:
            self.durationTime = self.endTime - self.startTime

        super(Event, self).save(*args, **kwargs)

    def make_undefined(self):
        self.defined = False
        self.start = self.end = ''
        self.durationTime = self.endTime = self.startTime = None

    def get_id(self):
        return ox.toAZ(self.id)

    def json(self, user=None):
        j = {
            'id': self.get_id(),
            'editable': self.editable(user)
        }
        if self.user:
            j['user'] = self.user.username
        for key in ('created', 'modified',
                    'name', 'alternativeNames',
                    'start', 'end', 'duration',
                    'type', 'matches'):
            j[key] = getattr(self, key)
        j['nameSort'] = self.name_sort
        return j

    def log(self):
        c = Changelog(type='event')
        c.value = self.json()
        c.save()
