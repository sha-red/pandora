# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from datetime import datetime
import os.path
import subprocess
from glob import glob
import unicodedata

from django.db import models
from django.core.files.base import ContentFile
from django.utils import simplejson as json
from django.conf import settings
from django.contrib.auth.models import User, Group

import ox
from ox.django import fields
from ox.normalize import canonicalTitle
import ox.web.imdb

import managers
import utils
import tasks
from archive import extract

from annotaion.models import Annotation, Layer
from person.models import get_name_sort
from app.models import site_config


def get_item(info):
    '''
        info dict with:
            imdbId, title, director, episode_title, season, series
    '''
    if settings.USE_IMDB:
        if 'imdbId' in info and info['imdbId']:
            try:
                item = Item.objects.get(itemId=info['imdbId'])
            except Item.DoesNotExist:
                item = Item(itemId=info['imdbId'])
                if 'title' in info and 'director' in info:
                    item.external_data = {
                        'title': info['title'],
                        'director': info['director'],
                        'year': info.get('year', '')
                    }
                #FIXME: this should be done async
                item.save()
                tasks.update_external.delay(item.itemId)
                #item.update_external()
        else:
            q = Item.objects.filter(find__key='title', find__value=info['title'])
            if q.count() > 1:
                print "FIXME: check more than title here!!?"
                item = q[0]
            else:
                try:
                    item = Item.objects.get(itemId=info['oxdbId'])
                except Item.DoesNotExist:
                    item = Item()
                    item.data = {
                        'title': info['title'],
                        'director': info['director'],
                        'year': info.get('year', '')
                    }
                    item.itemId = info['oxdbId']

                    for key in ('episode_title', 'series_title', 'season', 'episode'):
                        if key in info and info[key]:
                            item.data[key] = info[key]
                    try:
                        existing_item = Item.objects.get(oxdbId=item.oxdb_id())
                        item = existing_item
                    except Item.DoesNotExist:
                        item.save()
    else:
        try:
            item = Item.objects.get(itemId=info['itemId'])
        except Item.DoesNotExist:
            item = Item(itemId=info['itemId'])
            item.save()

    return item


