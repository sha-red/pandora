# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models
from django.contrib.auth.models import User
import ox

import managers


class News(models.Model):
    objects = managers.NewsManager()

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, related_name='news')

    title = models.TextField()
    content = models.TextField()

    def editable(self, user):
        if user.is_authenticated():
            if user.get_profile().get_level() in ('staff', 'admin') or \
               self.user == user or \
               user.groups.filter(id__in=self.groups.all()).count() > 0:
                return True
        return False

    '''
    def save(self, *args, **kwargs):
        super(News, self).save(*args, **kwargs)
    '''

    def json(self, keys=None):
        j = {
            'user': self.user.username,
            'id': ox.toAZ(self.id),
            'title': self.title,
            'content': self.content,
        }
        if keys:
            for key in j.keys():
                if key not in keys:
                    del j[key]
        return j

    def __unicode__(self):
        return u"%s/%s" %(self.created, self.title)

