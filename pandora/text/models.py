# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement
import os
import re
import subprocess
from glob import glob
from urllib import quote

from django.db import models
from django.db.models import Max
from django.contrib.auth.models import User
from django.conf import settings
from django.db.models.signals import pre_delete
import ox
from oxdjango.fields import TupleField

from archive import extract
from archive.chunk import save_chunk

import managers


def get_path(i, x): return i.path(x)
def get_icon_path(i, x): return get_path(i, 'icon.jpg')

class Text(models.Model):

    class Meta:
        unique_together = ("user", "name")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, related_name='texts')
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, default='private')
    _status = ['private', 'public', 'featured']
    type = models.CharField(max_length=255, default='html')
    description = models.TextField(default='')
    rightslevel = models.IntegerField(db_index=True, default=0)
    icon = models.ImageField(default=None, blank=True, upload_to=get_icon_path)

    text = models.TextField(default="")
    embeds = TupleField(default=[], editable=True)

    poster_frames = TupleField(default=[], editable=False)
    subscribed_users = models.ManyToManyField(User, related_name='subscribed_texts')

    objects = managers.TextManager()
    uploading = models.BooleanField(default = False)
    file = models.FileField(default=None, blank=True,null=True, upload_to=get_path)

    def save(self, *args, **kwargs):
        self.rightslevel = min(self.rightslevel, len(settings.CONFIG['textRightsLevels']) - 1)
        super(Text, self).save(*args, **kwargs)

    def __unicode__(self):
        return self.get_id()

    @classmethod
    def get(cls, id):
        if id == '':
            return cls.objects.get(name='')
        else:
            id = id.split(':')
            username = id[0]
            name = ":".join(id[1:])
            return cls.objects.get(user__username=username, name=name)
    
    def get_absolute_url(self):
        return '/texts/%s' % quote(self.get_id().replace('_', '\t').replace(' ', '_').encode('utf-8')).replace('/', '%2F')

    def get_absolute_pdf_url(self):
        return '%s/text.pdf' % self.get_absolute_url()

    def get_id(self):
        return u'%s:%s' % (self.user.username, self.name)

    def accessible(self, user):
        return self.user == user or self.status in ('public', 'featured')

    def editable(self, user):
        if not user or user.is_anonymous():
            return False
        if self.user == user or \
           user.is_staff or \
           user.profile.capability('canEditFeaturedTexts') == True:
            return True
        return False

    def edit(self, data, user):
        for key in data:
            if key == 'status':
                value = data[key]
                if value not in self._status:
                    value = self._status[0]
                if value == 'private':
                    for user in self.subscribed_users.all():
                        self.subscribed_users.remove(user)
                    qs = Position.objects.filter(user=user,
                                                 section='section', text=self)
                    if qs.count() > 1:
                        pos = qs[0]
                        pos.section = 'personal'
                        pos.save()
                elif value == 'featured':
                    if user.profile.capability('canEditFeaturedTexts'):
                        pos, created = Position.objects.get_or_create(text=self, user=user,
                                                                             section='featured')
                        if created:
                            qs = Position.objects.filter(user=user, section='featured')
                            pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                            pos.save()
                        Position.objects.filter(text=self).exclude(id=pos.id).delete()
                    else:
                        value = self.status
                elif self.status == 'featured' and value == 'public':
                    Position.objects.filter(text=self).delete()
                    pos, created = Position.objects.get_or_create(text=self,
                                                  user=self.user,section='personal')
                    qs = Position.objects.filter(user=self.user,
                                                        section='personal')
                    pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                    pos.save()
                    for u in self.subscribed_users.all():
                        pos, created = Position.objects.get_or_create(text=self, user=u,
                                                                             section='public')
                        qs = Position.objects.filter(user=u, section='public')
                        pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                        pos.save()

                self.status = value
            elif key == 'name':
                data['name'] = re.sub(' \[\d+\]$', '', data['name']).strip()
                if not data['name']:
                    data['name'] = "Untitled"
                name = data['name']
                num = 1
                while Text.objects.filter(name=name, user=self.user).exclude(id=self.id).count()>0:
                    num += 1
                    name = data['name'] + ' [%d]' % num
                self.name = name
            elif key == 'description':
                self.description = ox.sanitize_html(data['description'], global_attributes=['lang'])
            elif key == 'text':
                self.text = ox.sanitize_html(data['text'], global_attributes=[
                    'data-name',
                    'data-type',
                    'data-value',
                    'lang'
                ])
            elif key == 'rightslevel':
                self.rightslevel = int(data['rightslevel'])

        if 'position' in data:
            pos, created = Position.objects.get_or_create(text=self, user=user)
            pos.position = data['position']
            pos.section = 'featured'
            if self.status == 'private':
                pos.section = 'personal'
            pos.save()
        if 'type' in data:
            self.type = data['type'] == 'pdf' and 'pdf' or 'html'
        if 'posterFrames' in data:
            poster_frames = [p for p in data['posterFrames'] if 'item' in p]
            while len(poster_frames) < 4:
                poster_frames += [poster_frames[-1]]
            self.poster_frames = tuple(poster_frames)
        if 'embeds' in data:
            self.embeds = tuple(data['embeds'])
        self.save()
        if 'posterFrames' in data:
            self.update_icon()

    def json(self, keys=None, user=None):
        default_keys = ['id']
        if not keys:
             keys=[
                'description',
                'editable',
                'rightslevel',
                'id',
                'links',
                'name',
                'posterFrames',
                'status',
                'subscribed',
                'text',
                'type',
                'user',
                'uploaded',
                'embeds',
                'names',
            ]
        response = {}
        _map = {
            'posterFrames': 'poster_frames'
        }
        for key in keys:
            if key == 'id':
                response[key] = self.get_id()
            elif key == 'editable':
                response[key] = self.editable(user)
            elif key == 'user':
                response[key] = self.user.username
            elif key == 'subscribers':
                response[key] = self.subscribed_users.all().count()
            elif key == 'subscribed':
                if user and not user.is_anonymous():
                    response[key] = self.subscribed_users.filter(id=user.id).exists()
            elif hasattr(self, _map.get(key, key)):
                response[key] = getattr(self, _map.get(key,key))
        if self.type == 'pdf':
            response['uploaded'] = True if self.file and not self.uploading else False
            response['embeds'] = self.embeds
            response['names'] = []
        else:
            response['names'] = re.compile('<[^<>]*?data-name="(.+?)"').findall(self.text)

        for key in response.keys():
            if key not in keys + default_keys:
                del response[key]
        return response

    def path(self, name=''):
        h = "%07d" % self.id
        return os.path.join('texts', h[:2], h[2:4], h[4:6], h[6:], name)

    def update_icon(self):
        frames = []
        if not self.poster_frames:
            items = self.get_items(self.user).filter(rendered=True)
            if items.count():
                poster_frames = []
                for i in range(0, items.count(), max(1, int(items.count()/4))):
                    poster_frames.append({
                        'item': items[int(i)].public_id,
                        'position': items[int(i)].poster_frame
                    })
                self.poster_frames = tuple(poster_frames)
                self.save()
        for i in self.poster_frames:
            from item.models import Item
            qs = Item.objects.filter(public_id=i['item'])
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
            p = subprocess.Popen(cmd, close_fds=True)
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

    def save_chunk(self, chunk, offset=None, done=False):
        if self.uploading:
            name = self.path('data.pdf')

            def done_cb():
                if done:
                    self.uploading = False
                    self.save()
                return True, self.file.size

            return save_chunk(self, self.file, chunk, offset, name, done_cb)
        return False, 0

def delete_file(sender, **kwargs):
    t = kwargs['instance']
    if t.file:
        t.file.delete(save=False)
pre_delete.connect(delete_file, sender=Text)

class Position(models.Model):

    class Meta:
        unique_together = ("user", "text", "section")

    text = models.ForeignKey(Text, related_name='position')
    user = models.ForeignKey(User, related_name='text_position')
    section = models.CharField(max_length=255)
    position = models.IntegerField(default=0)

    def __unicode__(self):
        return u'%s/%s/%s' % (self.section, self.position, self.text)