class Item(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    published = models.DateTimeField(default=datetime.now, editable=False)

    user = models.ForeignKey(User, related_name='items')
    groups = models.ManyToManyField(Group, related_name='items')

    #only items that have data from files are available,
    #this is indicated by setting available to True
    available = models.BooleanField(default=False, db_index=True)
    public = models.BooleanField(default=False, db_index=True)

    itemId = models.CharField(max_length=128, unique=True, blank=True)
    oxdbId = models.CharField(max_length=42, unique=True, blank=True)
    external_data = fields.DictField(default={}, editable=False)
    data = fields.DictField(default={}, editable=False)
    json = fields.DictField(default={}, editable=False)
    poster = models.ImageField(default=None, blank=True, upload_to=lambda i, x: i.path("poster.jpg"))
    poster_url = models.TextField(blank=True)
    poster_height = models.IntegerField(default=0)
    poster_width = models.IntegerField(default=0)
    poster_frame = models.FloatField(default=-1)

    icon = models.ImageField(default=None, blank=True, upload_to=lambda i, x: i.path("icon.jpg"))

    #stream related fields
    stream_aspect = models.FloatField(default=4/3)

    objects = managers.ItemManager()

    def get(self, key, default=None):
        if self.data and key in self.data:
            return self.data[key]
        if self.external_data and key in self.external_data:
            return self.external_data[key]
        return default

    def editable(self, user):
        if user.is_staff or \
           self.user == user or \
           self.groups.filter(id__in=user.groups.all()).count() > 0:
            return True
        return False

    def edit(self, data):
        #FIXME: how to map the keys to the right place to write them to?
        if 'id' in data:
            #FIXME: check if id is valid and exists and move/merge items accordingly
            del data['id']
        if 'id' in data:
            groups = data.pop('groups')
            self.groups.exclude(name__in=groups).delete()
            for g in groups:
                group, created = Group.objects.get_or_create(name=g) 
                self.groups.add(group)
        for key in data:
            if key != 'id':
                setattr(self.data, key, data[key])
        self.data.save()
        self.save()

    def reviews(self):
        reviews = self.get('reviews', [])
        _reviews = {}
        for r in reviews:
            for url in settings.REVIEW_WHITELIST:
                if url in r[0]:
                    _reviews[settings.REVIEW_WHITELIST[url]] = r[0]
        return _reviews

    def update_external(self):
        if len(self.itemId) == 7:
            data = ox.web.imdb.Imdb(self.itemId)
            #FIXME: all this should be in ox.web.imdb.Imdb
            for key in ('directors', 'writers', 'editors', 'producers',
                        'cinematographers', 'languages', 'genres', 'keywords',
                        'episode_directors'):
                if key in data:
                    data[key[:-1]] = data.pop(key)
            if 'countries' in data:
                data['country'] = data.pop('countries')
            if 'release date' in data:
                data['releasedate'] = data.pop('release date')
                if isinstance(data['releasedate'], list):
                    data['releasedate'] = min(data['releasedate'])
            if 'plot' in data:
                data['summary'] = data.pop('plot')
            if 'cast' in data:
                if isinstance(data['cast'][0], basestring):
                    data['actor'] = [data['cast'][0]]
                else:
                    data['actor'] = [c[0] for c in data['cast']]
            self.external_data = data
            self.save()

    def __unicode__(self):
        year = self.get('year')
        if year:
            return u'%s (%s)' % (self.get('title'), self.get('year'))
        return self.get('title')

    def get_absolute_url(self):
        return '/%s' % self.itemId

    def save(self, *args, **kwargs):
        self.oxdbId = self.oxdb_id()

        if self.poster:
            self.poster_height = self.poster.height
            self.poster_width = self.poster.width
        else:
            self.poster_height = 128
            self.poster_width = 80
        self.update_find()
        self.update_sort()
        self.update_facets()
        self.json = self.get_json()
        super(Item, self).save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        self.delete_poster()
        for f in glob("%s*"%self.timeline_prefix):
            os.unlink(f)
        for f in glob("%sstrip*"%self.timeline_prefix[:-8]):
            os.unlink(f)
        super(Item, self).delete(*args, **kwargs)

    def merge_with(self, other):
        '''
            move all related tables to other and delete self
        '''
        for stream in self.streams.all():
            stream.item = other
            stream.save()
        for l in self.lists.all():
            l.items.remove(self)
            if l.items.filter(id=other.id) == 0:
                l.items.add(other)
        #FIXME: should this really happen for annotations?
        for a in self.annotations.all():
            a.item = other

        if hasattr(self, 'files'):
            for f in self.files.all():
                f.item = other
                f.save()
        self.delete()
        other.save()

    '''
        JSON cache related functions
    '''
    #FIXME: this should not be used
    _public_fields = {
        'itemId': 'id',
        'title': 'title',
        'year': 'year',

        'runtime': 'runtime',
        'releasedate': 'releasedate',

        'country': 'country',
        'director': 'director',
        'writer': 'writer',
        'editor': 'editor',
        'producer': 'producer',
        'cinematographer': 'cinematographer',
        'language': 'language',
        'genre': 'genre',
        'keyword': 'keyword',
        'cast': 'cast',
        'series_title': 'series_title',
        'episode_title': 'episode_title',
        'season': 'season',
        'episode': 'episode',
        'reviews': 'reviews',
        'trivia': 'trivia',
        'rating': 'rating',
        'votes': 'votes',
        'alternative_titles': 'alternative_titles',
        'connections_json': 'connections',
    }

    def get_poster(self):
        poster = {}
        poster['width'] = self.poster_width
        poster['height'] = self.poster_height
        poster['url'] = '/%s/poster.jpg' % self.itemId
        '''
        if self.poster:
            poster['url'] = self.poster.url
        else:
            poster['url'] = self.poster_url
        '''
        return poster

    def get_posters(self):
        posters = {}
        for p in self.poster_urls.all():
            if p.service not in posters:
                posters[p.service] = []
            posters[p.service].append({'url': p.url, 'width': p.width, 'height': p.height})
        local_posters = self.local_posters().keys()
        if local_posters:
            posters['local'] = []
            for p in local_posters:
                url = p.replace(settings.MEDIA_ROOT, settings.MEDIA_URL)
                width = 640
                height = 1024
                posters['local'].append({'url': url, 'width': width, 'height': height})
        return posters

    def get_stream(self):
        stream = {}
        if self.streams.all().count():
            s = self.streams.all()[0]
            if s.video and s.info:
                stream['duration'] = s.info['duration']
                if 'video' in s.info and s.info['video']:
                    stream['aspectRatio'] = s.info['video'][0]['width'] / s.info['video'][0]['height']
                if settings.XSENDFILE or settings.XACCELREDIRECT:
                    stream['baseUrl'] = '/%s' % self.itemId
                else:
                    stream['baseUrl'] = os.path.dirname(s.video.url)
                stream['profiles'] = list(set(map(lambda s: int(os.path.splitext(s['profile'])[0][:-1]), self.streams.all().values('profile'))))
        return stream

    def get_layers(self):
        layers = {}
        layers['cuts'] = self.data.get('cuts', {})

        layers['subtitles'] = {}
        #FIXME: subtitles should be stored in Annotation
        qs = self.files.filter(is_subtitle=True, is_main=True, available=True)
        if qs.count()>0:
            layers['subtitles'] = qs[0].srt()
        return layers

    def get_json(self, fields=None):
        item = {
            'id': self.itemId
        }
        item.update(self.external_data)
        item.update(self.data)
        for key in site_config()['keys'].keys():
            if key not in item:
                value = self.get(key)
                #also get values from sort table, i.e. numberof values
                if not value and  self.sort and hasattr(self.sort, key):
                    if hasattr(self.sort, '%s_desc'%key):
                        if getattr(self.sort, key) == getattr(self.sort, '%s_desc'%key):
                            value = getattr(self.sort, key)
                    else:
                        value = getattr(self.sort, key)
                if value:
                    item[key] = value

        #format datetime values
        for key in item:
            if isinstance(item[key], datetime):
                item[key] = item[key].strftime('%Y-%m-%dT%H:%M:%SZ')

        if not fields:
            item['stream'] = self.get_stream()
        item['poster'] = self.get_poster()
        item['posters'] = self.get_posters()
        return item


    def oxdb_id(self):
        return utils.oxdb_id(self.get('title', ''), self.get('director', []), str(self.get('year', '')),
                          self.get('season', ''), self.get('episode', ''),
                          self.get('episode_title', ''), self.get('episode_director', []), self.get('episode_year', ''))

    '''
        Search related functions
    '''

    def update_find(self):

        def save(key, value):
            f, created = ItemFind.objects.get_or_create(item=self, key=key)
            if value not in ('', '||'):
                if isinstance(value, basestring):
                    value = value.strip()
                f.value = value
                f.save()
            else:
                f.delete()

        #FIXME: use site_config
        save('title', '\n'.join([self.get('title'), self.get('original_title', '')]))

        for key in self.facet_keys:
            if key == 'character':
                values = self.get('cast', '')
                if values:
                 if isinstance(values[0], basestring):
                    values = [values[0], ]
                 else:
                    values = [i[1] for i in values]
            else:
                values = self.get(key, '')
            if isinstance(values, list):
                save(key, '|%s|'%'|'.join(values))
            else:
                save(key, values)

        save('summary', self.get('summary', '') + self.get('plot', '') + self.get('plot_outline', ''))
        save('trivia', ' '.join(self.get('trivia', [])))
        save('location', '|%s|'%'|'.join(self.get('filming_locations', [])))

        #FIXME:
        #f.dialog = 'fixme'
        save('dialog', '\n'.join([l.value for l in Annotation.objects.filter(layer__type='subtitle', item=self).order_by('start')]))

        #FIXME: collate filenames
        #f.filename = self.filename
        all_find = ' '.join([f.value for f in ItemFind.objects.filter(item=self).exclude(key='all')])
        save('all', all_find)

    def update_sort(self):
        try:
            s = self.sort
        except ItemSort.DoesNotExist:
            s = ItemSort(item=self)

        def sortNames(values):
            sort_value = u''
            if values:
                sort_value = u'; '.join([get_name_sort(name) for name in values])
            if not sort_value:
                sort_value = u''
            return sort_value

        base_keys = (
            'id',
            'aspectratio',
            'duration',
            'color',
            'saturation',
            'brightness',
            'volume',
            'clips',
            'cuts',
            'cutsperminute',
            'words',
            'wordsperminute',
            'resolution',
            'pixels',
            'size',
            'bitrate',
            'files',
            'filename',
            'published',
            'modified',
            'popularity'
        )
        for key in site_config()['sortKeys']:
            name = key['id']
            source = key.get('key', name)
            field_type = key['type']
            max_int = 9223372036854775807L

            if name not in base_keys:
                if field_type == 'title':
                    value = utils.sort_title(canonicalTitle(self.get(source)))
                    value = utils.sort_string(value)
                    setattr(s, '%s_desc'%name, value)
                    if not value:
                        value = 'zzzzzzzzzzzzzzzzzzzzzzzzz'
                    setattr(s, name, value)
                elif field_type == 'person':
                    value = sortNames(self.get(source, []))
                    value = utils.sort_string(value)[:955]
                    setattr(s, '%s_desc'%name, value)
                    if not value:
                        value = 'zzzzzzzzzzzzzzzzzzzzzzzzz'
                    setattr(s, name, value)
                elif field_type == 'string':
                    value = self.get(source, u'')
                    if isinstance(value, list):
                        value = u','.join(value)
                    value = utils.sort_string(value)[:955]
                    setattr(s, '%s_desc'%name, value)
                    if not value:
                        value = 'zzzzzzzzzzzzzzzzzzzzzzzzz'
                    setattr(s, name, value)
                elif field_type == 'length':
                    #can be length of strings or length of arrays, i.e. keywords
                    value = self.get(source, None)
                    if not value:
                        value = -max_int
                    else:
                        value = len(value)
                    setattr(s, '%s_desc'%name, value)
                    if value == -max_int:
                        value = max_int
                    setattr(s, name, value)
                elif field_type == 'integer':
                    value = self.get(source, -max_int)
                    if isinstance(value, list):
                        value = len(value)
                    setattr(s, '%s_desc'%name, value)
                    if value == -max_int:
                        value = max_int
                    setattr(s, name, value)
                elif field_type == 'float':
                    max_float = 9223372036854775807L
                    value = self.get(source, -max_float)
                    if isinstance(value, list):
                        value = sum(value)
                    setattr(s, name, value)
                    if value == -max_float:
                        value = max_float
                    setattr(s, '%s_desc'%name, value)
                elif field_type == 'words':
                    value = self.get(source, '')
                    if isinstance(value, list):
                        value = '\n'.join(value)
                    if value:
                        value = len(value.split(' '))
                    else:
                        value = 0
                    setattr(s, name, value)
                elif field_type == 'year':
                    value = self.get(source, '')
                    setattr(s, '%s_desc'%name, value)
                    if not value:
                        value = '9999'
                    setattr(s, name, value)
                elif field_type == 'date':
                    value = self.get(source, None)
                    if isinstance(value, basestring):
                        value = datetime.strptime(value, '%Y-%m-%d')
                    setattr(s, name, value)
                    if not value:
                        value = datetime.strptime('9999-12-12', '%Y-%m-%d')
                    setattr(s, '%s_desc'%name, value)

        #sort keys based on database, these will always be available
        s.itemId = self.itemId.replace('0x', 'xx')
        s.modified = self.modified
        s.modified_desc = self.modified
        s.published = self.published
        s.published_desc = self.published

        # sort values based on data from videos
        s.words = 0 #FIXME: get words from all layers or something
        s.wordsperminute = 0
        s.clips = 0  #FIXME: get clips from all layers or something
        s.popularity = 0  #FIXME: get popularity from somewhere
        videos = self.main_videos()
        if len(videos) > 0:
            s.duration = sum([v.duration for v in videos])
            s.resolution = videos[0].width * videos[0].height
            s.aspectratio = int(1000 * utils.parse_decimal(v.display_aspect_ratio))
            #FIXME: should be average over all files
            if 'bitrate' in videos[0].info:
                s.bitrate = videos[0].info['bitrate']
            s.pixels = sum([v.pixels for v in videos])
            s.filename = ' '.join([v.name for v in videos])[:955]
            s.filename_desc = ' '.join([v.name for v in videos])[:955]
            s.files = self.files.all().count()
            s.size = sum([v.size for v in videos]) #FIXME: only size of movies?
            s.volume = 0
        else:
            s.duration = 0
            s.resolution = 0
            s.aspectratio = 0
            s.bitrate = 0
            s.pixels = 0
            s.filename = 0
            s.files = 0
            s.size = 0
            s.volume = 0

        s.color = int(sum(self.data.get('color', [])))
        s.saturation = 0 #FIXME
        s.brightness = 0 #FIXME

        s.cuts = len(self.data.get('cuts', []))
        if s.duration:
            s.cutsperminute = s.cuts / (s.duration/60)
        else:
            s.cutsperminute = 0
        s.save()


    def update_facets(self):
        #FIXME: what to do with Unkown Director, Year, Country etc.
        for key in self.facet_keys:
            current_values = self.get(key, [])
            if not isinstance(current_values, list):
                current_values = [current_values]
            saved_values = [i.value for i in Facet.objects.filter(item=self, key=key)]
            removed_values = filter(lambda x: x not in current_values, saved_values)
            if removed_values:
                Facet.objects.filter(item=self, key=key, value__in=removed_values).delete()
            for value in current_values:
                if value not in saved_values:
                    value_sort = value
                    if key in self.person_keys:
                        value_sort = get_name_sort(value)
                    f = Facet(key=key, value=value, value_sort=value_sort)
                    f.item = self
                    f.save()
        year = self.get('year', None)
        if year:
            f, created = Facet.objects.get_or_create(key='year', value=year, value_sort=year, item=self)
        else:
            Facet.objects.filter(item=self, key='year').delete()

    def path(self, name=''):
        h = self.itemId
        return os.path.join('items', h[:2], h[2:4], h[4:6], h[6:], name)

    '''
        Video related functions
    '''

    def frame(self, position, width=128):
        stream = self.streams.filter(profile=settings.VIDEO_PROFILE+'.webm')[0]
        path = os.path.join(settings.MEDIA_ROOT, self.path(), 'frames', "%d"%width, "%s.jpg"%position)
        if not os.path.exists(path):
            extract.frame(stream.video.path, path, position, width)
        return path

    @property
    def timeline_prefix(self):
        return os.path.join(settings.MEDIA_ROOT, self.path(), 'timeline')

    def main_videos(self):
        #FIXME: needs to check if more than one user has main files and only take from "higher" user
        videos = self.files.filter(is_main=True, is_video=True, available=True)
        if videos.count()>0:
            first = videos[0]
            user = first.instances.all()[0].volume.user
            #only take videos from same user and with same width/height
            def check(v):
                if v.instances.filter(volume__user=user).count()>0 and \
                    first.width == v.width and first.height == v.height:
                    return True
                return False
            videos = filter(check, videos)
        return videos

    def update_streams(self):
        files = {}
        for f in self.main_videos():
            files[utils.sort_title(f.name)] = f.video.path

        #FIXME: how to detect if something changed?
        if files:
            stream, created = Stream.objects.get_or_create(item=self, profile='%s.webm' % settings.VIDEO_PROFILE)
            stream.video.name = stream.path()
            cmd = []
            if os.path.exists(stream.video.path):
                os.unlink(stream.video.path)
            elif not os.path.exists(os.path.dirname(stream.video.path)):
                os.makedirs(os.path.dirname(stream.video.path))
            if len(files.values()) > 1:
                for f in sorted(files):
                    cmd.append('+')
                    cmd.append(files[f])
                cmd = [ 'mkvmerge', '-o', stream.video.path ] + cmd[1:]
                #print cmd
                p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                #p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
                p.wait()
            else:
                os.symlink(files.values()[0], stream.video.path)
            stream.save()

            if 'video' in stream.info:
                extract.timeline(stream.video.path, self.timeline_prefix)
                self.stream_aspect = stream.info['video'][0]['width']/stream.info['video'][0]['height']
                self.data['cuts'] = extract.cuts(self.timeline_prefix)
                self.data['color'] = extract.average_color(self.timeline_prefix)
                #extract.timeline_strip(self, self.data['cuts'], stream.info, self.timeline_prefix[:-8])

            stream.extract_derivatives()
            self.make_local_posters()
            self.make_poster()
            self.make_icon()
            self.available = True
            self.save()

    '''
        Poster related functions
    '''

    def update_poster_urls(self):
        _current = {}
        for s in settings.POSTER_SERVICES:
            url = '%s?itemId=%s'%(s, self.itemId)
            try:
                data = json.loads(ox.net.readUrlUnicode(url))
            except:
                continue
            for service in data:
                if service not in _current:
                    _current[service] = []
                for poster in data[service]:
                    _current[service].append(poster)
        #FIXME: remove urls that are no longer listed
        for service in _current:
            for poster in _current[service]:
                p, created = PosterUrl.objects.get_or_create(item=self, url=poster['url'], service=service)
                if created:
                    p.width = poster['width']
                    p.height = poster['height']
                    p.save()

    def delete_poster(self):
        if self.poster:
            path = self.poster.path
            self.poster.delete()
            for f in glob(path.replace('.jpg', '*.jpg')):
                os.unlink(f)

    def prefered_poster_url(self):
        if self.poster_url:
            return self.poster_url
        self.update_poster_urls()
        for service in settings.POSTER_PRECEDENCE:
            for u in self.poster_urls.filter(service=service).order_by('-height'):
                return u.url
        return None

    def make_poster(self, force=False):
        if not self.poster or force:
            url = self.prefered_poster_url()
            if url:
                data = ox.net.readUrl(url)
                if force:
                    self.delete_poster()
                self.poster.save('poster.jpg', ContentFile(data))
                self.save()
            else:
                if force:
                    self.delete_poster()
                local_posters = self.make_local_posters()
                if local_posters:
                    with open(local_posters[0]) as f:
                        self.poster.save('poster.jpg', ContentFile(f.read()))

    def local_posters(self):
        part = 1
        posters = {}
        if self.poster_frame >= 0:
            frame = self.get_poster_frame_path()
            path = self.path('poster.pandora.%s.%s.jpg'%(part, self.poster_frame))
            path = os.path.abspath(os.path.join(settings.MEDIA_ROOT, path))
            posters[path] = frame
        else:
            for f in self.main_videos():
                for frame in f.frames.all():
                    path = self.path('poster.pandora.%s.%s.jpg'%(part, frame.position))
                    path = os.path.abspath(os.path.join(settings.MEDIA_ROOT, path))
                    posters[path] = frame.frame.path
                part += 1
        return posters

    def make_local_posters(self):
        posters = self.local_posters()
        for poster in posters:
            frame = posters[poster]
            timeline = self.path('timeline.64.png')
            timeline = os.path.abspath(os.path.join(settings.MEDIA_ROOT, timeline))
            if os.path.exists(timeline):
                cmd = [settings.ITEM_POSTER,
                       '-t', self.get('title'),
                       '-d', ', '.join(self.get('director', ['Unknown Director'])),
                       '-y', str(self.get('year', '')),
                       '-f', frame,
                       '-l', timeline,
                       '-p', poster
                      ]
                if settings.USE_IMDB and len(self.itemId) == 7:
                    cmd += ['-i', self.itemId]
                cmd += ['-o', self.oxdbId]
                p = subprocess.Popen(cmd)
                p.wait()
        return posters.keys()

    def get_poster_frame_path(self):
        if self.poster_frame >= 0:
            size = int(settings.VIDEO_PROFILE[:-1])
            return self.frame(self.poster_frame, size)

        frames = []
        for f in self.main_videos():
            for ff in f.frames.all():
                frames.append(ff.frame.path)
            return frames[int(len(frames)/2)]

    def make_icon(self):
        frame = self.get_poster_frame_path()
        if frame:
            icon = self.path('icon.jpg')
            self.icon.name = icon
            frame = frames[int(len(frames)/2)]
            timeline = self.path('timeline.64.png')
            timeline = os.path.abspath(os.path.join(settings.MEDIA_ROOT, timeline))
            if os.path.exists(timeline):
                cmd = [settings.ITEM_ICON,
                       '-f', frame,
                       '-l', timeline,
                       '-i', self.icon.path
                      ]
                p = subprocess.Popen(cmd)
                p.wait()
            self.save()
            return icon
        return None

Item.facet_keys = []
Item.person_keys = []
config = site_config()
for key in config['findKeys']:
    name = key['id']
    if key.get('autocomplete', False) and not config['keys'].get(name, {'type': None})['type'] == 'title':
        Item.facet_keys.append(name)
    if name in config['keys'] and config['keys'][name]['type'] == 'person':
        Item.person_keys.append(name)

class ItemFind(models.Model):
    """
        used to find items,
        item.update_find populates this table
        its used in manager.ItemManager
    """

    class Meta:
        unique_together = ("item", "key")

    item = models.ForeignKey('Item', related_name='find', db_index=True)
    key = models.CharField(max_length=200, db_index=True)
    value = models.TextField(blank=True)

    def __unicode__(self):
        return u"%s=%s" % (self.key, self.value)
'''
ItemSort
table constructed based on info in site_config['sortKeys']
'''
attrs = {
    '__module__': 'item.models',
    'item': models.OneToOneField('Item', related_name='sort', primary_key=True),
}
for key in config['sortKeys']:
    name = key['id']
    name = {'id': 'itemId'}.get(name, name)
    field_type = key['type']
    if field_type in ('string', 'title', 'person'):
        attrs[name] = models.CharField(max_length=1000, db_index=True)
        attrs['%s_desc'%name] = models.CharField(max_length=1000, db_index=True)
    elif field_type == 'year':
        attrs[name] = models.CharField(max_length=4, db_index=True)
        attrs['%s_desc'%name] = models.CharField(max_length=4, db_index=True)
    elif field_type in ('integer', 'words', 'length'):
        attrs[name] = models.BigIntegerField(blank=True, db_index=True)
        attrs['%s_desc'%name] = models.BigIntegerField(blank=True, db_index=True)
    elif field_type == 'float':
        attrs[name] = models.FloatField(blank=True, db_index=True)
        attrs['%s_desc'%name] = models.FloatField(blank=True, db_index=True)
    elif field_type == 'date':
        attrs[name] = models.DateTimeField(blank=True, db_index=True)
        attrs['%s_desc'%name] = models.DateTimeField(blank=True, db_index=True)
    else:
        print field_type
        print key

ItemSort = type('ItemSort', (models.Model,), attrs)
ItemSort.fields = filter(lambda x: not x.endswith('_desc'), [f.name for f in ItemSort._meta.fields])
ItemSort.descending_fields = filter(lambda x: x.endswith('_desc'), [f.name for f in ItemSort._meta.fields])


class Facet(models.Model):
    '''
        used for keys that can have multiple values like people, languages etc.
        does not perform to well if total number of items goes above 10k
        this happens for keywords in 0xdb right now
    '''
    
    class Meta:
        unique_together = ("item", "key", "value")

    item = models.ForeignKey('Item', related_name='facets')
    key = models.CharField(max_length=200, db_index=True)
    value = models.CharField(max_length=200, db_index=True)
    value_sort = models.CharField(max_length=200, db_index=True)

    def save(self, *args, **kwargs):
        if not self.value_sort:
            self.value_sort = utils.sort_string(self.value)
        super(Facet, self).save(*args, **kwargs)


class Stream(models.Model):

    class Meta:
        unique_together = ("item", "profile")

    item = models.ForeignKey(Item, related_name='streams')
    profile = models.CharField(max_length=255, default='96p.webm')
    video = models.FileField(default=None, blank=True, upload_to=lambda f, x: f.path())
    source = models.ForeignKey('Stream', related_name='derivatives', default=None, null=True)
    available = models.BooleanField(default=False)
    info = fields.DictField(default={})

    def __unicode__(self):
        return u"%s/%s" % (self.item, self.profile)

    def path(self):
        return self.item.path(self.profile)

    def extract_derivatives(self):
        if settings.VIDEO_H264:
            profile = self.profile.replace('.webm', '.mp4')
            derivative, created = Stream.objects.get_or_create(profile=profile, item=self.item)
            if created:
                derivative.source = self
                derivative.video.name = self.video.name.replace(self.profile, profile)
                derivative.encode()
                derivative.save()

        for p in settings.VIDEO_DERIVATIVES:
            profile = p + '.webm'
            target = self.video.path.replace(self.profile, profile)
            derivative, created = Stream.objects.get_or_create(profile=profile, item=self.item)
            if created:
                derivative.source = self
                derivative.video.name = self.video.name.replace(self.profile, profile)
                derivative.encode()
                derivative.save()

            if settings.VIDEO_H264:
                profile = p + '.mp4'
                derivative, created = Stream.objects.get_or_create(profile=profile, item=self.item)
                if created:
                    derivative.source = self
                    derivative.video.name = self.video.name.replace(self.profile, profile)
                    derivative.encode()
                    derivative.save()
        return True

    def encode(self):
        if self.source:
            video = self.source.video.path
            target = self.video.path
            profile = self.profile
            info = ox.avinfo(video)
            if extract.stream(video, target, profile, info):
                self.available=True
                self.save()

    def save(self, *args, **kwargs):
        if self.video and not self.info:
            self.info = ox.avinfo(self.video.path)
        super(Stream, self).save(*args, **kwargs)


class PosterUrl(models.Model):

    class Meta:
        unique_together = ("item", "service", "url")
        ordering = ('-height', )

    item = models.ForeignKey(Item, related_name='poster_urls')
    url = models.CharField(max_length=1024)
    service = models.CharField(max_length=1024)
    width = models.IntegerField(default=80)
    height = models.IntegerField(default=128)

    def __unicode__(self):
        return u'%s %s %dx%d' % (unicode(self.item), self.service, self.width, self.height)
