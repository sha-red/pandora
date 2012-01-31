# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import re

from django.db import models, transaction
from django.contrib.auth.models import User, Group
from django.db.models import Q
from django.conf import settings
import ox
from ox.django import fields

import managers
from annotation.models import Annotation, get_matches
from item.models import Item
from changelog.models import Changelog


class Place(models.Model):
    '''
        Places are named locations, they should have geographical information attached to them.
    '''
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, null=True, related_name='places')

    name = models.CharField(max_length=1024)
    alternativeNames = fields.TupleField(default=[])
    name_sort = models.CharField(max_length=200)
    name_find = models.TextField(default='', editable=False)

    geoname = models.CharField(max_length=1024, unique=True)
    geoname_sort = models.CharField(max_length=1024, unique=True)
    countryCode = models.CharField(max_length=16, default='')

    wikipediaId = models.CharField(max_length=1000, blank=True)
    type = models.CharField(max_length=1000, default='')

    south = models.FloatField(default=0)
    west = models.FloatField(default=0)
    north = models.FloatField(default=0)
    east = models.FloatField(default=0)
    lat = models.FloatField(default=0)
    lng = models.FloatField(default=0)
    area = models.FloatField(default=0)

    matches = models.IntegerField(default=0)
    items = models.ManyToManyField(Item, blank=True, related_name='places')
    annotations = models.ManyToManyField(Annotation, blank=True, related_name='places')

    objects = managers.PlaceManager()

    class Meta:
        ordering = ('name_sort', )

    def __unicode__(self):
        return self.name

    def editable(self, user):
        if user and not user.is_anonymous() \
            and (self.user == user or user.get_profile().capability('canEditPlaces')):
                return True
        return False

    def get_id(self):
        return ox.toAZ(self.id)

    def json(self, keys=None, user=None):
        j = {
            'id': self.get_id(),
            'user': self.user.username,
            'editable': self.editable(user)
        }
        for key in ('created', 'modified',
                    'name', 'alternativeNames', 'geoname', 'countryCode',
                    'south', 'west', 'north', 'east',
                    'lat', 'lng', 'area', 'matches', 'type'):
            if not keys or key in keys:
                j[key] = getattr(self, key)
        return j

    def get_matches(self):
        return get_matches(self, Place, 'place')

    @transaction.commit_on_success
    def update_matches(self):
        matches = self.get_matches()
        numberofmatches = matches.count()
        for i in self.annotations.exclude(id__in=matches):
            self.annotations.remove(i)
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
            if numberofmatches:
                Place.objects.filter(id=self.id).update(matches=numberofmatches)
            else:
                self.matches = numberofmatches
                self.save()

    def save(self, *args, **kwargs):
        if not self.name_sort:
            self.name_sort = self.name #', '.join(self.name)
        self.geoname_sort = ', '.join(reversed(self.geoname.split(', ')))
        self.name_find = '|%s|'%'|'.join([self.name]+list(self.alternativeNames))

        #update center
        #self.lat = ox.location.center(self.south, self.north)
        #self.lng = ox.location.center(self.east, self.west)

        #update area
        #self.area= ox.location.area(self.south, self.west, self.north, self.east)

        super(Place, self).save(*args, **kwargs)

    def log(self):
        c = Changelog(type='place')
        c.value = self.json()
        c.save()
