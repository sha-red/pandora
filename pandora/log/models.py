# -*- coding: utf-8 -*-

from django.db import models
from django.contrib.auth import get_user_model

import ox

from . import managers

User = get_user_model()


class Log(models.Model):
    created = models.DateTimeField(auto_now_add=True, db_index=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, default=None, blank=True, null=True, on_delete=models.CASCADE)
    url = models.CharField(max_length=1000, default='')
    line = models.IntegerField(default=0)
    text = models.TextField(blank=True)

    objects = managers.LogManager()

    def __str__(self):
        return "%s" % self.id

    def json(self, keys=None):
        j = {
            'created': self.created,
            'id': ox.toAZ(self.id),
            'line': self.line,
            'modified': self.modified,
            'text': self.text,
            'url': self.url,
            'user': self.user and self.user.username or '',
        }
        if keys:
            for key in list(j):
                if key not in keys:
                    del j[key]
        return j

