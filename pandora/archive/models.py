# -*- coding: utf-8 -*-

import json
import os.path
import shutil
import tempfile
import time

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models.signals import pre_delete
from oxdjango.fields import JSONField

from oxdjango import fields
import ox
import ox.iso

from item import utils
import item.models
from person.models import get_name_sort
from taskqueue.models import Task

from .chunk import save_chunk
from . import extract
from . import managers

User = get_user_model()

def data_path(f, x):
    return f.get_path('data.bin')

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
    item = models.ForeignKey("item.Item", related_name='files', null=True, on_delete=models.CASCADE)

    path = models.CharField(max_length=2048, default="")  # canoncial path/file
    sort_path = models.CharField(max_length=2048, default="")  # sort name

    type = models.CharField(default="", max_length=255)

    # editable
    extension = models.CharField(default="", max_length=255, null=True)
    language = models.CharField(default="", max_length=255, null=True)
    part = models.CharField(default="", max_length=255, null=True)
    part_title = models.CharField(default="", max_length=255, null=True)
    version = models.CharField(default="", max_length=255, null=True)

    size = models.BigIntegerField(default=0)
    duration = models.FloatField(null=True)

    info = JSONField(default=dict, editable=False)

    video_codec = models.CharField(max_length=255)
    pixel_format = models.CharField(max_length=255)
    display_aspect_ratio = models.CharField(max_length=255)
    width = models.IntegerField(default=0)
    height = models.IntegerField(default=0)
    framerate = models.CharField(max_length=255)

    audio_codec = models.CharField(max_length=255)
    channels = models.IntegerField(default=0)
    samplerate = models.IntegerField(default=0)

    bits_per_pixel = models.FloatField(default=-1)
    pixels = models.BigIntegerField(default=0)

    # This is true if derivative is available or subtitles where uploaded
    available = models.BooleanField(default=False)
    selected = models.BooleanField(default=False)
    uploading = models.BooleanField(default=False)
    queued = models.BooleanField(default=False)
    encoding = models.BooleanField(default=False)
    wanted = models.BooleanField(default=False)
    failed = models.BooleanField(default=False)

    is_audio = models.BooleanField(default=False)
    is_video = models.BooleanField(default=False)
    is_subtitle = models.BooleanField(default=False)

    # upload and data handling
    data = models.FileField(null=True, blank=True,
                            upload_to=data_path)

    objects = managers.FileManager()

    def __str__(self):
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
                if 'display_aspect_ratio' in video and video['display_aspect_ratio'].split(':')[-1] != '0':
                    self.display_aspect_ratio = video['display_aspect_ratio']
                elif self.width and self.height:
                    self.display_aspect_ratio = "%s:%s" % (self.width, self.height)
                else:
                    self.display_aspect_ratio = "4:3"
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
                self.framerate = ''
                self.video_codec = ''
                self.width = 0
                self.height = 0
            if 'audio' in self.info and self.info['audio'] and self.duration > 0:
                audio = self.info['audio'][0]
                self.audio_codec = audio.get('codec', '')
                self.samplerate = audio.get('samplerate', 0)
                self.channels = audio.get('channels', 0)

                if not self.is_video:
                    self.is_audio = True
            else:
                self.is_audio = False
                self.audio_codec = ''
                self.sampleate = 0
                self.channels = 0

            if self.framerate and self.duration > 0:
                self.pixels = int(self.width * self.height * float(utils.parse_decimal(self.framerate)) * self.duration)
            else:
                self.pixels = 0

    def get_path_info(self):
        data = {}
        for key in self.PATH_INFO:
            data[key] = self.info.get(key, None)
        if self.item:
            for key in self.ITEM_INFO:
                data[key] = self.item.get(key)
                if isinstance(data[key], str):
                    data[key] = ox.decode_html(data[key])
                elif isinstance(data[key], list):
                    data[key] = [ox.decode_html(e) for e in data[key]]
            if self.item.get('series'):
                data['isEpisode'] = True
            data['directorSort'] = [get_name_sort(n) for n in self.item.get('director', [])]
        data['isEpisode'] = 'isEpisode' in data \
            or data.get('season') is not None \
            or data.get('episode') is not None \
            or data.get('episodes') not in ([], None) \
            or (data.get('seriesTitle') is not None and data.get('episodeTitle') is not None)
        if data['isEpisode'] and data['seriesYear'] is None:
            data['seriesYear'] = data['year']
        data['type'] = 'unknown'
        if 'extension' in data and data['extension']:
            data['extension'] = data['extension'].lower()
            for type in ox.movie.EXTENSIONS:
                if data['extension'] in ox.movie.EXTENSIONS[type]:
                    data['type'] = type
            if data['extension'] == 'ogg' and self.info.get('video'):
                data['type'] = 'video'
        if data['type'] == 'unknown':
            if self.info.get('video'):
                data['type'] = 'video'
            elif self.info.get('audio'):
                data['type'] = 'audio'
        if 'part' in data and isinstance(data['part'], int):
            data['part'] = str(data['part'])
        return data

    def normalize_path(self):
        # FIXME: always use format_path
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
            p = list(filter(lambda f: f['oshash'] == self.oshash, version['files']))
            if p:
                return p[0]['normalizedPath']

    def update_info(self, info, user):
        if not self.info:
            # populate name sort with director if unknown
            if info.get('director') and info.get('directorSort'):
                for name, sortname in zip(info['director'], info['directorSort']):
                    get_name_sort(name, sortname)
            # add all files in one folder to same item
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
                Task.start(self.item, user)
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
            self.part = ox.sort_string(str(data.get('part') or ''))
            self.part_title = ox.sort_string(str(data.get('partTitle')) or '')
            self.type = data.get('type') or 'unknown'
            self.version = data.get('version')

        if self.path:
            self.sort_path = utils.sort_string(self.path)
            self.is_audio = self.type == 'audio'
            self.is_video = self.type == 'video'
            self.is_subtitle = self.path.split('.')[-1] in ('srt', 'vtt')

        if self.type not in ('audio', 'video'):
            self.duration = None
        elif self.id:
            duration = sum([s.info.get('duration', 0)
                            for s in self.streams.filter(source=None)])
            if duration:
                self.duration = duration

        if self.is_subtitle:
            self.available = self.data and True or False
        elif self.id:
            self.available = not self.uploading and \
                self.streams.filter(source=None, available=True).count()
        super(File, self).save(*args, **kwargs)
        if update_path:
            self.path = self.normalize_path()
            super(File, self).save(*args, **kwargs)

    def get_path(self, name):
        h = self.oshash
        return os.path.join('media', h[:2], h[2:4], h[4:6], h[6:], name)

    def contents(self):
        if self.data is not None:
            self.data.seek(0)
            return self.data.read()
        return None

    def srt(self, offset=0):
        srt = []
        subtitles = []
        if self.data.path.endswith('.vtt'):
            load = ox.vtt.load
        else:
            load = ox.srt.load
        for s in load(self.data.path):
            if s['value'].strip() == 'Subtitles downloaded from www.OpenSubtitles.org':
                continue
            if s['in'] <= s['out'] and s['value'].strip():
                key = '%s --> %s\n%s' % (s['in'], s['out'], s['value'])
                if key not in subtitles:
                    subtitles.append(key)
                    srt.append(s)
        # subtitles should not overlap
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
        p = user.profile
        return p.capability('canEditMedia') or \
            (not self.available and p.capability('canAddItems')) or \
            self.instances.filter(volume__user=user).count() > 0 or \
            (not self.item or self.item.user == user)

    def save_chunk(self, chunk, offset=None, done=False):
        if not self.available:
            name = 'data.%s' % self.info.get('extension', 'avi')
            name = self.get_path(name)

            def done_cb():
                if done:
                    info = ox.avinfo(self.data.path)
                    del info['path']
                    self.info.update(info)
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
            stream, created = Stream.objects.get_or_create(file=self, resolution=resolution, format=format)
            name = stream.path(stream.name())

            def done_cb():
                if done:
                    stream.available = True 
                    stream.info = {} 
                    stream.save()
                    if list(self.info) == ['extension']:
                        self.info.update(stream.info)
                        self.parse_info()
                        self.save()
                    #if stream.info.get('video'):
                    #    extract.make_keyframe_index(stream.media.path)
                return True, stream.media.size
            return save_chunk(stream, stream.media, chunk, offset, name, done_cb)
        return False, 0

    def extract_text_data(self):
        if self.data:
            for sub in extract.get_text_subtitles(self.data.path):
                srt = extract.extract_subtitles(self.data.path, sub['language'])
                # fixme add subtitles, possibly with language!
            chapters = extract.get_chapters(self.data.path)
            if chapters:
                # fixme add chapters as notes
                pass

    def get_codec(self, type):
        track = self.info.get(type)
        if track:
            return track[0].get('codec')

    MP4_VCODECS = ['h264']
    MP4_ACODECS = ['aac', None]
    WEBM_VCODECS = ['vp8', 'vp9']
    WEBM_ACODECS = ['vorbis', 'opus', None]

    def can_remux(self):
        config = settings.CONFIG['video']
        height = self.info['video'][0]['height'] if self.info.get('video') else None
        max_resolution = max(config['resolutions'])
        if height and height <= max_resolution and self.extension in ('mov', 'mkv', 'mp4', 'm4v'):
            vcodec = self.get_codec('video')
            acodec = self.get_codec('audio')
            if vcodec in self.MP4_VCODECS and acodec in self.MP4_ACODECS:
                return True
        return False

    def can_stream(self):
        config = settings.CONFIG['video']
        height = self.info['video'][0]['height'] if self.info.get('video') else None
        max_resolution = max(config['resolutions'])
        if height and height <= max_resolution and config['formats'][0] == self.extension:
            vcodec = self.get_codec('video')
            acodec = self.get_codec('audio')
            if self.extension in ['mp4', 'm4v'] and vcodec in self.MP4_VCODECS and acodec in self.MP4_ACODECS:
                return extract.has_faststart(self.data.path)
            elif self.extension == 'webm' and vcodec in self.WEBM_VCODECS and acodec in self.WEBM_ACODECS:
                return True
        return False

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
                                 for s in self.streams.exclude(error='') if s.error]) + \
                    '\n\nSource Info:\n' + json.dumps(self.info, indent=2)
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
            if 'url' in keys and 'url' in self.info:
                data['url'] = self.info['url']
            for k in list(data):
                if k not in keys:
                    del data[k]
        can_see_media = False
        if user and not user.is_anonymous:
            can_see_media = user.profile.capability('canSeeMedia') or \
                user.is_staff or \
                self.item.user == user or \
                self.item.groups.filter(id__in=user.groups.all()).count() > 0
        if 'instances' in data and 'filename' in self.info and self.data:
            data['instances'].append({
                'ignore': False,
                'path': self.info['filename'],
                'user': self.item.user.username if self.item and self.item.user else 'system',
                'volume': 'Direct Upload'
            })
        if not can_see_media:
            if 'instances' in data:
                data['instances'] = []
            if 'path' in data:
                data['path'] = os.path.basename(data['path'])
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
                    os.chmod(fr.frame.path, 0o644)
            self.item.select_frame()

    def extract_stream(self):
        '''
            extract stream from direct upload
        '''
        from . import tasks
        return tasks.extract_stream.delay(self.id)

    def process_stream(self):
        '''
            extract derivatives from webm upload
        '''
        from . import tasks
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
                profile = '%sp.%s' % (resolution, config['formats'][0])
                target = os.path.join(tmp, language + '_' + profile)
                ok, error = extract.stream(media, target, profile, info, audio_track=i+1, flags={})
                if ok:
                    tinfo = ox.avinfo(target)
                    del tinfo['path']
                    f = File(oshash=tinfo['oshash'], item=self.item)
                    f.path = self.path.rsplit('.', 1)[0] + '.' + config['formats'][0]
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

    def encoding_status(self):
        status = {}
        if self.encoding:
            for s in self.streams.all():
                status[s.name()] = 'done' if s.available else 'encoding'
            config = settings.CONFIG['video']
            max_resolution = self.streams.get(source=None).resolution
            for resolution in sorted(config['resolutions'], reverse=True):
                if resolution <= max_resolution:
                    for f in config['formats']:
                        name = '%sp.%s' % (resolution, f)
                        if name not in status:
                            status[name] = 'queued'
        return status

    def delete_frames(self):
        frames = os.path.join(settings.MEDIA_ROOT, self.get_path('frames'))
        if os.path.exists(frames):
            shutil.rmtree(frames)

    def delete_files(self):
        if self.data:
            self.data.delete(save=False)
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

    user = models.ForeignKey(User, related_name='volumes', on_delete=models.CASCADE)
    name = models.CharField(max_length=1024)

    def __str__(self):
        return "%s's %s" % (self.user, self.name)

    def json(self):
        return {
            'name': self.name,
            'path': 'unknown',
            'items': self.files.count()
        }

