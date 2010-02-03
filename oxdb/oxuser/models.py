# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.contrib.auth.models import User
from django.db import models
from django.db.models import signals
from django.dispatch import dispatcher
from django.utils import simplejson as json


class UserProfile(models.Model):
    recover_key = models.TextField()
    user = models.ForeignKey(User, unique=True)

def user_post_save(sender, instance, **kwargs):
    profile, new = UserProfile.objects.get_or_create(user=instance)

models.signals.post_save.connect(user_post_save, sender=User)
    
class Preference(models.Model):
    user = models.ForeignKey(User, related_name='preferences')
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    key = models.CharField(blank=True, max_length=255)
    value = models.TextField(blank=True)

def getUserJSON(user):
    json = {}
    for key in ('username', 'email'):
        json[key] = getattr(user, key)
    json['preferences'] = getPreferences(user)
    return json

def getPreferences(user):
    prefs = {}
    for p in Preference.objects.filter(user=user):
        prefs[p.key] = json.loads(p.value)
    return prefs

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
