# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from datetime import datetime
import os.path
import subprocess
from glob import glob
import shutil
import uuid
import unicodedata

from django.db import models
from django.db.models import Sum
from django.core.files.base import ContentFile
from django.utils import simplejson as json
from django.conf import settings
from django.contrib.auth.models import User, Group
from django.db.models.signals import pre_delete

import ox
from ox.django import fields
from ox.normalize import canonicalTitle
import ox.web.imdb

import managers
import utils
import tasks
from archive import extract

from annotation.models import Annotation, Layer
from person.models import get_name_sort
from app.models import site_config


def get_item(info, user=None):
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
                item.user = user
                item.save()
                tasks.update_external.delay(item.itemId)
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
        qs = Item.objects.filter(find__key='title', find__value=info['title'])
        if qs.count() == 1:
            item = qs[0]
        else:
            item = Item()
            item.data = {
                'title': info['title']
            }
            item.user = user
            item.save()
    return item


class Item(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    published = models.DateTimeField(default=datetime.now, editable=False)

    user = models.ForeignKey(User, null=True, related_name='items')
    groups = models.ManyToManyField(Group, blank=True, related_name='items')

    #only items that have data from files are available,
    #this is indicated by setting available to True
    available = models.BooleanField(default=False, db_index=True)
    public = models.BooleanField(default=False, db_index=True)

    itemId = models.CharField(max_length=128, unique=True, blank=True)
    oxdbId = models.CharField(max_length=42, unique=True, blank=True, null=True)
    external_data = fields.DictField(default={}, editable=False)
    data = fields.DictField(default={}, editable=False)
    json = fields.DictField(default={}, editable=False)
    poster = models.ImageField(default=None, blank=True,
                               upload_to=lambda i, x: i.path("poster.jpg"))
    poster_url = models.TextField(blank=True)
    poster_height = models.IntegerField(default=0)
    poster_width = models.IntegerField(default=0)
    poster_frame = models.FloatField(default=-1)

    icon = models.ImageField(default=None, blank=True,
                             upload_to=lambda i, x: i.path("icon.jpg"))

    #stream related fields
    stream_aspect = models.FloatField(default=4/3)

    objects = managers.ItemManager()

    def get(self, key, default=None):
        if self.data and key in self.data:
            return self.data[key]
        if self.external_data and key in self.external_data:
            return self.external_data[key]
        return default

    def access(self, user):
        if self.public and self.available:
            return True
        elif user.is_authenticated() and \
             (user.is_staff or self.user == user or \
              self.groups.filter(id__in=user.groups.all()).count() > 0):
                return True
        return False

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
        if 'groups' in data:
            groups = data.pop('groups')
            self.groups.exclude(name__in=groups).delete()
            for g in groups:
                group, created = Group.objects.get_or_create(name=g) 
                self.groups.add(group)
        for key in data:
            if key != 'id':
                self.data[key] = data[key]
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
                data['actor'] = data['actor']
            self.external_data = data
            self.save()

    def __unicode__(self):
        year = self.get('year')
        if year:
            return u'%s (%s)' % (self.get('title', 'Untitled'), self.get('year'))
        return self.get('title', u'Untitled')

    def get_absolute_url(self):
        return '/%s' % self.itemId

    def save(self, *args, **kwargs):
        if not self.id:
            if not self.itemId:
                self.itemId = str(uuid.uuid1())
            super(Item, self).save(*args, **kwargs)
            if not settings.USE_IMDB:
                self.itemId = ox.to32(self.id)    
 
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
        update_poster = False
        if not settings.USE_IMDB:
            if self.poster_frame == -1 and self.sort.duration:
                self.poster_frame = self.sort.duration/2
                update_poster = True
            if not self.get('runtime') and self.sort.duration:
                self.data['runtime'] = self.sort.duration
                self.update_sort()
        self.json = self.get_json()
        super(Item, self).save(*args, **kwargs)
        if update_poster:
            tasks.update_poster.delay(self.itemId)

    def delete_files(self):
        path = os.path.join(settings.MEDIA_ROOT, self.path())
        if os.path.exists(path):
            shutil.rmtree(path)

    def delete(self, *args, **kwargs):
        self.streams.all().delete()
        self.delete_files()
        super(Item, self).delete(*args, **kwargs)

    def merge_with(self, other):
        '''
            move all related tables to other and delete self
        '''
        for l in self.lists.all():
            l.remove(self)
            if l.items.filter(id=other.id) == 0:
                l.add(other)
        #FIXME: should this really happen for annotations?
        for a in self.annotations.all():
            a.item = other

        if hasattr(self, 'files'):
            for f in self.files.all():
                f.item = other
                f.save()
        self.delete()
        other.save()
        #FIXME: update poster, stills and streams after this

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
                #FIXME: media_url is no longer public
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
                else:
                    stream['aspectRatio'] = 128/80
                if settings.XSENDFILE or settings.XACCELREDIRECT:
                    stream['baseUrl'] = '/%s' % self.itemId
                else:
                    stream['baseUrl'] = os.path.dirname(s.video.url)
                stream['profiles'] = sorted(list(set(map(lambda s: int(os.path.splitext(s['profile'])[0][:-1]), self.streams.all().values('profile')))))
                stream['formats'] = list(set(map(lambda s: os.path.splitext(s['profile'])[1][1:], self.streams.all().values('profile'))))
        return stream

    def get_layers(self, user=None):
        layers = {}
        for l in Layer.objects.all():
            ll = layers.setdefault(l.name, [])
            qs = Annotation.objects.filter(layer=l, item=self)
            if l.private:
                if user.is_anonymous():
                    user = None
                qs = qs.filter(user=user)
            for a in qs.order_by('start'):
                ll.append(a.json())
        return layers

    def get_json(self, fields=None):
        i = {
            'id': self.itemId
        }
        i.update(self.external_data)
        i.update(self.data)
        for k in site_config()['itemKeys']:
            key = k['id']
            if key not in i:
                value = self.get(key)
                #also get values from sort table, i.e. numberof values
                if not value and  self.sort and hasattr(self.sort, key):
                    value = getattr(self.sort, key)
                if value:
                    i[key] = value

        i['poster'] = self.get_poster()
        i['posters'] = self.get_posters()
        return i


    def oxdb_id(self):
        if not settings.USE_IMDB:
            return self.itemId
        if not self.get('title') and not self.get('director'):
            return None
        return utils.oxdb_id(self.get('title', ''), self.get('director', []), str(self.get('year', '')),
                          self.get('season', ''), self.get('episode', ''),
                          self.get('episode_title', ''), self.get('episode_director', []), self.get('episode_year', ''))

    '''
        Search related functions
    '''

    def update_find(self):

        def save(key, value):
            f, created = ItemFind.objects.get_or_create(item=self, key=key)
            if value not in ('', ):
                if isinstance(value, basestring):
                    value = value.strip()
                f.value = value
                f.save()
            else:
                f.delete()

        #FIXME: use site_config
        save('title', u'\n'.join([self.get('title', 'Untitled'),
                                 self.get('original_title', '')]))

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
                save(key, '\n'.join(values))
            else:
                save(key, values)

        save('summary', self.get('summary', ''))
        save('trivia', ' '.join(self.get('trivia', [])))

        #FIXME:
        qs = Annotation.objects.filter(layer__type='subtitle', item=self).order_by('start')
        save('dialog', '\n'.join([l.value for l in qs]))

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

        def set_value(s, name, value):
            if not value:
                value = None
            setattr(s, name, value)

        base_keys = (
            'id',
            'aspectratio',
            'duration',
            'hue',
            'saturation',
            'lightness',
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
            'numberoffiles',
            'published',
            'modified',
            'popularity',
        )

        for key in filter(lambda k: 'columnWidth' in k, config['itemKeys']):
            name = key['id']
            source = name
            sort_type = key.get('sort', key['type'])
            if 'value' in key:
                if 'layer' in key['value']:
                   continue 
                source = key['value']['key']
                sort_type = key['value'].get('type', sort_type) 

            if name not in base_keys:
                if sort_type == 'title':
                    value = utils.sort_title(canonicalTitle(self.get(source, u'Untitled')))
                    value = utils.sort_string(value)
                    set_value(s, name, value)
                elif sort_type == 'person':
                    value = sortNames(self.get(source, []))
                    value = utils.sort_string(value)[:955]
                    set_value(s, name, value)
                elif sort_type == 'string':
                    value = self.get(source, u'')
                    if isinstance(value, list):
                        value = u','.join(value)
                    value = utils.sort_string(value)[:955]
                    set_value(s, name, value)
                elif sort_type in ('length', 'integer', 'float'):
                    #can be length of strings or length of arrays, i.e. keywords
                    value = self.get(source)
                    if isinstance(value, list):
                        value = len(value)
                    set_value(s, name, value)
                elif sort_type == 'words':
                    value = self.get(source)
                    if isinstance(value, list):
                        value = '\n'.join(value)
                    if value:
                        value = len(value.split(' '))
                    set_value(s, name, value)
                elif sort_type == 'year':
                    value = self.get(source)
                    set_value(s, name, value)
                elif sort_type == 'date':
                    value = self.get(source)
                    if isinstance(value, basestring):
                        value = datetime.strptime(value, '%Y-%m-%d')
                    set_value(s, name, value)

        #sort keys based on database, these will always be available
        s.itemId = self.itemId.replace('0x', 'xx')
        s.modified = self.modified
        s.published = self.published

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
            s.numberoffiles = self.files.all().count()
            s.size = sum([v.size for v in videos]) #FIXME: only size of movies?
            s.volume = 0
        else:
            s.duration = None
            s.resolution = None
            s.aspectratio = None
            s.bitrate = None
            s.pixels = None
            s.filename = None
            s.files = None
            s.size = None
            s.volume = None

        if 'color' in self.data:
            s.hue, s.saturation, s.brightness = self.data['color']
        else:
            s.hue = None
            s.saturation = None
            s.brighness = None
        s.cuts = len(self.data.get('cuts', []))
        if s.duration:
            s.cutsperminute = s.cuts / (s.duration/60)
        else:
            s.cutsperminute = None 
        s.popularity = self.accessed.aggregate(Sum('accessed'))['accessed__sum']
        s.save()


    def update_facets(self):
        #FIXME: what to do with Unkown Director, Year, Country etc.
        for key in self.facet_keys:
            current_values = self.get(key, [])
            if not isinstance(current_values, list):
                current_values = [unicode(current_values)]
            current_values = list(set(current_values))
            saved_values = [i.value for i in Facet.objects.filter(item=self, key=key)]
            removed_values = filter(lambda i: i not in current_values, saved_values)
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

    def path(self, name=''):
        h = self.itemId
        return os.path.join('items', h[:2], h[2:4], h[4:6], h[6:], name)

    '''
        Video related functions
    '''

    def frame(self, position, width=128):
        stream = self.streams.filter(profile=settings.VIDEO_PROFILE)
        if stream.count()>0:
            stream = stream[0]
        else:
            return None
        path = os.path.join(settings.MEDIA_ROOT, self.path(),
                            'frames', "%d"%width, "%s.jpg"%position)
        if not os.path.exists(path):
            extract.frame(stream.video.path, path, position, width)
        if not os.path.exists(path):
            path = os.path.join(settings.STATIC_ROOT, 'png/frame.broken.png')
        return path

    @property
    def timeline_prefix(self):
        return os.path.join(settings.MEDIA_ROOT, self.path(), 'timeline')

    def main_videos(self):
        #FIXME: needs to check if more than one user has main files and only
        #       take from "higher" user
        videos = self.files.filter(is_main=True, is_video=True, available=True).order_by('part')
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
        else:
            audio = self.files.filter(is_main=True, is_audio=True, available=True)
            if audio.count()>0:
                first = audio[0]
                user = first.instances.all()[0].volume.user
                #only take videos from same user and with same width/height
                def check(v):
                    if v.instances.filter(volume__user=user).count()>0:
                        return True
                    return False
                videos = filter(check, audio)
 
        return videos

    def update_streams(self):
        files = {}
        for f in self.main_videos():
            files[utils.sort_title(f.name)] = f.video.path

        #FIXME: how to detect if something changed?
        if files:
            stream, created = Stream.objects.get_or_create(item=self,
                                     profile=settings.VIDEO_PROFILE)
            stream.video.name = stream.path()
            cmd = []
            if os.path.exists(stream.video.path):
                os.unlink(stream.video.path)
            ox.makedirs(os.path.dirname(stream.video.path))
            if len(files.values()) > 1:
                if len(files.values()) > 4:
                    print "FIXME: to many files for this item, not merging entire tv shows"
                    return
                for f in sorted(files):
                    cmd.append('+')
                    cmd.append(files[f])
                cmd = [ 'mkvmerge', '-o', stream.video.path ] + cmd[1:]
                #print cmd
                p = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                                          stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                #p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
                p.wait()
            else:
                os.symlink(files.values()[0], stream.video.path)
            stream.save()

            extract.timeline(stream.video.path, self.timeline_prefix)
            if 'video' in stream.info and stream.info['video']:
                v = stream.info['video'][0]
                self.stream_aspect = v['width']/v['height']
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
            url = '%s?id=%s'%(s, self.itemId)
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
        timeline = self.path('timeline.64.png')
        timeline = os.path.abspath(os.path.join(settings.MEDIA_ROOT, timeline))
        if not os.path.exists(timeline):
            path = self.path('poster.pandora.jpg')
            path = os.path.abspath(os.path.join(settings.MEDIA_ROOT, path))
            posters[path] = False
            return posters
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
        timeline = self.path('timeline.64.png')
        timeline = os.path.abspath(os.path.join(settings.MEDIA_ROOT, timeline))
        ox.makedirs(os.path.join(settings.MEDIA_ROOT,self.path()))
        for poster in posters:
            frame = posters[poster]
            cmd = [settings.ITEM_POSTER,
                   '-t', self.get('title').encode('utf-8'),
                   '-d', u', '.join(self.get('director', ['Unknown Director'])).encode('utf-8'),
                   '-y', str(self.get('year', '')),
                   '-p', poster
                  ]
            if frame:
                cmd += [
                   '-f', frame,
                   '-l', timeline,
                ]
            if settings.USE_IMDB:
                if len(self.itemId) == 7:
                    cmd += ['-i', self.itemId]
                cmd += ['-o', self.oxdbId]
            else:
                cmd += ['-i', self.itemId]
            p = subprocess.Popen(cmd)
            p.wait()
        return posters.keys()

    def get_poster_frame_path(self):
        if self.poster_frame >= 0:
            size = int(settings.VIDEO_PROFILE.split('.')[0][:-1])
            return self.frame(self.poster_frame, size)

        frames = []
        for f in self.main_videos():
            for ff in f.frames.all():
                frames.append(ff.frame.path)
            if frames:
                return frames[int(len(frames)/2)]

    def make_icon(self):
        frame = self.get_poster_frame_path()
        if frame:
            icon = self.path('icon.jpg')
            self.icon.name = icon
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

def delete_item(sender, **kwargs):
    i = kwargs['instance']
    i.delete_files()
pre_delete.connect(delete_item, sender=Item)

config = site_config()

Item.facet_keys = []
for key in config['itemKeys']:
    if 'autocomplete' in key and not 'autocompleteSortKey' in key:
        Item.facet_keys.append(key['id'])

Item.person_keys = []
for key in config['itemKeys']:
    if 'sort' in key and key['sort'] == 'person':
        Item.person_keys.append(key['id'])

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
table constructed based on info in site_config['itemKeys']
'''
attrs = {
    '__module__': 'item.models',
    'item': models.OneToOneField('Item', related_name='sort', primary_key=True),
}
for key in filter(lambda k: 'columnWidth' in k, config['itemKeys']):
    name = key['id']
    name = {'id': 'itemId'}.get(name, name)
    sort_type = key.get('sort', key['type'])
    if isinstance(sort_type, list):
        sort_type = sort_type[0]
    model = {
        'char': (models.CharField, dict(null=True, max_length=1000, db_index=True)),
        'year': (models.CharField, dict(null=True, max_length=4, db_index=True)),
        'integer': (models.BigIntegerField, dict(null=True, blank=True, db_index=True)),
        'float': (models.FloatField, dict(null=True, blank=True, db_index=True)),
        'date': (models.DateTimeField, dict(null=True, blank=True, db_index=True))
    }[{
        'string': 'char',
        'title': 'char',
        'person': 'char',
        'year': 'year',
        'words': 'integer',
        'length': 'integer',
        'date': 'date',
        'hue': 'float',
    }.get(sort_type, sort_type)]
    attrs[name] = model[0](**model[1])

ItemSort = type('ItemSort', (models.Model,), attrs)
ItemSort.fields = [f.name for f in ItemSort._meta.fields]

class Access(models.Model):
    class Meta:
        unique_together = ("item", "user")

    access = models.DateTimeField(auto_now=True)
    item = models.ForeignKey(Item, related_name='accessed')
    user = models.ForeignKey(User, null=True, related_name='accessed_items')
    accessed = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.accessed:
            self.accessed = 0
        self.accessed += 1
        super(Access, self).save(*args, **kwargs)

    def __unicode__(self):
        if self.user:
            return u"%s/%s/%s" % (self.user, self.item, self.access)
        return u"%s/%s" % (self.item, self.access)

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

    def __unicode__(self):
        return u"%s=%s" % (self.key, self.value)

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
        return u"%s/%s" % (self.item.itemId, self.profile)

    def path(self):
        return self.item.path(self.profile)

    def extract_derivatives(self):
        for profile in settings.VIDEO_DERIVATIVES:
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
