# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement
import os
import subprocess
from glob import glob

from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
import ox

from ox.django.fields import DictField, TupleField

from archive import extract
import managers


class List(models.Model):

    class Meta:
        unique_together = ("user", "name")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, related_name='lists')
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, default='private')
    _status = ['private', 'public', 'featured']
    query = DictField(default={"static": True})
    type = models.CharField(max_length=255, default='static')
    description = models.TextField(default='')

    icon = models.ImageField(default=None, blank=True,
                             upload_to=lambda i, x: i.path("icon.jpg"))

    view = models.TextField(default=lambda: tuple(settings.CONFIG['user']['ui']['listView']))
    sort = TupleField(default=lambda: tuple(settings.CONFIG['user']['ui']['listSort']), editable=False)

    poster_frames = TupleField(default=[], editable=False)

    #is through table still required?
    items = models.ManyToManyField('item.Item', related_name='lists',
                                                through='ListItem')

    numberofitems = models.IntegerField(default=0)
    subscribed_users = models.ManyToManyField(User, related_name='subscribed_lists')

    objects = managers.ListManager()

    def save(self, *args, **kwargs):
        if self.query.get('static', False):
            self.type = 'static'
        else:
            self.type = 'smart'
        if self.id:
            self.numberofitems = self.get_numberofitems(self.user)
        super(List, self).save(*args, **kwargs)

    def get_items(self, user=None):
        if self.query.get('static', False):
            return self.items
        from item.models import Item
        return Item.objects.find({'query': self.query}, user)


    def get_numberofitems(self, user=None):
        return self.get_items(user).count()

    def add(self, item):
        q = self.items.filter(id=item.id)
        if q.count() == 0:
            l = ListItem()
            l.list = self
            l.item = item
            l.save()

    def remove(self, item):
        ListItem.objects.all().filter(item=item, list=self).delete()

    def __unicode__(self):
        return self.get_id()

    def get_id(self):
        return u'%s:%s' % (self.user.username, self.name)

    def accessible(self, user):
        return self.user == user or self.status in ('public', 'featured')

    def editable(self, user):
        #FIXME: make permissions work
        if self.user == user or user.is_staff:
            return True
        return False

    def json(self, keys=None, user=None):
        if not keys:
             keys=['id', 'name', 'user', 'type', 'query', 'status', 'subscribed', 'posterFrames', 'description']
        response = {}
        for key in keys:
            if key == 'items':
                response[key] = self.get_numberofitems(user)
            elif key == 'id':
                response[key] = self.get_id()
            elif key == 'user':
                response[key] = self.user.username
            elif key == 'query':
                if not self.query.get('static', False):
                    response[key] = self.query
            elif key == 'subscribers':
                response[key] = self.subscribed_users.all().count()
            elif key == 'subscribed':
                if user and not user.is_anonymous():
                    response[key] = self.subscribed_users.filter(id=user.id).exists()
            else:
                response[key] = getattr(self, {
                    'posterFrames': 'poster_frames'
                }.get(key, key))
        return response

    def path(self, name=''):
        h = "%06d" % self.id
        return os.path.join('lists', h[:2], h[2:4], h[4:6], h[6:], name)

    def update_icon(self):
        frames = []
        for i in self.poster_frames:
            from item.models import Item
            qs = Item.objects.filter(itemId=i['item'])
            if qs.count() > 0:
                frame = qs[0].frame(i['position'])
                if frame:
                    frames.append(frame)
        self.icon.name = self.path('icon.jpg')
        icon = self.icon.path
        if frames:
            while len(frames) < 4:
                frames += frames
            folder = os.path.dirname(icon)
            ox.makedirs(folder)
            for f in glob("%s/icon*.jpg" % folder):
                os.unlink(f)
            cmd = [
                settings.LIST_ICON,
                '-f', ','.join(frames),
                '-o', icon
            ]
            p = subprocess.Popen(cmd)
            p.wait()
            self.save()

    def get_icon(self, size=16):
        path = self.path('icon%d.jpg' % size)
        path = os.path.join(settings.MEDIA_ROOT, path)
        if not os.path.exists(path):
            folder = os.path.dirname(path)
            ox.makedirs(folder)
            if self.icon and os.path.exists(self.icon.path):
                source = self.icon.path
                max_size = min(self.icon.width, self.icon.height)
            else:
                source = os.path.join(settings.STATIC_ROOT, 'jpg/list256.jpg')
                max_size = 256
            if size < max_size:
                extract.resize_image(source, path, size=size)
            else:
                path = source
        return path

class ListItem(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    list = models.ForeignKey(List)
    item = models.ForeignKey('item.Item')

    def __unicode__(self):
        return u'%s in %s' % (self.item, self.list)


class Position(models.Model):

    class Meta:
        unique_together = ("user", "list", "section")

    list = models.ForeignKey(List, related_name='position')
    user = models.ForeignKey(User)
    section = models.CharField(max_length='255')
    position = models.IntegerField(default=0)

    def __unicode__(self):
        return u'%s/%s/%s' % (self.section, self.position, self.list)

