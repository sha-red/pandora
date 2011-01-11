# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os
from datetime import datetime

from django.contrib.auth.models import User
from django.db import models
from django.conf import settings

from ox.utils import json
from ox.django.fields import DictField

from app.models import site_config
from itemlist.models import List


class UserProfile(models.Model):
    reset_token = models.TextField(blank=True, null=True, unique=True)
    user = models.ForeignKey(User, unique=True)

    files_updated = models.DateTimeField(default=datetime.now)
    newsletter = models.BooleanField(default=True)
    ui = DictField(default={})
    preferences = DictField(default={})

    def get_preferences(self):
        prefs = self.preferences
        prefs['email'] = self.user.email
        return prefs

    def get_ui(self):
        ui = {}
        ui.update(site_config['user']['ui'])
        ui.update(self.ui)
        if not 'lists' in ui:
            ui['lists'] = {}
            ui['lists'][''] = site_config['uiDefaults']['list']
        ids = [l.get_id() for l in self.user.lists.all()]
        ids += [l.get_id() for l in self.user.subscribed_lists.all()]
        ids += [l.get_id() for l in List.objects.filter(status='featured').exclude(user=self.user)]
        for l in ids:
            if l not in ui['lists']:
                ui['lists'][l] = ui['lists']['']
        return ui

def user_post_save(sender, instance, **kwargs):
    profile, new = UserProfile.objects.get_or_create(user=instance)

models.signals.post_save.connect(user_post_save, sender=User)


def get_user_json(user):
    profile = user.get_profile()
    result = {}
    for key in ('username', ):
        result[key] = getattr(user, key)
    result['group'] = 'user'
    if user.is_staff:
        result['group'] = 'admin'
    elif user.has_perm('0x.vip'): #FIXME: permissions
        result['group'] = 'vip'
    result['preferences'] = profile.get_preferences()
    result['ui'] = profile.get_ui()
    return result
