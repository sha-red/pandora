# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement
from datetime import datetime

from django.db import models
from django.contrib.auth.models import User


class Text(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    published = models.DateTimeField(default=datetime.now, editable=False)
    public = models.BooleanField(default=False)

    user = models.ForeignKey(User)
    slug = models.SlugField()
    title = models.CharField(null=True, max_length=255)
    body = models.TextField(default='')

    def __unicode__(self):
        return u"%s <%s>" % (self.title, self.slug)

    def get_absolute_url(self):
        return '/text/%s' % self.slug


class Image(models.Model):
    image = models.ImageField(upload_to='text/image')
    caption = models.CharField(max_length=255, default="")

    def get_absolute_url(self):
        return self.image.url


class Attachment(models.Model):
    file = models.FileField(upload_to='text/attachment')
    caption = models.CharField(max_length=255, default="")

    def get_absolute_url(self):
        return self.file.url
