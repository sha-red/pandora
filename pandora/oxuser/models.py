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
    
    files_updated = models.DateTimeField(default=None)

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
    for key in ('username', ):
        json[key] = getattr(user, key)
    json['group'] = 'user'
    if user.is_staff:
        json['group'] = 'admin'
    elif user.has_perm('0x.vip'): #FIXME: permissions
        json['group'] = 'vip'
    json['preferences'] = getPreferences(user)
    return json

def getPreferences(user):
    prefs = {}
    for p in Preference.objects.filter(user=user):
        prefs[p.key] = json.loads(p.value)
    prefs['email'] = user.email
    return prefs

def getPreference(user, key, value=None):
    if key in ('email', ):
        value = getattr(user, key)
    else:
        q = Preference.objects.filter(user=user, key=key)
        if q.count() > 0:
            value = json.loads(q[0].value)
    return value

def setPreference(user, key, value):
    if key in ('email', ):
        setattr(user, key, value)
        user.save()
    else:
        value = json.dumps(value)
        q = Preference.objects.filter(user=user, key=key)
        if q.count() > 0:
            p = q[0]
            p.value = value
            p.save()
        else:
            p = Preference(user=user, key=key, value=value)
            p.save()
