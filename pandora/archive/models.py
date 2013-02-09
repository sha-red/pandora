# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import os.path
import re
import time
import shutil

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.db.models import Q
from django.db.models.signals import pre_delete

from ox.django import fields
import ox
import chardet

from item import utils
import item.models
from person.models import get_name_sort

import extract


class File(models.Model):
    AV_INFO = (
        'duration', 'video', 'audio', 'oshash', 'size',
    )

    PATH_INFO = (
        'episodes', 'extension', 'language', 'part', 'partTitle', 'version'
    )
    ITEM_INFO = (
        'title', 'director', 'year',
        'season', 'episode', 'episodeTitle',
        'seriesTitle', 'seriesYear'
    )

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    oshash = models.CharField(max_length=16, unique=True)
    item = models.ForeignKey("item.Item", related_name='files', null=True)

    path = models.CharField(max_length=2048, default="") # canoncial path/file
    sort_path = models.CharField(max_length=2048, default="") # sort name

    type = models.CharField(default="", max_length=255)

    #editable
    extension = models.CharField(default="", max_length=255, null=True) 
    language = models.CharField(default="", max_length=8, null=True)
    part = models.CharField(default="", max_length=255, null=True)
    part_title = models.CharField(default="", max_length=255, null=True)
    version = models.CharField(default="", max_length=255, null=True) 

    size = models.BigIntegerField(default=0)
    duration = models.FloatField(null=True)

    info = fields.DictField(default={})

    video_codec = models.CharField(max_length=255)
    pixel_format = models.CharField(max_length=255)
    display_aspect_ratio = models.CharField(max_length=255)
    width = models.IntegerField(default = 0)
    height = models.IntegerField(default = 0)
    framerate = models.CharField(max_length=255)

    audio_codec = models.CharField(max_length=255)
    channels = models.IntegerField(default=0)
    samplerate = models.IntegerField(default=0)

    bits_per_pixel = models.FloatField(default=-1)
    pixels = models.BigIntegerField(default=0)

    #This is true if derivative is available or subtitles where uploaded
    available = models.BooleanField(default = False)
    selected = models.BooleanField(default = False)
    uploading = models.BooleanField(default = False)
    wanted = models.BooleanField(default = False)

    is_audio = models.BooleanField(default=False)
    is_video = models.BooleanField(default=False)
    is_subtitle = models.BooleanField(default=False)

    #upload and data handling
    data = models.FileField(null=True, blank=True,
                            upload_to=lambda f, x: f.get_path('data.bin'))

    def __unicode__(self):
        return self.path

    def parse_info(self):
        if self.info:
            for key in ('duration', 'size'):
                setattr(self, key, self.info.get(key, 0))

            if 'video' in self.info and self.info['video'] and \
               'width' in self.info['video'][0]:
                video = self.info['video'][0]
                self.video_codec = video['codec']
                self.width = video['width']
                self.height = video['height']
                self.framerate = video['framerate']
                if 'display_aspect_ratio' in video:
                    self.display_aspect_ratio = video['display_aspect_ratio']
                else:
                    self.display_aspect_ratio = "%s:%s" % (self.width, self.height)
                self.is_video = True
                self.is_audio = False
                if self.path.endswith('.jpg') or \
                   self.path.endswith('.png') or \
                   self.path.endswith('.txt') or \
                   self.video_codec == 'ansi' or \
                   self.duration == 0.04:
                    self.is_video = False
                    self.video_codec = ''
            else:
                self.is_video = False
                self.display_aspect_ratio = "4:3"
                self.width = 0
                self.height = 0
            if 'audio' in self.info and self.info['audio'] and self.duration > 0:
                audio = self.info['audio'][0]
                self.audio_codec = audio['codec']
                self.samplerate = audio.get('samplerate', 0)
                self.channels = audio.get('channels', 0)

                if not self.is_video:
                    self.is_audio = True
            else:
                self.is_audio = False
                self.audio_codec = ''
                self.sampleate = 0
                self.channels = 0

            if self.framerate:
                self.pixels = int(self.width * self.height * float(utils.parse_decimal(self.framerate)) * self.duration)


    def get_path_info(self):
        data = {}
        for key in self.PATH_INFO:
            data[key] = self.info.get(key, None)
        if self.item:
            for key in self.ITEM_INFO:
                data[key] = self.item.get(key)
            data['directorSort'] = [get_name_sort(n) for n in self.item.get('director', [])]
        data['isEpisode'] = data.get('season') != None \
                or data.get('episode') != None \
                or data.get('episodes') not in ([], None) \
                or (data.get('seriesTitle') and data.get('episodeTitle'))
        if data['isEpisode'] and data['seriesYear'] == None:
            data['seriesYear'] = data['year']
        data['type'] = 'unknown'
        if 'extension' in data and data['extension']:
            data['extension'] = data['extension'].lower()
            for type in ox.movie.EXTENSIONS:
                if data['extension'] in ox.movie.EXTENSIONS[type]:
                    data['type'] = type
        return data

    def normalize_path(self):
        #FIXME: always use format_path
        if settings.USE_IMDB:
            return ox.movie.format_path(self.get_path_info())
        else:
            path = self.path or ''
            if self.instances.all().count():
                path = self.instances.all()[0].path
            return path

    def update_info(self, info, user):
        #populate name sort with director if unknown
        if info.get('director') and info.get('directorSort'):
            for name, sortname in zip(info['director'], info['directorSort']):
                get_name_sort(name, sortname)
        self.item = item.models.get_item(info, user)
        for key in self.AV_INFO + self.PATH_INFO:
            if key in info:
                self.info[key] = info[key]
        self.parse_info()

    def save(self, *args, **kwargs):
        if self.id and self.info:
            self.path = self.normalize_path()
        if self.item:
            data = self.get_path_info()
            self.extension = data.get('extension')
            self.language = data.get('language')
            self.part = ox.sort_string(unicode(data.get('part') or ''))
            self.part_title = ox.sort_string(unicode(data.get('partTitle')) or '')
            self.type = data.get('type') or 'unknown'
            self.version = data.get('version')

        if self.path:
            self.sort_path = utils.sort_string(self.path)
            self.is_audio = self.type == 'audio'
            self.is_video = self.type == 'video'
            self.is_subtitle = self.path.endswith('.srt')

        if self.type not in ('audio', 'video'):
            self.duration = None
        elif self.duration <= 0:
            self.duration = sum([s.info.get('duration',0)
                for s in self.streams.filter(source=None)])

        if self.is_subtitle:
            self.available = self.data and True or False
        else:
            self.available = not self.uploading and \
                self.streams.filter(source=None, available=True).count() > 0
        super(File, self).save(*args, **kwargs)

    def get_path(self, name):
        h = self.oshash
        return os.path.join('files', h[:2], h[2:4], h[4:6], h[6:], name)

    def contents(self):
        if self.data != None:
            self.data.seek(0)
            return self.data.read()
        return None

    def srt(self, offset=0):
        srt = ox.srt.load(self.data.path)
        #subtitles should not overlap
        for i in range(1, len(srt)):
            if srt[i-1]['out'] > srt[i]['in']:
                srt[i-1]['out'] = srt[i]['in']

        def shift(s):
            s['in'] += offset
            s['out'] += offset
            return s
        if offset:
            srt = map(shift, srt)
        return srt

    def editable(self, user):
        p = user.get_profile()
        return p.get_level() in ('admin', 'staff') or \
            self.instances.filter(volume__user=user).count() > 0 or \
            (not self.item or self.item.user == user)

    def save_chunk(self, chunk, chunk_id=-1, done=False):
        if not self.available:
            config = settings.CONFIG['video']
            stream, created = Stream.objects.get_or_create(
                        file=self,
                        resolution=config['resolutions'][0],
                        format=config['formats'][0])
            if created:
                stream.video.name = stream.path(stream.name())
                ox.makedirs(os.path.dirname(stream.video.path))
                with open(stream.video.path, 'w') as f:
                    f.write(chunk.read())
                stream.save()
            else:
                with open(stream.video.path, 'a') as f:
                    #FIXME: should check that chunk_id/offset is right
                    f.write(chunk.read())
            if done:
                stream.available = True
                stream.save()
            return True
        return False

    def json(self, keys=None, user=None):
        resolution = (self.width, self.height)
        if resolution == (0, 0) or self.type != 'video':
            resolution = None
        duration = self.duration
        if self.type != 'video':
            duration = None
        data = {
            'audioCodec': self.audio_codec,
            'available': self.available,
            'duration': duration,
            'framerate': self.framerate,
            'id': self.oshash,
            'instances': [i.json() for i in self.instances.all()],
            'path': self.path,
            'resolution': resolution,
            'samplerate': self.samplerate,
            'selected': self.selected,
            'size': self.size,
            'type': self.type,
            'videoCodec': self.video_codec,
            'wanted': self.wanted,
        }
        for key in self.PATH_INFO:
            data[key] = self.info.get(key)
        data['users'] = list(set([i['user'] for i in data['instances']]))
        if keys:
            for k in data.keys():
                if k not in keys:
                    del data[k]
        return data

    def all_paths(self):
        return [self.path] + [i.path for i in self.instances.all()]

    def delete_frames(self):
        frames = os.path.join(settings.MEDIA_ROOT, self.get_path('frames'))
        if os.path.exists(frames):
            shutil.rmtree(frames)

