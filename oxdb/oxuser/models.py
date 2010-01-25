# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.db import models
from django.contrib.auth.models import User


class Group(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    name = models.CharField(blank=True, max_length=255, unique=True)
    users = models.ManyToManyField(User, related_name='groups')

class Preference(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, related_name='preferences')
    key = models.CharField(blank=True, max_length=255)
    value = models.TextField(blank=True)

def getPreference(user, key, value=None):
    q = Preference.objects.filter(user=user, key=key)
    if q.count() > 0:
        value = json.loads(q[0].value)
    return value

def setPreference(user, key, value):
    value = json.dumps(value)
    q = Preference.objects.filter(user=user, key=key)
    if q.count() > 0:
        q[0].value = value
    else:
        p = Preference(user=user, key=key, value=value)
        p.save()

