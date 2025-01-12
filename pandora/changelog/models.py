# -*- coding: utf-8 -*-

from datetime import datetime

from django.contrib.auth import get_user_model
from django.db import models
from oxdjango.fields import JSONField

import ox

import websocket

from . import managers

User = get_user_model()

'''
FIXME: remove this table more migrate to new ChangeLog
'''
class Changelog(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=255, db_index=True)
    value = JSONField(default=dict, editable=False)

    def __str__(self):
        return '%s %s' % (self.type, self.created)

    def json(self):
        return self.value

def add_changelog(request, data, id=None):
    if isinstance(request, dict):
        user = request['user']
        action = request['action']
    else:
        user = request.user
        action = request.POST['action']
    c = Log(user=user, action=action, data=data)
    if id and isinstance(id, list):
        id = ', '.join(id)
    c.changeid = id or data.get('id')
    c.created = datetime.now()
    c.save()
    websocket.trigger_event('change', {
        'action': c.action,
        'id': c.changeid,
        'user': c.user.username,
    })

class Log(models.Model):

    action = models.CharField(max_length=255, db_index=True)
    data = JSONField(default=dict, editable=False)
    created = models.DateTimeField(db_index=True)
    user = models.ForeignKey(User, null=True, related_name='changelog', on_delete=models.CASCADE)
    changeid = models.TextField()

    objects = managers.LogManager()

    def __str__(self):
        return '%s %s %s' % (self.created, self.action, self.changeid)

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
            for k in list(r):
                if k not in keys:
                    del r[k]
        return r
