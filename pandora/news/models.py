# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, print_function, absolute_import

from django.db import models
import ox

from . import managers


class News(models.Model):
    objects = managers.NewsManager()

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    title = models.TextField()
    date = models.TextField()
    text = models.TextField()

    def editable(self, user):
        return user.is_authenticated() and user.profile.capability("canEditSitePages")

    def save(self, *args, **kwargs):
        super(News, self).save(*args, **kwargs)

    def get_id(self):
        return ox.toAZ(self.id)

    def json(self, keys=None):
        j = {
            'id': self.get_id(),
            'date': self.date,
            'title': self.title,
            'text': self.text,
        }
        if keys:
            for key in list(j):
                if key not in keys:
                    del j[key]
        return j

    def __unicode__(self):
        return u"%s/%s" %(self.date, self.title)

