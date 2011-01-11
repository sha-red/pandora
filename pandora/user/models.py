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
from itemlist.models import List, Position


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

        def add(lists, section):
            print lists, section
            ids = [l.get_id() for l in lists]
            in_list = filter(lambda l: l in ui['lists'], ids)
            for l in lists:
                print l
                pos, created = Position.objects.get_or_create(list=l, user=self.user, section=section)
                if created:
                    pos.position = len(in_list)
                    pos.save()
                id = l.get_id()
                if id not in in_list:
                    ui['lists'][id] = {}
                    ui['lists'][id].update(ui['lists'][''])
                    in_list.append(id)
                ui['lists'][id]['position'] = pos.position
            return ids

        ids = ['']
        ids += add(self.user.lists.exclude(status="featured"), 'my')
        ids += add(self.user.subscribed_lists.all(), 'public')
        ids += add(List.objects.filter(status='featured'), 'featured')
        for i in ui['lists'].keys():
            if i not in ids:
                del ui['lists'][i]
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
