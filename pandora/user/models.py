# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from datetime import datetime

from django.contrib.auth.models import User
from django.db import models
from django.db.models import signals
from django.dispatch import dispatcher
from django.conf import settings

from ox.utils import json

class UserProfile(models.Model):
    recover_key = models.TextField()
    user = models.ForeignKey(User, unique=True)
    
    files_updated = models.DateTimeField(default=datetime.now)

def user_post_save(sender, instance, **kwargs):
    profile, new = UserProfile.objects.get_or_create(user=instance)

models.signals.post_save.connect(user_post_save, sender=User)
    
class Preference(models.Model):
    user = models.ForeignKey(User, related_name='preferences')
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    key = models.CharField(blank=True, max_length=255)
    value = models.TextField(blank=True)

def get_user_json(user):
    json = {}
    for key in ('username', ):
        json[key] = getattr(user, key)
    json['group'] = 'user'
    if user.is_staff:
        json['group'] = 'admin'
    elif user.has_perm('0x.vip'): #FIXME: permissions
        json['group'] = 'vip'
    json['preferences'] = get_preferences(user)
    json['ui'] = get_ui(user)
    return json

def get_ui(user):
    return {
        "columns": ["id", "title", "director", "country", "year", "language", "genre"],
        "findQuery": {"conditions": [], "operator": ""},
        "groupsQuery": {"conditions": [], "operator": "|"},
        "groupsSize": 128,
        "itemView": "timeline",
        "listQuery": {"conditions": [], "operator": ""},
        "listsSize": 192,
        "listView": "icons",
        "sections": ["history", "lists", "public", "featured"],
        "showGroups": True,
        "showInfo": True,
        "showLists": True,
        "showMovies": True,
        "sort": settings.DEFAULT_SORT,
        "theme": settings.DEFAULT_THEME
    }

def get_preferences(user):
    prefs = {}
    for p in Preference.objects.filter(user=user):
        prefs[p.key] = json.loads(p.value)
    prefs['email'] = user.email
    return prefs

def get_preference(user, key, value=None):
    if key in ('email', ):
        value = getattr(user, key)
    else:
        q = Preference.objects.filter(user=user, key=key)
        if q.count() > 0:
            value = json.loads(q[0].value)
    return value

def set_preference(user, key, value):
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