def delete_file(sender, **kwargs):
    f = kwargs['instance']
    #FIXME: delete streams here
    if f.data:
        f.data.delete()
pre_delete.connect(delete_file, sender=File)

class Volume(models.Model):

    class Meta:
        unique_together = ("user", "name")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(User, related_name='volumes')
    name = models.CharField(max_length=1024)

    def __unicode__(self):
        return u"%s's %s"% (self.user, self.name)

    def json(self):
        return {
            'name': self.name,
            'path': 'unknown',
            'items': self.files.count()
        }

class Instance(models.Model):

    class Meta:
        unique_together = ("path", "volume")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    atime = models.IntegerField(default=lambda: int(time.time()), editable=False)
    ctime = models.IntegerField(default=lambda: int(time.time()), editable=False)
    mtime = models.IntegerField(default=lambda: int(time.time()), editable=False)

    path = models.CharField(max_length=2048)
    ignore = models.BooleanField(default=False)

    file = models.ForeignKey(File, related_name='instances')
    volume = models.ForeignKey(Volume, related_name='files')

    def __unicode__(self):
        return u"%s's %s <%s>"% (self.volume.user, self.path, self.file.oshash)

    @property
    def itemId(self):
        return File.objects.get(oshash=self.oshash).itemId

    def json(self):
        return {
            'ignore': self.ignore,
            'path': self.path,
            'user': self.volume.user.username,
            'volume': self.volume.name,
        }

