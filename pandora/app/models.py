# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models
from django.contrib.auth.models import User


class Page(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=1024, unique=True)
    body = models.TextField(blank=True)

    def __unicode__(self):
        return self.name

class Log(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, default=None, blank=True, null=True)
    url = models.CharField(max_length=1000, default='')
    line = models.IntegerField(default=0)
    text = models.TextField(blank=True)

    def __unicode__(self):
        return u"%s" % self.id

    def json(self):
        return {
            'created': self.created,
            'modified': self.modified,
            'user': self.user and self.user.username or '',
            'type': self.type,
            'message': self.message,
        }
