# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from datetime import datetime

from django.contrib.auth.models import User
from django.db import models
from ox.django import fields
import ox

import managers

'''
FIXME: remove this table more migrate to new ChangeLog
'''
class Changelog(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=255, db_index=True)
    value = fields.DictField(default={})

    def __unicode__(self):
        return u'%s %s' %(self.type, self.created)

    def json(self):
        return self.value

def add_changelog(request, data, id=None):
    user = request.user
    action = request.POST['action']
    c = Log(user=user, action=action, data=data)
    if id and isinstance(id, list):
        id = ', '.join(id)
    c.changeid = id or data.get('id')
    c.created = datetime.now()
    c.save()

class Log(models.Model):

    action = models.CharField(max_length=255, db_index=True)
    data = fields.DictField(default={})
    created = models.DateTimeField()
    user = models.ForeignKey(User, null=True, related_name='changelog')
    changeid = models.CharField(max_length=255)

    objects = managers.LogManager()

    def __unicode__(self):
        return u'%s %s %s' % (self.created, self.action, self.changeid)

    def get_id(self):
        return ox.toAZ(self.id)

    def json(self, keys=None):
        r = {
            'id': self.get_id(),
            'action': self.action,
            'created': self.created,
            'data': self.data,
            'changeid': self.changeid,
            'user': self.user.username,
        }
        if keys:
            for k in r.keys():
                if k not in keys:
                    del r[k]
        return r
