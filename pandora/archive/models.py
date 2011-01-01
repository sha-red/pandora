# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

import os.path
import re
import time

from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

from ox.django import fields
import ox
from ox.normalize import canonicalTitle
import chardet

from item import utils
from item.models import Item


class File(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    verified = models.BooleanField(default=False)

    oshash = models.CharField(max_length=16, unique=True)
    item = models.ForeignKey(Item, related_name='files')

    name = models.CharField(max_length=2048, default="") # canoncial path/file
    sort_name = models.CharField(max_length=2048, default="") # sort name

    part = models.CharField(default="", max_length=255)
    version = models.CharField(default="", max_length=255) # sort path/file name
    language = models.CharField(default="", max_length=8)

    season = models.IntegerField(default=-1)
    episode = models.IntegerField(default=-1)

    size = models.BigIntegerField(default=0)
    duration = models.BigIntegerField(default=0)

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

    def save(self, *args, **kwargs):
        if self.name and not self.sort_name:
            self.sort_name = canonicalTitle(self.name)
        if self.info:
            for key in ('duration', 'size'):
                setattr(self, key, self.info.get(key, 0))

            if 'video' in self.info and self.info['video']:
                self.video_codec = self.info['video'][0]['codec']
                self.width = self.info['video'][0]['width']
                self.height = self.info['video'][0]['height']
                self.framerate = self.info['video'][0]['framerate']
                if 'display_aspect_ratio' in self.info['video'][0]:
                    self.display_aspect_ratio = self.info['video'][0]['display_aspect_ratio']
                else:
                    self.display_aspect_ratio = "%s:%s" % (self.width, self.height)
                self.is_video = True
                self.is_audio = False
                if self.name.endswith('.jpg') or self.name.endswith('.png') or self.duration == 0.04:
                    self.is_video = False
            else:
                self.is_video = False
            if 'audio' in self.info and self.info['audio']:
                self.audio_codec = self.info['audio'][0]['codec']
                self.samplerate = self.info['audio'][0].get('samplerate', 0)
                self.channels = self.info['audio'][0].get('channels', 0)

                if not self.is_video:
                    self.is_audio = True
            else:
                self.is_audio = False

            if self.framerate:
                self.pixels = int(self.width * self.height * float(utils.parse_decimal(self.framerate)) * self.duration)

        if not self.is_audio and not self.is_video and self.name.endswith('.srt'):
            self.is_subtitle = True

        if self.name and self.name.startswith('Extras/'):
            self.is_extra = True
            self.is_main = False
        else:
            self.is_extra = False
            self.is_main = True

        super(File, self).save(*args, **kwargs)

    def json(self):
        r = {}
        for k in self:
            r[k] = unicode(self[k])
        return r

    #upload and data handling
    video = models.FileField(null=True, blank=True, upload_to=lambda f, x: f.path('%s.webm'%settings.VIDEO_PROFILE))
    data = models.FileField(null=True, blank=True, upload_to=lambda f, x: f.path('data.bin'))

    def path(self, name):
        h = self.oshash
        return os.path.join('files', h[:2], h[2:4], h[4:6], h[6:], name)

    def contents(self):
        if self.data != None:
            self.data.seek(0)
            return self.data.read()
        return None

    def srt(self):

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
            return ox.time2ms(t.replace(',', '.')) / 1000

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
        for s in srts.findall(data):
            _s = {'in': parseTime(s[0]), 'out': parseTime(s[1]), 'text': s[2].strip()}
            srt.append(_s)
        return srt

    def editable(self, user):
        #FIXME: check that user has instance of this file
        return True

    def save_chunk(self, chunk, chunk_id=-1):
        if not self.available:
            if not self.video:
                self.video.save('%s.webm'%settings.VIDEO_PROFILE, chunk)
            else:
                f = open(self.video.path, 'a')
                #FIXME: should check that chunk_id/offset is right
                f.write(chunk.read())
                f.close()
            return True
        return False


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
    folder = models.CharField(max_length=255)

    file = models.ForeignKey(File, related_name='instances')
    volume = models.ForeignKey(Volume, related_name='files')

    def __unicode__(self):
        return u"%s's %s <%s>"% (self.volume.user, self.name, self.file.oshash)

    @property
    def itemId(self):
        return File.objects.get(oshash=self.oshash).itemId


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
        return u'%s at %s' % (self.file, self.position)
