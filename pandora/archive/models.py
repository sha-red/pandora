# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

import os.path
import re
import time

from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User
from django.conf import settings
from django.db.models.signals import pre_delete

from ox.django import fields
import ox
from ox.normalize import canonicalTitle
import chardet

from item import utils
from item.models import Item
from person.models import get_name_sort

import extract



class File(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    verified = models.BooleanField(default=False)
    auto = models.BooleanField(default=True)

    oshash = models.CharField(max_length=16, unique=True)
    item = models.ForeignKey(Item, related_name='files')

    name = models.CharField(max_length=2048, default="") # canoncial path/file
    folder = models.CharField(max_length=2048, default="") # canoncial path/file
    sort_name = models.CharField(max_length=2048, default="") # sort name

    type = models.CharField(default="", max_length=255)
    part = models.IntegerField(null=True)
    version = models.CharField(default="", max_length=255) # sort path/file name
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

    is_audio = models.BooleanField(default=False)
    is_video = models.BooleanField(default=False)
    is_extra = models.BooleanField(default=False)
    is_main = models.BooleanField(default=False)
    is_subtitle = models.BooleanField(default=False)
    is_version = models.BooleanField(default=False)

    def __unicode__(self):
        return self.name

    def set_state(self):
        instance = self.get_instance()
        if instance:
            if instance.name.lower().startswith('extras/'):
                self.is_extra = True
                self.is_main = False
            elif instance.name.lower().startswith('versions/'):
                self.is_version = True
                self.is_main = False
            else:
                self.is_extra = False
                self.is_main = True
        else:
            self.is_main = False
            self.is_extra = False
            self.is_version = False
        
        self.name = self.get_name()
        self.folder = self.get_folder()
        self.sort_name = utils.sort_string(canonicalTitle(self.name))

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
                if self.name.endswith('.jpg') or \
                   self.name.endswith('.png') or \
                   self.duration == 0.04:
                    self.is_video = False
            else:
                self.is_video = False
                self.display_aspect_ratio = "4:3"
                self.width = '320'
                self.height = '240'
            if 'audio' in self.info and self.info['audio']:
                audio = self.info['audio'][0]
                self.audio_codec = audio['codec']
                self.samplerate = audio.get('samplerate', 0)
                self.channels = audio.get('channels', 0)

                if not self.is_video:
                    self.is_audio = True
            else:
                self.is_audio = False

            if self.framerate:
                self.pixels = int(self.width * self.height * float(utils.parse_decimal(self.framerate)) * self.duration)

        else:
            self.is_video = os.path.splitext(self.name)[-1] in ('.avi', '.mkv', '.dv', '.ogv', '.mpeg', '.mov')
            self.is_audio = os.path.splitext(self.name)[-1] in ('.mp3', '.wav', '.ogg', '.flac')
            self.is_subtitle = os.path.splitext(self.name)[-1] in ('.srt', )

        if not self.is_audio and not self.is_video and self.name.endswith('.srt'):
            self.is_subtitle = True
        else:
            self.is_subtitle = False

        self.type = self.get_type()
        self.language = self.get_language()
        self.part = self.get_part()

        if self.type not in ('audio', 'video'):
            self.duration = None

    def save(self, *args, **kwargs):
        if self.auto:
            self.set_state()
        super(File, self).save(*args, **kwargs)

    #upload and data handling
    data = models.FileField(null=True, blank=True,
                            upload_to=lambda f, x: f.path('data.bin'))

    def path(self, name):
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
        data = data.replace('\r\n', '\n')
        try:
            data = unicode(data, encoding)
        except:
            try:
                data = unicode(data, 'latin-1')
            except:
                print "failed to detect encoding, giving up"
                return srt

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
        #FIXME: check that user has instance of this file
        return True

    def save_chunk(self, chunk, chunk_id=-1, done=False):
        if not self.available:
            stream, created = Stream.objects.get_or_create(
                        file=self,
                        resolution=settings.VIDEO_RESOLUTIONS[0],
                        format=settings.VIDEO_FORMATS[0])
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
        if self.get_type() != 'video':
            duration = None
        data = {
            'available': self.available,
            'duration': duration,
            'framerate': self.framerate,
            'height': self.height,
            'width': self.width,
            'resolution': resolution,
            'id': self.oshash,
            'samplerate': self.samplerate,
            'video_codec': self.video_codec,
            'audio_codec': self.audio_codec,
            'name': self.name,
            'size': self.size,
            'info': self.info,
            'users': list(set([i.volume.user.username for i in self.instances.all()])),
            'instances': [i.json() for i in self.instances.all()],
            'folder': self.get_folder(),
            'type': self.get_type(),
            'is_main': self.is_main,
            'part': self.get_part()
        }
        if keys:
            for k in data.keys():
                if k not in keys:
                    del data[k]
        return data

    def get_part(self):
        #FIXME: this breaks for sub/idx/srt
        if os.path.splitext(self.name)[-1] in ('.sub', '.idx', '.srt'):
            name = os.path.splitext(self.name)[0]
            if self.language:
                name = name[-(len(self.language)+1)]
            qs = self.item.files.filter(Q(is_video=True)|Q(is_audio=True),
                                        is_main=True, name__startswith=name)
            if qs.count()>0:
                return qs[0].part
        if not self.is_extra:
            files = list(self.item.files.filter(type=self.type, language=self.language,
                                                is_main=self.is_main).order_by('sort_name'))
            if self in files:
                return files.index(self) + 1
        return None

    def get_type(self):
        if self.is_video:
            return 'video'
        if self.is_audio:
            return 'audio'
        if self.is_subtitle or os.path.splitext(self.name)[-1] in ('.sub', '.idx'):
            return 'subtitle'
        return 'unknown'

    def get_instance(self):
        #FIXME: what about other instances?
        if self.instances.all().count() > 0:
            return self.instances.all()[0]
        return None

    def get_folder(self):
        instance = self.get_instance()
        if instance:
            return instance.folder
        name = os.path.splitext(self.get_name())[0]
        name = name.replace('. ', '||').split('.')[0].replace('||', '. ')
        if self.item:
            if settings.USE_IMDB:
                director = self.item.get('director', ['Unknown Director'])
                director = map(get_name_sort, director)
                director = u'; '.join(director)
                director = re.sub(r'[:\\/]', '_', director)
                name = os.path.join(director, name)
            year = self.item.get('year')
            if year:
                name += u' (%s)' % year
            name = os.path.join(name[0].upper(), name)
            return name
        return u''

    def get_name(self):
        instance = self.get_instance()
        if instance:
            return instance.name
        if self.item:
            name = self.item.get('title', 'Untitled')
            name = re.sub(r'[:\\/]', '_', name)
        if not name:
            name = 'Untitled'
        ext = '.unknown'
        return name + ext

    def get_language(self):
        language = self.name.split('.')
        if len(language) >= 3 and len(language[-2]) == 2:
            return language[-2]
        return ''

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

class Instance(models.Model):

    class Meta:
        unique_together = ("name", "folder", "volume")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    atime = models.IntegerField(default=lambda: int(time.time()), editable=False)
    ctime = models.IntegerField(default=lambda: int(time.time()), editable=False)
    mtime = models.IntegerField(default=lambda: int(time.time()), editable=False)

    name = models.CharField(max_length=2048)
    folder = models.CharField(max_length=2048)

    file = models.ForeignKey(File, related_name='instances')
    volume = models.ForeignKey(Volume, related_name='files')

    def __unicode__(self):
        return u"%s's %s <%s>"% (self.volume.user, self.name, self.file.oshash)

    @property
    def itemId(self):
        return File.objects.get(oshash=self.oshash).itemId

    def json(self):
        return {
            'user': self.volume.user.username,
            'volume': self.volume.name,
            'folder': self.folder,
            'name': self.name
        }

def frame_path(frame, name):
    ext = os.path.splitext(name)[-1]
    name = "%s%s" % (frame.position, ext)
    return frame.file.path(name)


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
        return self.file.path(name)

    def extract_derivatives(self):
        self.make_timeline()
        for resolution in settings.VIDEO_RESOLUTIONS:
            for f in settings.VIDEO_FORMATS:
                derivative, created = Stream.objects.get_or_create(file=self.file,
                                                  resolution=resolution, format=f)
            if created:
                derivative.source = self
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

    def json(self):
        if settings.XSENDFILE or settings.XACCELREDIRECT:
            base_url = '/%s' % self.itemId
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
