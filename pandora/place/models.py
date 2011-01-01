# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models

import ox
from ox.django import fields

import managers


class Place(models.Model):
    '''
        Places are named locations, they should have geographical information attached to them.
    '''

    name = models.CharField(max_length=200, unique=True)
    name_sort = models.CharField(max_length=200)
    name_find = models.TextField(default='', editable=False)

    geoname = models.CharField(max_length=1024, unique=True)
    geoname_reverse = models.CharField(max_length=1024, unique=True)

    wikipediaId = models.CharField(max_length=1000, blank=True)
    aliases = fields.TupleField(default=[])

    sw_lat = models.FloatField(default=0)
    sw_lng = models.FloatField(default=0)
    ne_lat = models.FloatField(default=0)
    ne_lng = models.FloatField(default=0)
    center_lat = models.FloatField(default=0)
    center_lng = models.FloatField(default=0)
    area = models.FloatField(default=-1)

    objects = managers.PlaceManager()

    class Meta:
        ordering = ('name_sort', )

    def __unicode__(self):
        return self.name

    def json(self):
        j = {}
        for key in ('name', 'name_sort', 'aliases', 'geoname', 'geoname_reversed',
                    'sw_lat', 'sw_lng', 'ne_lat', 'ne_lng',
                    'center_lat', 'center_lng'):
            j[key] = getattr(self, key)

    def save(self, *args, **kwargs):
        if not self.name_sort:
            self.name_sort = self.name
        self.geoname_reverse = ', '.join(reversed(self.geoname.split(', ')))

        self.name_find = '|%s|'%'|'.join([self.name] + self.aliases)

        #update center
        self.lat_center = ox.location.center(self.lat_sw, self.lat_ne)
        self.lng_center = ox.location.center(self.lng_sw, self.lng_ne)

        #update area
        self.area = ox.location.area(self.lat_sw, self.lng_sw, self.lat_ne, self.lng_ne)

        super(Place, self).save(*args, **kwargs)