def frame_path(frame, name):
    ext = os.path.splitext(name)[-1]
    name = "%s%s" % (frame.position, ext)
    return frame.file.get_path(name)


class Frame(models.Model):

    class Meta:
        unique_together = ("file", "position")
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    file = models.ForeignKey(File, related_name="frames")
    position = models.FloatField()
    frame = models.ImageField(default=None, null=True, upload_to=frame_path)

    '''
    def save(self, *args, **kwargs):
        name = "%d.jpg" % self.position
        if file.name != name:
            #FIXME: frame path should be renamed on save to match current position
        super(Frame, self).save(*args, **kwargs)
    '''

    def __unicode__(self):
        return u'%s/%s' % (self.file, self.position)

def delete_frame(sender, **kwargs):
    f = kwargs['instance']
    if f.frame:
        f.frame.delete()
pre_delete.connect(delete_frame, sender=Frame)


class Stream(models.Model):

    class Meta:
        unique_together = ("file", "resolution", "format")

    file = models.ForeignKey(File, related_name='streams')
    resolution = models.IntegerField(default=96)
    format = models.CharField(max_length=255, default='webm')

    video = models.FileField(default=None, blank=True, upload_to=lambda f, x: f.path(x))
    source = models.ForeignKey('Stream', related_name='derivatives', default=None, null=True)
    available = models.BooleanField(default=False)
    oshash = models.CharField(max_length=16, null=True, db_index=True)
    info = fields.DictField(default={})
    duration = models.FloatField(default=0)
    aspect_ratio = models.FloatField(default=0)

    cuts = fields.TupleField(default=[])
    color = fields.TupleField(default=[])
    volume = models.FloatField(default=0)

    @property
    def timeline_prefix(self):
        return os.path.join(settings.MEDIA_ROOT, self.path())
        return os.path.join(settings.MEDIA_ROOT, self.path(), 'timeline')

    def name(self):
        return u"%sp.%s" % (self.resolution, self.format)
        
    def __unicode__(self):
        return u"%s/%s" % (self.file, self.name())

    def path(self, name=''):
        return self.file.get_path(name)

    def extract_derivatives(self, rebuild=False):
        config = settings.CONFIG['video']
        for resolution in config['resolutions']:
            for f in config['formats']:
                derivative, created = Stream.objects.get_or_create(file=self.file,
                                                  resolution=resolution, format=f)
                
                name = derivative.name()
                name = os.path.join(os.path.dirname(self.video.name), name)
                if created:
                    derivative.source = self
                    derivative.save()
                    derivative.video.name = name
                    derivative.encode()
                    derivative.save()
                elif rebuild or not derivative.available:
                    if not derivative.video:
                        derivative.video.name = name
                    derivative.encode()
        return True

    def encode(self):
        if self.source:
            video = self.source.video.path
            target = self.video.path
            info = ox.avinfo(video)
            if extract.stream(video, target, self.name(), info):
                self.available = True
            else:
                self.available = False
            self.save()

    def make_timeline(self):
        if self.available and not self.source:
            extract.timeline(self.video.path, self.timeline_prefix)
            self.cuts = tuple(extract.cuts(self.timeline_prefix))
            self.color = tuple(extract.average_color(self.timeline_prefix))
            self.volume = extract.average_volume(self.timeline_prefix)
            self.save()

    def save(self, *args, **kwargs):
        if self.video and not self.info:
            self.info = ox.avinfo(self.video.path)
        self.oshash = self.info.get('oshash')
        self.duration = self.info.get('duration', 0)
        if 'video' in self.info and self.info['video']:
            if 'display_aspect_ratio' in self.info['video'][0]:
                dar = map(int, self.info['video'][0]['display_aspect_ratio'].split(':'))
                self.aspect_ratio = dar[0] / dar[1]
            else:
                self.aspect_ratio = self.info['video'][0]['width'] / self.info['video'][0]['height']
        else:
            self.aspect_ratio = 128/80
        super(Stream, self).save(*args, **kwargs)
        if self.available and not self.file.available:
            self.file.save()

    def json(self):
        return {
            'duration': self.duration,
            'aspectratio': self.aspect_ratio,
        }

def delete_stream(sender, **kwargs):
    f = kwargs['instance']
    if f.video:
        f.video.delete()
pre_delete.connect(delete_stream, sender=Stream)
