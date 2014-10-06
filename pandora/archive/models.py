# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import os.path
import shutil
import tempfile
import time

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import pre_delete

from ox.django import fields
import ox
import ox.iso

from item import utils
import item.models
from person.models import get_name_sort

from chunk import save_chunk
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
    language = models.CharField(default="", max_length=255, null=True)
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
    queued = models.BooleanField(default = False)
    encoding = models.BooleanField(default = False)
    wanted = models.BooleanField(default = False)
    failed = models.BooleanField(default = False)

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
                if isinstance(data[key], basestring):
                    data[key] = ox.decode_html(data[key])
                elif isinstance(data[key], list):
                    data[key] = [ox.decode_html(e) for e in data[key]]
            if self.item.get('series'):
                data['isEpisode'] = True
            data['directorSort'] = [get_name_sort(n) for n in self.item.get('director', [])]
        data['isEpisode'] = 'isEpisode' in data \
                or data.get('season') != None \
                or data.get('episode') != None \
                or data.get('episodes') not in ([], None) \
                or (data.get('seriesTitle') != None and data.get('episodeTitle') != None)
        if data['isEpisode'] and data['seriesYear'] == None:
            data['seriesYear'] = data['year']
        data['type'] = 'unknown'
        if 'extension' in data and data['extension']:
            data['extension'] = data['extension'].lower()
            for type in ox.movie.EXTENSIONS:
                if data['extension'] in ox.movie.EXTENSIONS[type]:
                    data['type'] = type
        if 'part' in data and isinstance(data['part'], int):
            data['part'] = str(data['part'])
        return data

    def normalize_path(self):
        #FIXME: always use format_path
        if settings.CONFIG['site']['folderdepth'] == 4:
            return self.normalize_item_path()
        else:
            path = self.path or ''
            if self.instances.all().count():
                path = self.instances.all()[0].path
            return path

    def normalize_item_path(self):
        if not self.instances.all().count():
            return ox.movie.format_path(self.get_path_info())

        files = []
        volume = self.instances.all()[0].volume
        def add_file(f):
            instance = f.instances.all()[0]
            files.append(f.get_path_info())
            files[-1].update({
                'path': instance.path,
                'normalizedPath': ox.movie.format_path(files[-1]),
                'time': instance.mtime,
                'oshash': f.oshash,
                'size': f.size
            })
        add_file(self)
        for f in self.item.files.filter(instances__volume=volume).exclude(id=self.id):
            add_file(f)
        versions = ox.movie.parse_item_files(files)
        for version in versions:
            p = filter(lambda f: f['oshash'] == self.oshash, version['files'])
            if p:
                return p[0]['normalizedPath']

    def update_info(self, info, user):
        #populate name sort with director if unknown
        if info.get('director') and info.get('directorSort'):
            for name, sortname in zip(info['director'], info['directorSort']):
                get_name_sort(name, sortname)
        #add all files in one folder to same item
        if self.instances.all().count():
            if info.get('isEpisode'):
                prefix = os.path.splitext(self.instances.all()[0].path)[0]
            else:
                prefix = os.path.dirname(self.instances.all()[0].path) + '/'
            qs = item.models.Item.objects.filter(files__instances__path__startswith=prefix)
            if qs.exists():
                self.item = qs[0]
        if not self.item:
            self.item = item.models.get_item(info, user)
        for key in self.AV_INFO + self.PATH_INFO:
            if key in info:
                self.info[key] = info[key]
        self.parse_info()

    def save(self, *args, **kwargs):
        update_path = False
        if self.info:
            if self.id:
                self.path = self.normalize_path()
            else:
                update_path = True
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
        else:
            duration = sum([s.info.get('duration', 0)
                for s in self.streams.filter(source=None)])
            if duration:
                self.duration = duration

        if self.is_subtitle:
            self.available = self.data and True or False
        else:
            self.available = not self.uploading and \
                self.streams.filter(source=None, available=True).count() > 0
        super(File, self).save(*args, **kwargs)
        if update_path:
            self.path = self.normalize_path()
            super(File, self).save(*args, **kwargs)

    def get_path(self, name):
        h = self.oshash
        return os.path.join('media', h[:2], h[2:4], h[4:6], h[6:], name)

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
            (not self.available and p.capability('canAddItems')) or \
            self.instances.filter(volume__user=user).count() > 0 or \
            (not self.item or self.item.user == user)

    def save_chunk(self, chunk, offset=None, done=False):
        if not self.available:
            name = 'data.%s' % self.info.get('extension', 'avi')
            name = self.get_path(name)

            def done_cb():
                if done:
                    self.info.update(ox.avinfo(self.data.path))
                    self.parse_info()
                    # reject invalid uploads
                    if self.info.get('oshash') != self.oshash:
                        self.data.delete()
                        self.save()
                        return False, 0
                    self.save()
                return True, self.data.size
            return save_chunk(self, self.data, chunk, offset, name, done_cb)
        else:
            return False, 0

    def save_chunk_stream(self, chunk, offset, resolution, format, done):
        if not self.available:
            stream, created = Stream.objects.get_or_create(
                        file=self, resolution=resolution, format=format)
            name = stream.path(stream.name())

            def done_cb():
                if done:
                    stream.available = True 
                    stream.info = {} 
                    stream.save()
                return True, stream.media.size
            return save_chunk(stream, stream.media, chunk, offset, name, done_cb)
        return False, 0

    def stream_resolution(self):
        config = settings.CONFIG['video']
        height = self.info['video'][0]['height'] if self.info.get('video') else None
        for resolution in sorted(config['resolutions']):
            if height and height <= resolution:
                return resolution
        return resolution

    def json(self, keys=None, user=None):
        resolution = (self.width, self.height)
        if resolution == (0, 0) or self.type != 'video':
            resolution = None
        duration = self.duration
        if self.type not in ('audio', 'video'):
            duration = None
        state = ''
        error = ''
        if self.failed:
            state = 'failed'
            error = '\n\n'.join(['Failed to encode %s:\n%s' % (s.name(), s.error)
                for s in self.streams.exclude(error='') if s.error])
        elif self.encoding:
            state = 'encoding'
        elif self.queued:
            state = 'queued'
        elif self.uploading:
            state = 'uploading'
        elif self.available:
            state = 'available'
        elif self.wanted:
            state = 'wanted'
        data = {
            'audioCodec': self.audio_codec,
            'available': self.available,
            'duration': duration,
            'state': state,
            'framerate': self.framerate,
            'id': self.oshash,
            'instances': [i.json() for i in self.instances.all()],
            'path': self.path,
            'resolution': resolution,
            'samplerate': self.samplerate,
            'channels': self.channels,
            'selected': self.selected,
            'size': self.size,
            'type': self.type,
            'videoCodec': self.video_codec,
            'wanted': self.wanted,
        }
        if error:
            data['error'] = error
        for key in self.PATH_INFO:
            data[key] = self.info.get(key)
        data['users'] = list(set([i['user'] for i in data['instances']]))
        data['item'] = self.item.public_id
        if keys:
            for k in data.keys():
                if k not in keys:
                    del data[k]
        return data

    def all_paths(self):
        return [self.path] + [i.path for i in self.instances.all()]

    def extract_frames(self):
        def video_frame_positions(duration):
            pos = duration / 2
            return map(int, [pos/2, pos, pos+pos/2])
        if settings.CONFIG['media'].get('importFrames') and self.data:
            filename = self.data.path
            info = self.info

            for pos in video_frame_positions(info['duration']):
                position = float(pos)
                name = "%s.png" % position
                fr, created = Frame.objects.get_or_create(file=self, position=position)
                if fr.frame:
                    fr.frame.delete()
                fr.frame.name = self.get_path(name)
                if not os.path.exists(fr.frame.path):
                    extract.frame_direct(filename, fr.frame.path, pos)
                if os.path.exists(fr.frame.path):
                    fr.save()
                    os.chmod(fr.frame.path, 0644)
            self.item.select_frame()

    def extract_stream(self):
        '''
            extract stream from direct upload
        '''
        import tasks
        return tasks.extract_stream.delay(self.id)

    def process_stream(self):
        '''
            extract derivatives from webm upload
        '''
        import tasks
        return tasks.process_stream.delay(self.id)

    def extract_tracks(self):
        '''
            extract audio tracks from direct upload
        '''
        def parse_language(lang):
            if lang:
                short = ox.iso.langCode3To2(lang.encode('utf-8'))
                if not short and ox.iso.codeToLang(lang[:2]):
                    lang = lang[:2]
                else:
                    lang = short
            if not lang:
                lang = settings.CONFIG['language']
            return lang
        audio = self.info.get('audio', [])
        if self.data and len(audio) > 1:
            config = settings.CONFIG['video']
            resolution = self.stream_resolution()
            ffmpeg = ox.file.cmd('ffmpeg')
            if ffmpeg == 'ffmpeg':
                ffmpeg = None
            tmp = tempfile.mkdtemp()
            if not self.info.get('language'):
                self.info['language'] = parse_language(audio[0].get('language'))
                self.save()
            languages = [self.info['language']]
            for i, a in enumerate(audio[1:]):
                media = self.data.path
                info = ox.avinfo(media)
                lang = language = parse_language(a.get('language'))
                n = 2
                while language in languages:
                    language = '%s%d' % (lang, n)
                    n += 1
                profile = '%s.%s' % (resolution, config['formats'][0])
                target = os.path.join(tmp, language + '_' + profile)
                ok, error = extract.stream(media, target, profile, info, ffmpeg,
                        audio_track=i+1)
                if ok:
                    tinfo = ox.avinfo(target)
                    del tinfo['path']
                    f = File(oshash=tinfo['oshash'], item=self.item)
                    f.path = self.path
                    f.info = tinfo
                    f.info['language'] = language
                    f.info['extension'] = config['formats'][0]
                    f.parse_info()
                    f.selected = True
                    f.save()
                    stream, created = Stream.objects.get_or_create(
                        file=f, resolution=resolution, format=config['formats'][0]
                    )
                    if created:
                        stream.media.name = stream.path(stream.name())
                        ox.makedirs(os.path.dirname(stream.media.path))
                        shutil.move(target, stream.media.path)
                        stream.available = True
                        stream.save()
                        stream.make_timeline()
                        stream.extract_derivatives()
                if os.path.exists(target):
                    os.unlink(target)
            shutil.rmtree(tmp)

    def delete(self, *args, **kwargs):
        self.delete_files()
        super(File, self).delete(*args, **kwargs)

    def delete_frames(self):
        frames = os.path.join(settings.MEDIA_ROOT, self.get_path('frames'))
        if os.path.exists(frames):
            shutil.rmtree(frames)

    def delete_files(self):
        if self.data:
            self.data.delete()
        self.streams.all().delete()
        prefix = os.path.join(settings.MEDIA_ROOT, self.get_path(''))
        if os.path.exists(prefix):
            shutil.rmtree(prefix)

