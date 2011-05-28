# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement
from django.db import models

import ox
from ox.django import fields
from django.contrib.auth.models import User, Group

import managers


class Place(models.Model):
    '''
        Places are named locations, they should have geographical information attached to them.
    '''
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, null=True, related_name='places')

    name = models.CharField(max_length=1024)
    aliases = fields.TupleField(default=[])
    name_sort = models.CharField(max_length=200)
    name_find = models.TextField(default='', editable=False)

    geoname = models.CharField(max_length=1024, unique=True)
    geoname_sort = models.CharField(max_length=1024, unique=True)
    countryCode = models.CharField(max_length=16, default='')

    wikipediaId = models.CharField(max_length=1000, blank=True)
    type= models.CharField(max_length=1000, blank=True)

    south = models.FloatField(default=0)
    west = models.FloatField(default=0)
    north = models.FloatField(default=0)
    east = models.FloatField(default=0)
    lat = models.FloatField(default=0)
    lng = models.FloatField(default=0)
    size = models.FloatField(default=0)

    matches = models.IntegerField(default=0)

    objects = managers.PlaceManager()

    class Meta:
        ordering = ('name_sort', )

    def __unicode__(self):
        return self.name

    def editable(self, user):
        if user.is_staff or self.user == user:
            return True
        return False

    def get_id(self):
        return ox.to32(self.id)

    def json(self, user=None):
        j = {
            'id': self.get_id(),
            'user': self.user.username,
        }
        for key in ('created', 'modified',
                    'name', 'aliases', 'geoname', 'countryCode',
                    'south', 'west', 'north', 'east',
                    'lat', 'lng', 'size', 'matches', 'type'):
            j[key] = getattr(self, key)
        return j

    def save(self, *args, **kwargs):
        if not self.name_sort:
            self.name_sort = self.name #', '.join(self.name)
        self.geoname_sort = ', '.join(reversed(self.geoname.split(', ')))
        self.name_find = '|%s|'%'|'.join([self.name]+list(self.aliases))

        #update center
        #self.lat = ox.location.center(self.south, self.north)
        #self.lng = ox.location.center(self.east, self.west)

        #update area
        #self.size = ox.location.area(self.south, self.west, self.north, self.east)

        super(Place, self).save(*args, **kwargs)