def inttime():
    return int(time.time())

class Instance(models.Model):

    class Meta:
        unique_together = ("path", "volume")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    atime = models.BigIntegerField(default=inttime, editable=False)
    ctime = models.BigIntegerField(default=inttime, editable=False)
    mtime = models.BigIntegerField(default=inttime, editable=False)

    path = models.CharField(max_length=2048)
    ignore = models.BooleanField(default=False)

    file = models.ForeignKey(File, related_name='instances', on_delete=models.CASCADE)
    volume = models.ForeignKey(Volume, related_name='files', on_delete=models.CASCADE)

    def __str__(self):
        return "%s's %s <%s>" % (self.volume.user, self.path, self.file.oshash)

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
    file = models.ForeignKey(File, related_name="frames", on_delete=models.CASCADE)
    position = models.FloatField()
    frame = models.ImageField(default=None, null=True, upload_to=frame_path)
    width = models.IntegerField(default=0)
    height = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        if self.frame:
            self.width = self.frame.width
            self.height = self.frame.height
        super(Frame, self).save(*args, **kwargs)

    def __str__(self):
        return '%s/%s' % (self.file, self.position)

def delete_frame(sender, **kwargs):
    f = kwargs['instance']
    if f.frame:
        f.frame.delete(save=False)
pre_delete.connect(delete_frame, sender=Frame)

