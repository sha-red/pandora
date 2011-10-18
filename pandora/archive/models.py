# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

import os.path
import re
import time

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.db.models import Q
from django.db.models.signals import pre_delete

from ox.django import fields
import ox
import chardet

from item import utils

import extract


class File(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    auto = models.BooleanField(default=True)

    oshash = models.CharField(max_length=16, unique=True)
    item = models.ForeignKey("item.Item", related_name='files')

    path = models.CharField(max_length=2048, default="") # canoncial path/file
    sort_path = models.CharField(max_length=2048, default="") # sort name

    type = models.CharField(default="", max_length=255)
    part = models.IntegerField(null=True)
    version = models.CharField(default="", max_length=255) 
    language = models.CharField(default="", max_length=8)

    season = models.IntegerField(default=-1)
    episode = models.IntegerField(default=-1)

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

    def __unicode__(self):
        return self.path

    def set_state(self):
        self.path = self.create_path()
        self.sort_path= utils.sort_string(self.path)

        if not os.path.splitext(self.path)[-1] in (
            '.srt', '.rar', '.sub', '.idx', '.txt', '.jpg', '.png', '.nfo') \
           and self.info:
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
                   self.duration == 0.04:
                    self.is_video = False
            else:
                self.is_video = False
                self.display_aspect_ratio = "4:3"
                self.width = '320'
                self.height = '240'
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

        else:
            self.is_video = os.path.splitext(self.path)[-1] in ('.avi', '.mkv', '.dv', '.ogv', '.mpeg', '.mov', '.webm')
            self.is_audio = os.path.splitext(self.path)[-1] in ('.mp3', '.wav', '.ogg', '.flac', '.oga')
            self.is_subtitle = os.path.splitext(self.path)[-1] in ('.srt', )

        if self.path.endswith('.srt'):
            self.is_subtitle = True
            self.is_audio = False
            self.is_video = False
        else:
            self.is_subtitle = False

        self.type = self.get_type()
        info = ox.parse_movie_path(self.path)
        self.language = info['language']
        self.part = self.get_part()

        if self.type not in ('audio', 'video'):
            self.duration = None

    def save(self, *args, **kwargs):
        if self.auto:
            self.set_state()
        if self.is_subtitle:
            self.available = self.data and True or False
        else:
            self.available = not self.uploading and \
                             self.streams.filter(source=None, available=True).count() > 0
        super(File, self).save(*args, **kwargs)

    #upload and data handling
    data = models.FileField(null=True, blank=True,
                            upload_to=lambda f, x: f.get_path('data.bin'))

    def get_path(self, name):
        h = self.oshash
        return os.path.join('files', h[:2], h[2:4], h[4:6], h[6:], name)

    def contents(self):
        if self.data != None:
            self.data.seek(0)
            return self.data.read()
        return None

    def srt(self, offset=0):

        def _detectEncoding(fp):
            bomDict={ # bytepattern : name
                      (0x00, 0x00, 0xFE, 0xFF): "utf_32_be",
                      (0xFF, 0xFE, 0x00, 0x00): "utf_32_le",
                      (0xFE, 0xFF, None, None): "utf_16_be",
                      (0xFF, 0xFE, None, None): "utf_16_le",
                      (0xEF, 0xBB, 0xBF, None): "utf_8",
                    }

            # go to beginning of file and get the first 4 bytes
            oldFP = fp.tell()
            fp.seek(0)
            (byte1, byte2, byte3, byte4) = tuple(map(ord, fp.read(4)))

            # try bom detection using 4 bytes, 3 bytes, or 2 bytes
            bomDetection = bomDict.get((byte1, byte2, byte3, byte4))
            if not bomDetection:
                bomDetection = bomDict.get((byte1, byte2, byte3, None))
                if not bomDetection:
                    bomDetection = bomDict.get((byte1, byte2, None, None))
            ## if BOM detected, we're done :-)
            fp.seek(oldFP)
            if bomDetection:
                return bomDetection

            encoding = 'latin-1'
            #more character detecting magick using http://chardet.feedparser.org/
            fp.seek(0)
            rawdata = fp.read()
            encoding = chardet.detect(rawdata)['encoding']
            fp.seek(oldFP)
            return encoding

        def parseTime(t):
            return offset + ox.time2ms(t.replace(',', '.')) / 1000

        srt = []

        f = open(self.data.path)
        encoding = _detectEncoding(f)
        data = f.read()
        f.close()
        try:
            data = unicode(data, encoding)
        except:
            try:
                data = unicode(data, 'latin-1')
            except:
                print "failed to detect encoding, giving up"
                return srt
        data = data.replace('\r\n', '\n')
        srts = re.compile('(\d\d:\d\d:\d\d[,.]\d\d\d)\s*-->\s*(\d\d:\d\d:\d\d[,.]\d\d\d)\s*(.+?)\n\n', re.DOTALL)
        i = 0
        for s in srts.findall(data):
            _s = {'id': str(i),
                  'in': parseTime(s[0]), 'out': parseTime(s[1]), 'value': s[2].strip()}
            if srt and srt[-1]['out'] > _s['in']:
                srt[-1]['out'] = _s['in']
            srt.append(_s)
            i += 1
        return srt

    def editable(self, user):
        return user.get_profile().get_level() == 'admin' or \
               self.instances.filter(volume__user=user).count() > 0

    def save_chunk(self, chunk, chunk_id=-1, done=False):
        if not self.available:
            config = settings.CONFIG['video']
            stream, created = Stream.objects.get_or_create(
                        file=self,
                        resolution=config['resolutions'][0],
                        format=config['formats'][0])
            if created:
                stream.video.save(stream.name(), chunk)
            else:
                f = open(stream.video.path, 'a')
                #FIXME: should check that chunk_id/offset is right
                f.write(chunk.read())
                f.close()
            if done:
                stream.available = True
                stream.save()
            return True
        return False

    def json(self, keys=None, user=None):
        if keys and not 'instances' in keys:
            keys.append('instances')
        resolution = (self.width, self.height)
        if resolution == (0, 0):
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
            'part': self.part,
            'path': self.path,
            'resolution': resolution,
            'samplerate': self.samplerate,
            'selected': self.selected,
            'size': self.size,
            'type': self.type,
            'videoCodec': self.video_codec,
            'wanted': self.wanted,
        }
        data['users'] = [i['user'] for i in data['instances']]
        if keys:
            for k in data.keys():
                if k not in keys:
                    del data[k]
        return data

    def get_part(self):
        if os.path.splitext(self.path)[-1] in ('.sub', '.idx', '.srt'):
            name = os.path.splitext(self.path)[0]
            if self.language:
                name = name[-(len(self.language)+1)]
            qs = self.item.files.filter(Q(is_video=True)|Q(is_audio=True),
                                        selected=True, path__startswith=name)
            if qs.count()>0:
                return qs[0].get_part()
        if self.selected:
            files = list(self.item.files.filter(type=self.type, language=self.language,
                                                selected=self.selected).order_by('sort_path'))
            if self in files:
                return files.index(self) + 1
        return None

    def get_type(self):
        if self.is_video:
            return 'video'
        if self.is_audio:
            return 'audio'
        if self.is_subtitle or os.path.splitext(self.path)[-1] in ('.sub', '.idx'):
            return 'subtitle'
        return 'unknown'

    def get_instance(self):
        #FIXME: what about other instances?
        if self.instances.all().count() > 0:
            return self.instances.all()[0]
        return None

    def create_path(self):
        instance = self.get_instance()
        if instance:
            return instance.path
        if self.item:
            name = self.item.get('title', 'Untitled')
            name = re.sub(r'[:\\/]', '_', name)
        if not name:
            name = 'Untitled'
        ext = '.unknown'
        return name + ext

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
    info = fields.DictField(default={})
    duration = models.FloatField(default=0)
    aspect_ratio = models.FloatField(default=0)

    @property
    def timeline_prefix(self):
        return os.path.join(settings.MEDIA_ROOT, self.path(), 'timeline')

    def name(self):
        return u"%sp.%s" % (self.resolution, self.format)
        
    def __unicode__(self):
        return u"%s/%s" % (self.file, self.name())

    def path(self, name=''):
        return self.file.get_path(name)

    def extract_derivatives(self):
        config = settings.CONFIG['video']
        for resolution in config['resolutions']:
            for f in config['formats']:
                derivative, created = Stream.objects.get_or_create(file=self.file,
                                                  resolution=resolution, format=f)
                if created:
                    derivative.source = self
                    derivative.save()
                    name = derivative.name()
                    derivative.video.name = os.path.join(os.path.dirname(self.video.name), name)
                    derivative.encode()
                    derivative.save()
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

    def save(self, *args, **kwargs):
        if self.video and not self.info:
            self.info = ox.avinfo(self.video.path)
        self.duration = self.info.get('duration', 0)
        if 'video' in self.info and self.info['video']:
            self.aspect_ratio = self.info['video'][0]['width'] / self.info['video'][0]['height']
        else:
            self.aspect_ratio = 128/80
        super(Stream, self).save(*args, **kwargs)
        if self.available and not self.file.available:
            self.file.save()

    def json(self):
        if settings.XSENDFILE or settings.XACCELREDIRECT:
            base_url = '/%s' % self.file.item.itemId
        else:
            base_url = os.path.dirname(self.video.url)
        return {
            'duration': self.duration,
            'aspectRatio': self.aspect_ratio,
            'baseUrl': base_url
        }

def delete_stream(sender, **kwargs):
    f = kwargs['instance']
    if f.video:
        f.video.delete()
pre_delete.connect(delete_stream, sender=Stream)