def delete_file(sender, **kwargs):
    f = kwargs['instance']
    f.delete_files()
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
    def public_id(self):
        return File.objects.get(oshash=self.oshash).public_id

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
    width = models.IntegerField(default = 0)
    height = models.IntegerField(default = 0)

    def save(self, *args, **kwargs):
        if self.frame:
            self.width = self.frame.width
            self.height = self.frame.height
        super(Frame, self).save(*args, **kwargs)

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

    media = models.FileField(default=None, blank=True, upload_to=lambda f, x: f.path(x))
    source = models.ForeignKey('Stream', related_name='derivatives', default=None, null=True)
    available = models.BooleanField(default=False)
    oshash = models.CharField(max_length=16, null=True, db_index=True)
    info = fields.DictField(default={})
    duration = models.FloatField(default=0)
    aspect_ratio = models.FloatField(default=0)

    cuts = fields.TupleField(default=[])
    color = fields.TupleField(default=[])
    volume = models.FloatField(default=0)

    error = models.TextField(blank=True, default='')

    @property
    def timeline_prefix(self):
        return os.path.join(settings.MEDIA_ROOT, self.path())
        return os.path.join(settings.MEDIA_ROOT, self.path(), 'timeline')

    def name(self):
        return u"%sp.%s" % (self.resolution, self.format)
        
    def __unicode__(self):
        return u"%s/%s" % (self.file, self.name())

    def get(self, resolution, format):
        streams = []
        if self.format == format:
            streams.append(self)
        for stream in self.derivatives.filter(format=format).order_by('-resolution'):
            streams.append(stream)
        stream = streams.pop(0)
        while streams and streams[0].resolution >= resolution:
            stream = streams.pop(0)
        return stream

    def path(self, name=''):
        if self.source:
            return os.path.join(os.path.dirname(self.source.media.name), name)
        else:
            return self.file.get_path(name)

    def extract_derivatives(self, rebuild=False):
        config = settings.CONFIG['video']
        for resolution in sorted(config['resolutions'], reverse=True):
            if resolution <= self.resolution:
                for f in config['formats']:
                    derivative, created = Stream.objects.get_or_create(file=self.file,
                                                      resolution=resolution, format=f)
                    if created:
                        derivative.source = self
                        derivative.save()
                        derivative.encode()
                    elif rebuild or not derivative.available:
                        derivative.encode()

    def encode(self):
        media = self.source.media.path if self.source else self.file.data.path
        ffmpeg = ox.file.cmd('ffmpeg')
        if self.source or ffmpeg == 'ffmpeg' or self.format != 'webm':
            ffmpeg = None

        if not self.media:
            self.media.name = self.path(self.name())
        target = self.media.path
        info = ox.avinfo(media)
        ok, error = extract.stream(media, target, self.name(), info, ffmpeg)
        # file could have been moved while encoding
        # get current version from db and update
        _self = Stream.objects.get(id=self.id)
        _self.update_status(ok, error)
        return _self

    def update_status(self, ok, error):
        if ok:
            if not self.media:
                self.media.name = self.path(self.name())
            self.available = True
            self.error = ''
            if self.file.failed:
                self.file.failed = False
                self.file.save()
        else:
            self.media = None
            self.available = False
            self.error = error
            self.file.failed = True
            self.file.save()
        self.save()

    def make_timeline(self):
        if self.available and not self.source:
            extract.timeline(self.media.path, self.timeline_prefix)
            self.cuts = tuple(extract.cuts(self.timeline_prefix))
            self.color = tuple(extract.average_color(self.timeline_prefix))
            self.volume = extract.average_volume(self.timeline_prefix)
            self.save()

    def save(self, *args, **kwargs):
        if self.media and not self.info:
            self.info = ox.avinfo(self.media.path)
            if 'path' in self.info:
                del self.info['path']
        self.oshash = self.info.get('oshash')
        self.duration = self.info.get('duration', 0)
        if 'video' in self.info and self.info['video']:
            if 'display_aspect_ratio' in self.info['video'][0]:
                dar = map(int, self.info['video'][0]['display_aspect_ratio'].split(':'))
                self.aspect_ratio = dar[0] / dar[1]
            else:
                self.aspect_ratio = self.info['video'][0]['width'] / self.info['video'][0]['height']
        else:
            self.aspect_ratio = settings.CONFIG['video']['previewRatio']
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
    if f.media:
        f.media.delete()
pre_delete.connect(delete_stream, sender=Stream)
