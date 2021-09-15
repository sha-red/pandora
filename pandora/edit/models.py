# -*- coding: utf-8 -*-

from glob import glob
from urllib.parse import quote
import os
import re
import shutil
import subprocess
import tempfile

import ox
from django.conf import settings
from django.db import models, transaction
from django.db.models import Max
from django.contrib.auth import get_user_model
from django.core.cache import cache

from oxdjango.fields import JSONField

from annotation.models import Annotation
from item.models import Item
from item.utils import get_by_id
import clip.models

from archive import extract
from user.utils import update_groups
from user.models import Group
from clip.utils import add_cuts

from . import managers


User = get_user_model()

def get_path(f, x): return f.path(x)
def get_icon_path(f, x): return get_path(f, 'icon.jpg')

class Edit(models.Model):

    class Meta:
        unique_together = ("user", "name")

    objects = managers.EditManager()

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, related_name='edits', on_delete=models.CASCADE)
    groups = models.ManyToManyField(Group, blank=True, related_name='edits')
    name = models.CharField(max_length=255)

    status = models.CharField(max_length=20, default='private')
    _status = ['private', 'public', 'featured']
    description = models.TextField(default='')
    rightslevel = models.IntegerField(db_index=True, default=0)

    query = JSONField(default=lambda: {"static": True}, editable=False)
    type = models.CharField(max_length=255, default='static')

    icon = models.ImageField(default=None, blank=True, null=True, upload_to=get_icon_path)

    poster_frames = JSONField(default=list, editable=False)
    subscribed_users = models.ManyToManyField(User, related_name='subscribed_edits')

    def __str__(self):
        return '%s (%s)' % (self.name, self.user)

    @classmethod
    def get(cls, id):
        id = id.split(':')
        username = id[0]
        name = ":".join(id[1:])
        return cls.objects.get(user__username=username, name=name)
    
    def get_id(self):
        return '%s:%s' % (self.user.username, self.name)
    
    def get_absolute_url(self):
        return ('/edits/%s' % quote(self.get_id())).replace('%3A', ':')

    def add_clip(self, data, index=None):
        if index is not None:
            ids = [i['id'] for i in self.clips.order_by('index').values('id')]
        c = Clip(edit=self)
        if 'annotation' in data and data['annotation']:
            c.annotation = Annotation.objects.get(public_id=data['annotation'])
            c.item = c.annotation.item
        elif 'item' in data and 'in' in data and 'out' in data:
            c.item = Item.objects.get(public_id=data['item'])
            c.start = data['in']
            c.end = data['out']
        else:
            return False
        if index is not None:
            c.index = index
        # dont add clip if in/out are invalid
        if not c.annotation:
            duration = c.item.sort.duration
            if c.start is None or c.end is None:
                return False
            if c.start > c.end \
                    or round(c.start, 3) >= round(duration, 3) \
                    or round(c.end, 3) > round(duration, 3):
                return False
        if 'volume' in data:
            c.volume = float(data['volume'])
        c.save()
        if index is not None:
            ids.insert(index, c.id)
            self.sort_clips(ids)
        return c

    def add_clips(self, clips, index=None, user=None):
        if index is None:
            index = self.clips.count()
        ids = [i['id'] for i in self.clips.order_by('index').values('id')]
        added = []
        with transaction.atomic():
            for data in clips:
                c = self.add_clip(data)
                if c:
                    ids.insert(index, c.id)
                    added.append(c.json(user))
                    added[-1]['index'] = index
                    index += 1
                else:
                    return False
        self.sort_clips(ids)
        return added

    def sort_clips(self, ids):
        index = 0
        with transaction.atomic():
            for i in ids:
                Clip.objects.filter(id=i).update(index=index)
                index += 1

    def accessible(self, user):
        return self.user == user or self.status in ('public', 'featured')

    def editable(self, user):
        if not user or user.is_anonymous:
            return False
        if self.user == user or \
           self.groups.filter(id__in=user.groups.all()).count() > 0 or \
           user.is_staff or \
           user.profile.capability('canEditFeaturedEdits'):
            return True
        return False

    def edit(self, data, user):
        if 'groups' in data:
            groups = data.pop('groups')
            update_groups(self, groups)
        for key in data:
            if key == 'status':
                value = data[key]
                if value not in self._status:
                    value = self._status[0]
                if value == 'private':
                    for user in self.subscribed_users.all():
                        self.subscribed_users.remove(user)
                    qs = Position.objects.filter(user=user,
                                                 section='section', edit=self)
                    if qs.count() > 1:
                        pos = qs[0]
                        pos.section = 'personal'
                        pos.save()
                elif value == 'featured':
                    if user.profile.capability('canEditFeaturedEdits'):
                        pos, created = Position.objects.get_or_create(edit=self, user=user,
                                                                      section='featured')
                        if created:
                            qs = Position.objects.filter(user=user, section='featured')
                            pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                            pos.save()
                        Position.objects.filter(edit=self).exclude(id=pos.id).delete()
                    else:
                        value = self.status
                elif self.status == 'featured' and value == 'public':
                    Position.objects.filter(edit=self).delete()
                    pos, created = Position.objects.get_or_create(edit=self,
                                                                  user=self.user, section='personal')
                    qs = Position.objects.filter(user=self.user,
                                                 section='personal')
                    pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                    pos.save()
                    for u in self.subscribed_users.all():
                        pos, created = Position.objects.get_or_create(edit=self, user=u,
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
                while Edit.objects.filter(name=name, user=self.user).exclude(id=self.id).count() > 0:
                    num += 1
                    name = data['name'] + ' [%d]' % num
                self.name = name
            elif key == 'description':
                self.description = ox.sanitize_html(data['description'])
            elif key == 'rightslevel':
                self.rightslevel = int(data['rightslevel'])
            if key == 'query' and not data['query']:
                setattr(self, key, {"static": True})
            elif key == 'query' and isinstance(data[key], dict):
                setattr(self, key, data[key])

        if 'position' in data:
            pos, created = Position.objects.get_or_create(edit=self, user=user)
            pos.position = data['position']
            pos.section = 'featured'
            if self.status == 'private':
                pos.section = 'personal'
            pos.save()
        if 'type' in data:
            if data['type'] == 'static':
                self.query = {"static": True}
                self.type = 'static'
            else:
                self.type = 'smart'
                if self.query.get('static', False):
                    self.query = {'conditions': [], 'operator': '&'}
        if 'posterFrames' in data:
            self.poster_frames = tuple(data['posterFrames'])
        self.save()
        if 'posterFrames' in data:
            self.update_icon()

    def path(self, name=''):
        h = "%07d" % self.id
        return os.path.join('edits', h[:2], h[2:4], h[4:6], h[6:], name)

    def get_items(self, user=None):
        if self.type == 'static':
            return Item.objects.filter(editclip__id__in=self.clips.all()).distinct()
        else:
            return Item.objects.find({'query': self.query}, user)

    def get_clips(self, user=None):
        if self.type == 'static':
            clips = self.clips.all()
        else:
            clips_query = self.clip_query()
            if clips_query['conditions']:
                clips = clip.models.Clip.objects.find({'query': clips_query}, user)
                items = self.get_items(user).values('id')
                clips = clips.filter(item__in=items)
            else:
                clips = clip.models.Clip.objects.filter(id=None)
        return clips

    def get_clips_json(self, user=None):
        qs = self.get_clips(user)
        if self.type == 'static':
            clips = [c.json(user=user) for c in qs.order_by('index')]
        else:
            if qs is None:
                clips = []
            else:
                clips = [c.edit_json(user) for c in qs]
                index = 0
                for c in clips:
                    c['index'] = index
                    index += 1
        return clips, qs

    def clip_query(self):
        def get_conditions(conditions):
            clip_conditions = []
            for condition in conditions:
                if 'conditions' in condition:
                    clip_conditions.append({
                        'operator': condition.get('operator', '&'),
                        'conditions': get_conditions(condition['conditions'])
                    })
                elif condition['key'] == 'annotations' or \
                        get_by_id(settings.CONFIG['layers'], condition['key']):
                    clip_conditions.append(condition)
            return clip_conditions

        return {
            'conditions': get_conditions(self.query.get('conditions', [])),
            'operator': self.query.get('operator', '&')
        }

    def update_icon(self):
        frames = []
        if not self.poster_frames:
            items = self.get_items(self.user).filter(rendered=True)
            items_count = items.count()
            if 0 < items_count <= 1000:
                poster_frames = []
                for i in range(0, items_count, max(1, int(items_count/4))):
                    poster_frames.append({
                        'item': items[int(i)].public_id,
                        'position': items[int(i)].poster_frame
                    })
                self.poster_frames = tuple(poster_frames)
                self.save()
        for i in self.poster_frames:
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
                try:
                    os.unlink(f)
                except:
                    pass
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

    def json(self, keys=None, user=None):
        if not keys:
            keys = [
                'clips',
                'description',
                'duration',
                'editable',
                'groups',
                'id',
                'items',
                'name',
                'posterFrames',
                'query',
                'rightslevel',
                'status',
                'subscribed',
                'type',
                'user',
            ]
        response = {
        }
        _map = {
            'posterFrames': 'poster_frames'
        }
        if 'clips' in keys:
            clips, clips_qs = self.get_clips_json(user)
        else:
            clips_qs = self.get_clips(user)

        for key in keys:
            if key == 'id':
                response[key] = self.get_id()
            elif key == 'items':
                response[key] = 0 if clips_qs is None else clips_qs.count()
            elif key == 'query':
                if not self.query.get('static', False):
                    response[key] = self.query
            elif key == 'clips':
                response[key] = clips
            elif key == 'duration':
                if clips_qs is None:
                    response[key] = 0
                elif self.type == 'static':
                    response[key] = sum([(c['annotation__end'] or c['end']) - (c['annotation__start'] or c['start'])
                                         for c in clips_qs.values('start', 'end', 'annotation__start', 'annotation__end')])
                else:
                    response[key] = sum([c['end'] - c['start'] for c in clips_qs.values('start', 'end')])
            elif key == 'editable':
                response[key] = self.editable(user)
            elif key == 'user':
                response[key] = self.user.username
            elif key == 'groups':
                response[key] = [g.name for g in self.groups.all()]
            elif key == 'subscribers':
                response[key] = self.subscribed_users.all().count()
            elif key == 'subscribed':
                if user and not user.is_anonymous:
                    response[key] = self.subscribed_users.filter(id=user.id).exists()
            elif hasattr(self, _map.get(key, key)):
                response[key] = getattr(self, _map.get(key, key))
        return response

    def render(self):
        # creating a new file from clips
        tmp = tempfile.mkdtemp()
        clips = []
        for clip in self.clips.all().order_by('index'):
            data = clip.json()
            clips.append(os.path.join(tmp, '%06d.webm' % data['index']))
            path = clip.item.streams()[0].media.path
            cmd = ['avconv', '-i', path,
                   '-ss', data['in'], '-t', data['out'],
                   '-vcodec', 'copy', '-acodec', 'copy',
                   clips[-1]]
            #p = subprocess.Popen(cmd, close_fds=True)
            #p.wait()
        cmd = ['mkvmerge', clips[0]] \
            + ['+'+c for c in clips[1:]] \
            + [os.path.join(tmp, 'render.webm')]
        #p = subprocess.Popen(cmd, close_fds=True)
        #p.wait()
        shutil.rmtree(tmp)

class Clip(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    edit = models.ForeignKey(Edit, related_name='clips', on_delete=models.CASCADE)
    index = models.IntegerField(default=0)
    item = models.ForeignKey(Item, null=True, default=None, related_name='editclip', on_delete=models.CASCADE)
    annotation = models.ForeignKey(Annotation, null=True, default=None, related_name='editclip', on_delete=models.CASCADE)
    start = models.FloatField(default=0)
    end = models.FloatField(default=0)
    duration = models.FloatField(default=0)
    volume = models.FloatField(default=1)

    hue = models.FloatField(default=0)
    saturation = models.FloatField(default=0)
    lightness = models.FloatField(default=0)
    sortvolume = models.FloatField(default=0)
    sortvalue = models.CharField(max_length=1000, null=True, db_index=True)

    objects = managers.ClipManager()

    def __str__(self):
        if self.annotation:
            return '%s' % self.annotation.public_id
        return '%s/%0.3f-%0.3f' % (self.item.public_id, self.start, self.end)
    
    def get_id(self):
        return ox.toAZ(self.id)
    
    def save(self, *args, **kwargs):
        if self.duration != self.end - self.start:
            self.update_calculated_values()
        sortvalue = ''
        if self.id:
            for l in settings.CONFIG.get('clipLayers', []):
                sortvalue += ''.join([a.sortvalue
                                      for a in self.get_annotations().filter(layer=l)
                                      if a.sortvalue])
        if sortvalue:
            self.sortvalue = sortvalue[:900]
        else:
            self.sortvalue = None
        super(Clip, self).save(*args, **kwargs)

    def update_calculated_values(self):
        start = self.start
        end = self.end
        self.duration = end - start
        if int(end*25) - int(start*25) > 0:
            self.hue, self.saturation, self.lightness = extract.average_color(
                self.item.timeline_prefix, self.start, self.end)
            self.sortvolume = extract.average_volume(self.item.timeline_prefix, self.start, self.end)
        else:
            self.hue = self.saturation = self.lightness = 0
            self.sortvolume = 0

    def json(self, user=None):
        data = {
            'id': self.get_id(),
            'index': self.index,
            'volume': self.volume,
        }
        if self.annotation:
            data['annotation'] = self.annotation.public_id
            data['item'] = self.item.public_id
            data['in'] = self.annotation.start
            data['out'] = self.annotation.end
            data['parts'] = self.annotation.item.cache['parts']
            data['durations'] = self.annotation.item.cache['durations']
        else:
            data['item'] = self.item.public_id
            data['in'] = self.start
            data['out'] = self.end
            data['parts'] = self.item.cache['parts']
            data['durations'] = self.item.cache['durations']
        for key in ('title', 'director', 'year', 'videoRatio'):
            value = self.item.cache.get(key)
            if value:
                data[key] = value
        data['duration'] = data['out'] - data['in']
        add_cuts(data, self.item, self.start, self.end)
        data['layers'] = self.get_layers(user)
        data['streams'] = [s.file.oshash for s in self.item.streams()]
        return data

    def get_annotations(self):
        if self.annotation:
            start = self.annotation.start
            end = self.annotation.end
            item = self.annotation.item
        else:
            start = self.start
            end = self.end
            item = self.item
        qs = Annotation.objects.filter(item=item).order_by('start', 'sortvalue')
        qs = qs.filter(start__lt=end, end__gt=start)
        return qs

    def get_layers(self, user=None):
        if self.annotation:
            start = self.annotation.start
            end = self.annotation.end
            item = self.annotation.item
        else:
            start = self.start
            end = self.end
            item = self.item

        return clip.models.get_layers(item=item, interval=(start, end), user=user)

class Position(models.Model):

    class Meta:
        unique_together = ("user", "edit", "section")

    edit = models.ForeignKey(Edit, related_name='position', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='edit_position', on_delete=models.CASCADE)
    section = models.CharField(max_length=255)
    position = models.IntegerField(default=0)

    def __str__(self):
        return '%s/%s/%s' % (self.section, self.position, self.edit)