def stream_path(f, x):
    return f.path(x)

class Stream(models.Model):

    class Meta:
        unique_together = ("file", "resolution", "format")
        indexes = [
            models.Index(fields=['file', 'source', 'available'])
        ]

    file = models.ForeignKey(File, related_name='streams', on_delete=models.CASCADE)
    resolution = models.IntegerField(default=96)
    format = models.CharField(max_length=255, default='webm')

    media = models.FileField(default=None, blank=True, upload_to=stream_path)
    source = models.ForeignKey('Stream', related_name='derivatives', default=None, null=True, on_delete=models.CASCADE)
    available = models.BooleanField(default=False)
    oshash = models.CharField(max_length=16, null=True, db_index=True)
    info = JSONField(default=dict, editable=False)
    flags = JSONField(default=dict, editable=False)
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
        return "%sp.%s" % (self.resolution, self.format)

    def __str__(self):
        return "%s/%s" % (self.file, self.name())

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
                                                                       resolution=resolution,
                                                                       format=f)
                    if created:
                        derivative.source = self
                        derivative.save()
                        derivative.encode()
                    elif rebuild or not derivative.available:
                        derivative.encode()

    def encode(self):
        reuse = settings.CONFIG['video'].get('reuseUpload', False)
        media = self.source.media.path if self.source else self.file.data.path
        if not self.media:
            self.media.name = self.path(self.name())
        target = self.media.path
        info = ox.avinfo(media)

        done = False
        if reuse and not self.source:
            if self.file.can_stream():
                ok, error = True, None
                ox.makedirs(os.path.dirname(target))
                shutil.move(self.file.data.path, target)
                self.file.data.name = ''
                self.file.save()
                self.available = True
                self.save()
                done = True
            elif self.file.can_remux():
                ok, error = extract.remux_stream(media, target)
                if ok:
                    self.available = True
                    self.save()
                    done = True
        if not done:
            ok, error = extract.stream(media, target, self.name(), info, flags=self.flags)

        # file could have been moved while encoding
        # get current version from db and update
        try:
            self.refresh_from_db()
        except Stream.DoesNotExist:
            pass
        else:
            self.update_status(ok, error)

    def get_index(self):
        index = 1
        for s in self.file.item.streams():
            if self.source and self.source == s:
                return index
            if s == self:
                return index
            index += 1
        return None

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
                dar = list(map(int, self.info['video'][0]['display_aspect_ratio'].split(':')))
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
        f.media.delete(save=False)
pre_delete.connect(delete_stream, sender=Stream)
