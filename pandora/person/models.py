# -*- coding: utf-8 -*-

import unicodedata

from django.db import models

from oxdjango import fields
import ox

from item import utils
import item.models

from . import managers

def get_name_sort(name, sortname=None):
    name = unicodedata.normalize('NFKD', name).strip()
    if name:
        person, created = Person.objects.get_or_create(name=name)
        if created:
            if sortname:
                person.sortname = sortname
            person.save()
        sortname = unicodedata.normalize('NFKD', person.sortname)
    else:
        sortname = ''
    return sortname

class Person(models.Model):
    name = models.CharField(max_length=200, unique=True)
    sortname = models.CharField(max_length=200)
    sortsortname = models.CharField(max_length=200)
    edited = models.BooleanField(default=False)
    numberofnames = models.IntegerField(default=0)

    #FIXME: how to deal with aliases
    aliases = fields.TupleField(default=[])

    imdbId = models.CharField(max_length=16, blank=True)
    wikipediaId = models.CharField(max_length=1000, blank=True)

    objects = managers.PersonManager()

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.sortname:
            self.sortname = ox.get_sort_name(self.name)
            self.sortname = unicodedata.normalize('NFKD', self.sortname)
        self.sortsortname = utils.sort_string(self.sortname).lower()
        self.numberofnames = len(self.name.split(' '))
        super(Person, self).save(*args, **kwargs)

    def update_itemsort(self):
        sortname = self.sortname.lower()
        item.models.Facet.objects.filter(
            key__in=item.models.Item.person_keys + ['name'],
            value=self.name
        ).exclude(
            sortvalue=sortname
        ).update(
            sortvalue=sortname
        )
        for i in item.models.Item.objects.filter(facets__in=item.models.Facet.objects.filter(
            key__in=item.models.Item.person_keys + ['name'],
            value=self.name)
        ).distinct():
            i.update_sort()

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
        return ox.toAZ(self.id)

    def json(self, keys=None, user=None):
        j = {
            'id': self.get_id(),
            'name': self.name,
            'sortname': self.sortname,
            'numberofnames': self.numberofnames,
        }
        if keys:
            for key in list(j):
                if key not in keys:
                    del j[key]
        return j


def update_sort_name():
    for p in Person.objects.all():
        _sortname = ox.get_sort_name(p.name).lower()
        _sortname = unicodedata.normalize('NFKD', _sortname)
        if (not p.edited and _sortname != p.sortname) or \
           (p.edited and _sortname == p.sortname):
            p.sortname = _sortname
            p.edited = False
            p.save()
