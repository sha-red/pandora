# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import copy
from datetime import datetime

from django.contrib.auth.models import User
from django.db import models
from django.db.models import Max
from django.conf import settings

from ox.django.fields import DictField
from ox.utils import json

from itemlist.models import List, Position


class UserProfile(models.Model):
    reset_token = models.TextField(blank=True, null=True, unique=True)
    user = models.ForeignKey(User, unique=True, related_name='profile')

    level = models.IntegerField(default=1)
    files_updated = models.DateTimeField(default=datetime.now)
    newsletter = models.BooleanField(default=True)
    ui = DictField(default={})
    preferences = DictField(default={})

    timesseen = models.IntegerField(default=0)
    ip = models.CharField(default='', max_length=255)
    useragent = models.CharField(default='', max_length=255)
    windowsize = models.CharField(default='', max_length=255)
    screensize = models.CharField(default='', max_length=255)

    def get_preferences(self):
        prefs = self.preferences
        prefs['email'] = self.user.email
        return prefs

    def get_ui(self):
        ui = {}
        config = copy.deepcopy(settings.CONFIG)
        ui.update(config['user']['ui'])
        def updateUI(ui, new):
            '''
                only update set keys in dicts
            '''
            for key in new:
                if isinstance(new[key], dict) and key in ui:
                    ui[key] = updateUI(ui[key], new[key])
                elif isinstance(ui, dict):
                    ui[key] = new[key]
            return ui
        ui = updateUI(ui, self.ui)
        if not 'lists' in ui:
            ui['lists'] = {}
            ui['lists'][''] = copy.deepcopy(config['user']['ui']['lists'][''])

        def add(lists, section):
            ids = []
            for l in lists:
                qs = Position.objects.filter(section=section)
                if section == 'featured':
                    try:
                        pos = Position.objects.get(list=l, section=section)
                        created = False
                    except Position.DoesNotExist:
                        pos = Position(list=l, section=section, user=self.user)
                        pos.save()
                        created = True 
                else:
                    pos, created = Position.objects.get_or_create(list=l, user=self.user, section=section)
                    qs = qs.filter(user=self.user)
                if created:
                    pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                    pos.save()
                id = l.get_id()
                '''
                if id not in ui['lists']:
                    ui['lists'][id] = {}
                    ui['lists'][id].update(ui['lists'][''])
                '''
                ids.append(id)
            return ids

        ids = ['']
        ids += add(self.user.lists.exclude(status="featured"), 'personal')
        ids += add(self.user.subscribed_lists.filter(status='public'), 'public')
        ids += add(List.objects.filter(status='featured'), 'featured')
        for i in ui['lists'].keys():
            if i not in ids:
                del ui['lists'][i]
        return ui

    def get_level(self):
        return ['guest', 'member', 'staff', 'admin'][self.level]

def user_post_save(sender, instance, **kwargs):
    profile, new = UserProfile.objects.get_or_create(user=instance)

models.signals.post_save.connect(user_post_save, sender=User)

def user_json(user, keys, request_user=None):
    p = user.get_profile()
    j = {
        'email': user.email,
        'firstseen': user.date_joined,
        'ip': p.ip,
        'lastseen': user.last_login,
        'level': p.get_level(),
        'numberoflists': user.lists.count(),
        'screensize': p.screensize,
        'timesseen': p.timesseen,
        'username': user.username,
        'useragent': p.useragent,
        'windowsize': p.windowsize,
    }
    if keys:
        for key in j.keys():
            if key not in keys:
                del j[key]
    return j

def init_user(user, request=None):
    profile = user.get_profile()
    if request:
        data = json.loads(request.POST.get('data', '{}'))
        screen = data.get('screen', {})
        if 'height' in screen and 'width' in screen:
            profile.screensize = '%sx%s' % (screen['width'], screen['height'])
        window = data.get('window', {})
        if 'outerHeight' in window and 'outerWidth' in window:
            profile.windowsize = '%sx%s' % (window['outerWidth'], window['outerHeight'])
        profile.ip = request.META['REMOTE_ADDR']
        profile.useragent = request.META['HTTP_USER_AGENT']
        if not profile.timesseen:
            profile.timesseen = 0
        profile.timesseen += 1
        profile.save()
    result = {}
    for key in ('username', ):
        result[key] = getattr(user, key)
    result['level'] = profile.get_level()
    result['groups'] = [g.name for g in user.groups.all()]
    result['preferences'] = profile.get_preferences()
    result['ui'] = profile.get_ui()
    result['volumes'] = [v.json() for v in user.volumes.all()] 
    return result

