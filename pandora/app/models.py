# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import json

from django.db import models

from changelog.models import Changelog

import monkey_patch

class Page(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=1024, unique=True)
    text = models.TextField(blank=True)

    def __unicode__(self):
        return self.name

class Settings(models.Model):

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    key = models.CharField(max_length=1024, unique=True)
    value = models.TextField(blank=True)

    def __unicode__(self):
        return self.key

    @classmethod
    def set(cls, key, value):
        o, created = cls.objects.get_or_create(key=key)
        o.value = json.dumps(value)
        o.save()

    @classmethod
    def get(cls, key, default=None):
        if cls.objects.filter(key=key).exists():
            value = json.loads(cls.objects.get(key=key).value)
        else:
            value = default
        return value



