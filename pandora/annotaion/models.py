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


class Layer(models.Model):
    class Meta:
        ordering = ('position', )

    name = models.CharField(null=True, max_length=255, unique=True)
    title = models.CharField(null=True, max_length=255)
	#text, string, string from list(fixme), event, place, person
    type = models.CharField(null=True, max_length=255)
    position = models.IntegerField(default=0)

	overlapping = models.BooleanField(default=True)
	enabled = models.BooleanField(default=True)

	enabled = models.BooleanField(default=True)
	public = models.BooleanField(default=True)   #false=users only see there own bins
	subtitle = models.BooleanField(default=True) #bis can be displayed as subtitle, only one bin

	find = models.BooleanField(default=True)
	#words / item duration(wpm), total words, cuts per minute, cuts, number of annotations, number of annotations/duration
    sort = models.CharField(null=True, max_length=255)

    def properties(self):
        p = {}
        if self.find:
            p[self.name] = {'type': 'bin', 'find': True}
        if self.sort:
            print 'FIXME: need to add sort stuff'
        return p

    def json(self):
        return {'id': self.name, 'title': self.title, 'type': self.type}

    def __unicode__(self):
        return self.title

class Annotation(models.Model):
    #FIXME: here having a item,start index would be good
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User)
    item = models.ForeignKey('item.Item')

    #seconds
    start = models.FloatField(default=-1)
    stop = models.FloatField(default=-1)

    type = models.CharField(blank=True, max_length=255)
    value = models.TextField()

    def editable(self, user):
        if user.is_authenticated():
            if obj.user == user.id or user.has_perm('0x.admin'):
                return True
            if user.groups.filter(id__in=obj.groups.all()).count() > 0:
                return True
        return False

    def __unicode__(self):
        return "%s/%s-%s" %(self.item, self.start, self.stop)

