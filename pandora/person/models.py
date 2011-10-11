# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import unicodedata

from django.db import models

from ox.django import fields
import ox

import managers

def get_name_sort(name):
    person, created = Person.objects.get_or_create(name=name)
    name_sort = unicodedata.normalize('NFKD', person.name_sort)
    return name_sort

class Person(models.Model):
    name = models.CharField(max_length=200, unique=True)
    name_sort = models.CharField(max_length=200)
    edited = models.BooleanField(default=False)
    numberofnames = models.IntegerField(default=0)

    #FIXME: how to deal with aliases
    aliases = fields.TupleField(default=[])

    imdbId = models.CharField(max_length=7, blank=True)
    wikipediaId = models.CharField(max_length=1000, blank=True)

    objects = managers.PersonManager()

    def __unicode__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.name_sort:
            self.name_sort = ox.get_sort_name(self.name)
            self.name_sort = unicodedata.normalize('NFKD', self.name_sort)
        self.numberofnames = len(self.name.split(' '))
        super(Person, self).save(*args, **kwargs)

    def get_or_create(model, name, imdbId=None):
        if imdbId:
            q = model.objects.filter(name=name, imdbId=imdbId)
        else:
            q = model.objects.all().filter(name=name)
        if q.count() > 0:
            o = q[0]
        else:
            o = model.objects.create(name=name)
            if imdbId:
                o.imdbId = imdbId
            o.save()
        return o
    get_or_create = classmethod(get_or_create)

    def get_id(self):
        return ox.to26(self.id)

    def json(self, keys=None, user=None):
        j = {
            'id': self.get_id(),
            'name': self.name,
            'nameSort': self.name_sort,
            'numberofnames': self.numberofnames,
        }
        if keys:
            for key in j.keys():
                if key not in keys:
                    del j[key]
        return j
