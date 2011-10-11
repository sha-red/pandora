# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import unicodedata

from django.db import models

import ox

import managers

def get_title_sort(title):
    title, created = Title.objects.get_or_create(title=title)
    title_sort = unicodedata.normalize('NFKD', title.title_sort)
    return title_sort

class Title(models.Model):
    title = models.CharField(max_length=1000, unique=True)
    title_sort = models.CharField(max_length=1000)

    imdbId = models.CharField(max_length=7, blank=True)

    objects = managers.TitleManager()

    def __unicode__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.title_sort:
            self.title_sort = ox.normalize.canonicalTitle(self.title)
            self.title_sort = unicodedata.normalize('NFKD', self.title_sort)
        super(Title, self).save(*args, **kwargs)

    def get_or_create(model, title, imdbId=None):
        if imdbId:
            q = model.objects.filter(title=title, imdbId=imdbId)
        else:
            q = model.objects.all().filter(title=title)
        if q.count() > 0:
            o = q[0]
        else:
            o = model.objects.create(title=title)
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
            'title': self.title,
            'titleSort': self.title_sort,
        }
        if keys:
            for key in j.keys():
                if key not in keys:
                    del j[key]
        return j
