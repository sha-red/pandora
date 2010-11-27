# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from datetime import datetime
import os.path
import math
import random
import re
import subprocess
import unicodedata
from glob import glob

from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.utils import simplejson as json
from django.conf import settings

from ox.django import fields
import ox
from ox import stripTags
from ox.normalize import canonicalTitle, canonicalName


def get_name_sort(name):
    person, created = Person.objects.get_or_create(name=name)
    name_sort = unicodedata.normalize('NFKD', person.name_sort)
    return name_sort

class Person(models.Model):
    name = models.CharField(max_length=200)
    name_sort = models.CharField(max_length=200)

    #FIXME: how to deal with aliases
    aliases = fields.TupleField(default=[])

    imdbId = models.CharField(max_length=7, blank=True)
    wikipediaId = models.CharField(max_length=1000, blank=True)

    class Meta:
        ordering = ('name_sort', )

    def __unicode__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.name_sort:
            self.name_sort = ox.normalize.canonicalName(self.name)
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

    def json(self):
        return self.name

