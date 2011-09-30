# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from datetime import datetime
import os.path
import re
import subprocess
from glob import glob
import shutil
import uuid
import unicodedata
from urllib import quote

from django.db import models
from django.db.models import Count, Q, Sum
from django.core.files.base import ContentFile
from django.utils import simplejson as json
from django.conf import settings
from django.contrib.auth.models import User, Group
from django.db.models.signals import pre_delete
from django.contrib.sites.models import Site

import ox
from ox.django import fields
from ox.normalize import canonicalTitle
import ox.web.imdb
import ox.image

import managers
import utils
import tasks
from .timelines import join_timelines

from archive import extract
from annotation.models import Annotation, Layer
import archive.models

from person.models import get_name_sort


def get_item(info, user=None, async=False):
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
                item.oxdbId = item.itemId
                item.save()
                if async:
                    tasks.update_external.delay(item.itemId)
                else:
                    item.update_external()
        else:
            q = Item.objects.all()
            for key in ('title', 'director', 'year'):
                if key in info and info[key]:
                    if isinstance(info[key], list):
                        q = q.filter(find__key=key, find__value='\n'.join(info[key]))
                    else:
                        q = q.filter(find__key=key, find__value=info[key])
            if q.count() >= 1:
                item = q[0]
            elif not 'oxdbId' in info:
                item = Item()
                item.data = {
                    'title': info['title'],
                    'director': info['director'],
                    'year': info.get('year', '')
                }
                for key in ('episode_title', 'series_title', 'season', 'episode'):
                    if key in info and info[key]:
                        item.data[key] = info[key]
                item.oxdbId = item.oxdb_id()
                item.save()
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

    #while metadata is updated, files are set to rendered=False
    rendered = models.BooleanField(default=False, db_index=True)
    #should be set based on user
    level = models.IntegerField(default=4, db_index=True)

    itemId = models.CharField(max_length=128, unique=True, blank=True)
    oxdbId = models.CharField(max_length=42, unique=True, blank=True, null=True)
    external_data = fields.DictField(default={}, editable=False)
    data = fields.DictField(default={}, editable=False)
    json = fields.DictField(default={}, editable=False)
    poster = models.ImageField(default=None, blank=True,
                               upload_to=lambda i, x: i.path("poster.jpg"))
    poster_source = models.TextField(blank=True)
    poster_height = models.IntegerField(default=0)
    poster_width = models.IntegerField(default=0)
    poster_frame = models.FloatField(default=-1)

    icon = models.ImageField(default=None, blank=True,
                             upload_to=lambda i, x: i.path("icon.jpg"))

    torrent = models.FileField(default=None, blank=True,
                               upload_to=lambda i, x: i.path('torrent.torrent'))
    stream_info = fields.DictField(default={}, editable=False)

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
        if user.is_anonymous():
            level = 'guest'
        else:
            level = user.get_profile().get_level()
        allowed_level = settings.CONFIG['capabilities']['canSeeItem'][level]
        if self.level <= allowed_level:
            return True
        elif user.is_authenticated() and \
             (self.user == user or \
              self.groups.filter(id__in=user.groups.all()).count() > 0):
                return True
        return False

    def editable(self, user):
        if user.is_anonymous():
            return False
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
        _reviews = []
        for r in reviews:
            for url in settings.REVIEW_WHITELIST:
                if url in r[0]:
                    _reviews.append({
                        'source': settings.REVIEW_WHITELIST[url],
                        'url': r[0]
                    })
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
                    data['cast'] = [data['cast']]
                data['actor'] = [c[0] for c in data['cast']]
                data['cast'] = map(lambda x: {'actor': x[0], 'character': x[1]}, data['cast'])
            if 'trivia' in data:
                def fix_links(t):
                    def fix_names(m):
                        return '<a href="/?find=name:%s">%s</a>' % (
                            quote(m.group(2).encode('utf-8')), m.group(2)
                        )
                    t = re.sub('<a href="(/name/.*?/)">(.*?)</a>', fix_names, t)
                    def fix_titles(m):
                        return '<a href="/?find=title:%s">%s</a>' % (
                            quote(m.group(2).encode('utf-8')), m.group(2)
                        )
                    t = re.sub('<a href="(/title/.*?/)">(.*?)</a>', fix_titles, t)
                    return t
                data['trivia'] = [fix_links(t) for t in data['trivia']]
            if 'aspectratio' in data:
                data['aspectRatio'] = data.pop('aspectratio')
            #filter reviews
            self.external_data = data
            self.save()

    def expand_connections(self):
        c = self.get('connections')
        if c:
            for t in c.keys():
                if c[t]:
                    if isinstance(c[t][0], basestring):
                        c[t]= [{'id': i, 'title': None} for i in c[t]]
                    ids = [i['id'] for i in c[t]]
                    known  = {}
                    for l in Item.objects.filter(itemId__in=ids):
                        known[l.itemId] = l.get('title')
                    for i in c[t]:
                        if i['id'] in known:
                            i['item'] = i['id']
                            i['title'] = known[i['id']]
                    c[t]= filter(lambda x: x['title'], c[t])
                if not c[t]:
                    del c[t]
        return c

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
 
        oxdbId = self.oxdb_id()
        if oxdbId:
            self.oxdbId = oxdbId
        
        #id changed, what about existing item with new id?
        if settings.USE_IMDB and len(self.itemId) != 7 and self.oxdbId != self.itemId:
            self.itemId = self.oxdbId
            #FIXME: move files to new id here

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

    def get_posters(self):
        url = self.prefered_poster_url()
        index = []
        services = [p['service']
                    for p in self.poster_urls.values("service")
                                             .annotate(Count("id")).order_by()]
        for service in settings.POSTER_PRECEDENCE:
            if service in services:
                index.append(service)
        for service in services:
            if service not in index:
                index.append(service)
        if settings.URL not in index:
            index.append(settings.URL)

        posters = []
        
        poster = self.path('siteposter.jpg')
        poster = os.path.abspath(os.path.join(settings.MEDIA_ROOT, poster))
        if os.path.exists(poster):
            posters.append({
                'url': '/%s/siteposter.jpg' % self.itemId,
                'width': 640,
                'height': 1024,
                'source': settings.URL,
                'selected': url == None,
                'index': index.index(settings.URL)
            })

        got = {}
        for p in self.poster_urls.all().order_by('-height'):
            if p.service not in got:
                got[p.service] = 1
                posters.append({
                    'url': p.url,
                    'width': p.width,
                    'height': p.height,
                    'source': p.service,
                    'selected': p.url == url,
                    'index': index.index(p.service)
                })
        posters.sort(key=lambda a: a['index'])
        return posters

    def get_frames(self):
        frames = []
        pframes = self.poster_frames()
        if pframes:
            pos = self.poster_frame
            if pos < 0:
                pos = int(len(pframes) / 2)
            p = 0
            for f in pframes:
                frames.append({
                    'index': p,
                    'position': f['position'],
                    'selected': p == pos,
                    'url': '/%s/frameposter%d.jpg' %(self.itemId, p),
                    'height': f['height'],
                    'width': f['width'] 
                })
                p += 1
        return frames

    def get_stream(self):
        for s in self.streams():
            return s.json()

    def get_layers(self, user=None):
        layers = {}
        for l in Layer.objects.all():
            ll = layers.setdefault(l.name, [])
            qs = Annotation.objects.filter(layer=l, item=self)
            if l.private:
                if user and user.is_anonymous():
                    user = None
                qs = qs.filter(user=user)
            for a in qs.order_by('start'):
                ll.append(a.json())
        return layers

    def get_json(self, keys=None):
        i = {
            'id': self.itemId,
            'rendered': self.rendered
        }
        i.update(self.external_data)
        i.update(self.data)
        for k in settings.CONFIG['itemKeys']:
            key = k['id']
            if not keys or key in keys:
                if key not in i:
                    value = self.get(key)
                    #also get values from sort table, i.e. numberof values
                    if not value and  self.sort and hasattr(self.sort, key):
                        value = getattr(self.sort, key)
                    if value:
                        i[key] = value

        if 'reviews' in i:
            i['reviews'] = self.reviews()
            if not i['reviews']:
                del i['reviews']
        if 'cast' in i and isinstance(i['cast'][0], basestring):
            i['cast'] = [i['cast']]
        if 'cast' in i and isinstance(i['cast'][0], list):
            i['cast'] = map(lambda x: {'actor': x[0], 'character': x[1]}, i['cast'])

        if 'connections' in i:
            i['connections'] = self.expand_connections()

        if not keys or 'posterRatio' in keys:
            i['posterRatio'] = self.poster_width / self.poster_height


        streams = self.streams()
        i['durations'] = [s.duration for s in streams]
        i['duration'] = sum(i['durations'])
        i['parts'] = len(i['durations'])
        if i['parts']:
            i['videoRatio'] = streams[0].aspect_ratio

        #only needed by admins
        if keys and 'posters' in keys:
            i['posters'] = self.get_posters()

        frames = self.get_frames()
        if keys and 'frames' in keys:
            i['frames'] = frames

        selected_frame = filter(lambda f: f['selected'], frames)
        if selected_frame:
            i['posterFrame'] = selected_frame[0]['position']
        elif self.poster_frame != -1.0:
            i['posterFrame'] = self.poster_frame

        if keys:
            info = {}
            for key in keys:
                if key in i:
                    info[key] = i[key]
            return info
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
            if value not in ('', None):
                if isinstance(value, basestring):
                    value = value.strip()
                f.value = value
                f.save()
            else:
                f.delete()

        for key in settings.CONFIG['itemKeys']:
            if key.get('find'):
                i = key['id']
                if i == 'title':
                    save(i, u'\n'.join([self.get('title', 'Untitled'),
                                        self.get('original_title', '')]))
                elif i == 'filename':
                    save(i,
                        '\n'.join([os.path.join(f.folder, f.name) for f in self.files.all()]))
                elif key['type'] == 'layer':
                    qs = Annotation.objects.filter(layer__name=i, item=self).order_by('start')
                    save(i, '\n'.join([l.value for l in qs]))
                elif i != '*' and i not in self.facet_keys:
                    value = self.get(i)
                    if isinstance(value, list):
                        value = u'\n'.join(value)
                    save(i, value)

        for key in self.facet_keys:
            if key == 'character':
                values = self.get('cast', '')
                if values:
                    if isinstance(values[0], basestring):
                        values = [values]
                    if isinstance(values[0], list):
                        values = map(lambda x: {'actor': x[0], 'character': x[1]}, values)
                    values = [i['character'] for i in values]
            elif key == 'name':
                values = []
                for k in map(lambda x: x['id'],
                               filter(lambda x: x.get('sort') == 'person',
                                      settings.CONFIG['itemKeys'])):
                    values += self.get(k, [])
            else:
                values = self.get(key, '')
            if isinstance(values, list):
                save(key, '\n'.join(values))
            else:
                save(key, values)

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
            'parts',
            'published',
            'modified',
            'popularity',
        )

        for key in filter(lambda k: 'columnWidth' in k, settings.CONFIG['itemKeys']):
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
        s.words = sum([len(a.value.split()) for a in self.annotations.all()])

        s.clips = 0  #FIXME: get clips from all layers or something
        videos = self.files.filter(active=True, is_video=True)
        if videos.count() > 0:
            s.duration = sum([v.duration for v in videos])
            v = videos[0]
            s.resolution = v.width * v.height
            s.aspectratio = float(utils.parse_decimal(v.display_aspect_ratio))
            s.pixels = sum([v.pixels for v in videos])
            s.numberoffiles = self.files.all().count()
            s.parts = videos.count()
            s.size = sum([v.size for v in videos]) #FIXME: only size of movies?
            if s.duration:
                s.bitrate = s.size * 8 / s.duration
            else:
                s.bitrate = 0
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
            s.parts = 0

        if 'color' in self.data:
            s.hue, s.saturation, s.lightness = self.data['color']
        else:
            s.hue = None
            s.saturation = None
            s.brighness = None
        s.cuts = len(self.data.get('cuts', []))
        if s.duration:
            s.cutsperminute = s.cuts / (s.duration/60)
            s.wordsperminute = s.words / (s.duration / 60)
        else:
            s.cutsperminute = None 
            s.wordsperminute = None
        s.popularity = self.accessed.aggregate(Sum('accessed'))['accessed__sum']
        s.save()


    def update_facets(self):
        #FIXME: what to do with Unkown Director, Year, Country etc.
        for key in self.facet_keys + ['title']:
            current_values = self.get(key, [])
            if key == 'title':
                if current_values:
                    current_values = [current_values]
                else:
                    current_values = []
                ot = self.get('original_title')
                if ot:
                    current_values.append(ot)
            #FIXME: is there a better way to build name collection?
            if key == 'name':
                current_values = []
                for k in map(lambda x: x['id'],
                               filter(lambda x: x.get('sort') == 'person',
                                      settings.CONFIG['itemKeys'])):
                    current_values += self.get(k, [])
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
    def frame(self, position, height=128):
        offset = 0
        streams = self.streams()
        for stream in streams:
            if stream.duration + offset < position:
                offset += stream.duration
            else:
                position = position - offset
                height = min(height, stream.resolution)
                path = os.path.join(settings.MEDIA_ROOT, stream.path(),
                                    'frames', "%dp"%height, "%s.jpg"%position)
                if not os.path.exists(path) and stream.video:
                    extract.frame(stream.video.path, path, position, height)
                if not os.path.exists(path):
                    return None
                return path

    @property
    def timeline_prefix(self):
        videos = self.streams()
        if len(videos) == 1:
            return os.path.join(settings.MEDIA_ROOT, videos[0].path('timeline'))
        return os.path.join(settings.MEDIA_ROOT, self.path(), 'timeline')

    def get_files(self, user):
        #FIXME: limit by user
        return [f.json() for f in self.files.all()]

    def users_with_files(self):
        return User.objects.filter(volumes__files__file__item=self).distinct()

    def update_wanted(self):
        users = self.users_with_files()
        if users.filter(is_superuser=True).count()>0:
            files = self.files.filter(instances__volume__user__is_superuser=True)
            users = User.objects.filter(volumes__files__file__in=files,
                                        is_superuser=True).distinct()
        elif users.filter(is_staff=True).count()>0:
            files = self.files.filter(instances__volume__user__is_staff=True)
            users = User.objects.filter(volumes__files__file__in=files,
                                        is_staff=True).distinct()
        else:
            files = self.files.all()
        files = files.filter(is_video=True, instances__extra=False, instances__gt=0).order_by('part')
        folders = list(set([f.folder for f in files]))
        if len(folders) > 1:
            files = files.filter(folder=folders[0])
        files.update(wanted=True)
        self.files.exclude(id__in=files).update(wanted=False)

    def update_selected(self):
        files = archive.models.File.objects.filter(item=self,
                                                   streams__available=True,
                                                   streams__source=None)
        if files.count() == 0:
            return

        def get_level(users):
            if users.filter(is_superuser=True).count() > 0: level = 0
            elif users.filter(is_staff=True).count() > 0: level = 1
            else: level = 2
            return level

        current_users = User.objects.filter(volumes__files__file__in=self.files.filter(active=True)).distinct()
        current_level = get_level(current_users)

        users = User.objects.filter(volumes__files__file__in=files).distinct()
        possible_level = get_level(users)

        if possible_level < current_level:
            files = self.files.filter(instances__volume__user__in=users).order_by('part')
            #FIXME: this should be instance folders
            folders = list(set([f.folder
                                for f in files.filter(is_video=True, instances__extra=False)]))
            files = files.filter(folder__startswith=folders[0])
            files.update(active=True)
            self.rendered = False
            self.save()
            self.update_timeline()
        else:
            files = self.files.filter(instances__volume__user__in=current_users).order_by('part')
            #FIXME: this should be instance folders
            folders = list(set([f.folder
                                for f in files.filter(is_video=True, instances__extra=False)]))
            files = files.filter(folder__startswith=folders[0])
            if files.filter(active=False).count() > 0:
                files.update(active=True)
                self.rendered = False
                self.save()
                self.update_timeline()


    def make_torrent(self):
        base = self.path('torrent')
        base = os.path.abspath(os.path.join(settings.MEDIA_ROOT, base))
        if os.path.exists(base):
            shutil.rmtree(base)
        os.makedirs(base)

        base = self.path('torrent/%s' % self.get('title'))
        base = os.path.abspath(os.path.join(settings.MEDIA_ROOT, base))
        size = 0
        duration = 0.0
        streams = self.streams()
        if streams.count() == 1:
            url =  "%s/torrent/%s.webm" % (self.get_absolute_url(),
                                           quote(self.get('title').encode('utf-8')))
            video = "%s.webm" % base
            v = streams[0]
            os.symlink(v.video.path, video)
            size = v.video.size
            duration = v.duration
        else:
            url =  "%s/torrent/" % self.get_absolute_url()
            part = 1
            os.makedirs(base)
            for v in streams:
                video = "%s/%s.Part %d.webm" % (base, self.get('title'), part)
                part += 1
                os.symlink(v.video.path, video)
                size += v.video.size
                duration += v.duration
            video = base

        torrent = '%s.torrent' % base
        url = "http://%s%s" % (Site.objects.get_current().domain, url)
        meta = {
            'target': torrent,
            'url-list': url,
        }
        if duration:
            meta['playtime'] = ox.formatDuration(duration*1000)[:-4]

        #slightly bigger torrent file but better for streaming
        piece_size_pow2 = 15 #1 mbps -> 32KB pieces
        if size / duration >= 1000000:
            piece_size_pow2 = 16 #2 mbps -> 64KB pieces
        meta['piece_size_pow2'] = piece_size_pow2

        ox.torrent.createTorrent(video, settings.TRACKER_URL, meta)
        self.torrent.name = self.path('torrent/%s.torrent' % self.get('title'))
        self.save()

    def streams(self):
        return archive.models.Stream.objects.filter(source=None, available=True,
            file__item=self, file__is_video=True, file__active=True).order_by('file__part')

    def update_timeline(self, force=False):
        streams = self.streams()
        self.make_timeline()
        self.data['cuts'] = extract.cuts(self.timeline_prefix)
        self.data['color'] = extract.average_color(self.timeline_prefix)
        #extract.timeline_strip(self, self.data['cuts'], stream.info, self.timeline_prefix[:-8])
        self.select_frame()
        self.make_local_poster()
        self.make_poster()
        self.make_icon()
        if settings.CONFIG['video']['download']:
            self.make_torrent()
        self.load_subtitles()
        self.rendered = streams != []
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
        else:
            poster= self.path('poster.jpg')
            path = os.path.abspath(os.path.join(settings.MEDIA_ROOT, poster))
        for f in glob(path.replace('.jpg', '*.jpg')):
            os.unlink(f)

    def prefered_poster_url(self):
        self.update_poster_urls()
        service = self.poster_source
        if service and service != settings.URL:
            for u in self.poster_urls.filter(service=service).order_by('-height'):
                return u.url
        if not service:
            for service in settings.POSTER_PRECEDENCE:
                for u in self.poster_urls.filter(service=service).order_by('-height'):
                    return u.url
        return None

    def make_timeline(self):
        streams = self.streams()
        if len(streams) > 1:
            timelines = [s.timeline_prefix for s in self.streams()]
            join_timelines(timelines, self.timeline_prefix)

    def make_poster(self, force=False):
        if not self.poster or force:
            url = self.prefered_poster_url()
            if url:
                data = ox.net.readUrl(url)
                self.delete_poster()
                self.poster.save('poster.jpg', ContentFile(data))
                self.save()
            else:
                self.delete_poster()
                poster = self.make_local_poster()
                with open(poster) as f:
                    self.poster.save('poster.jpg', ContentFile(f.read()))

    def make_local_poster(self):
        poster = self.path('siteposter.jpg')
        poster = os.path.abspath(os.path.join(settings.MEDIA_ROOT, poster))

        frame = self.get_poster_frame_path()
        timeline = '%s.64.png' % self.timeline_prefix

        director = u', '.join(self.get('director', ['Unknown Director']))
        cmd = [settings.ITEM_POSTER,
               '-t', self.get('title').encode('utf-8'),
               '-d', director.encode('utf-8'),
               '-y', str(self.get('year', '')),
               '-p', poster
              ]
        if frame:
            cmd += [
               '-f', frame,
            ]
        if os.path.exists(timeline):
            cmd += [
               '-l', timeline,
            ]
        if settings.USE_IMDB:
            if len(self.itemId) == 7:
                cmd += ['-i', self.itemId]
            cmd += ['-o', self.oxdbId]
        else:
            cmd += ['-i', self.itemId]
        ox.makedirs(os.path.join(settings.MEDIA_ROOT,self.path()))
        p = subprocess.Popen(cmd)
        p.wait()
        for f in glob(poster.replace('.jpg', '*.jpg')):
            if f != poster:
                os.unlink(f)
        return poster

    def poster_frames(self):
        frames = []
        offset = 0
        for f in self.files.filter(active=True, is_video=True):
            for ff in f.frames.all():
                frames.append({
                    'position': offset + ff.position,
                    'path': ff.frame.path,
                    'width': ff.frame.width,
                    'height': ff.frame.height
                })
            offset += f.duration
        return frames

    def select_frame(self):
        frames = self.poster_frames()
        if frames:
            heat = [ox.image.getImageHeat(f['path']) for f in frames] 
            self.poster_frame = heat.index(max(heat))
            self.save()

    def get_poster_frame_path(self):
        frames = self.poster_frames()
        if self.poster_frame >= 0:
            if frames and len(frames) > int(self.poster_frame):
                return frames[int(self.poster_frame)]['path']
            else:
                size = settings.CONFIG['video']['resolutions'][0]
                return self.frame(self.poster_frame, size)

        if frames:
            return frames[int(len(frames)/2)]['path']

    def make_icon(self):
        frame = self.get_poster_frame_path()
        icon = self.path('icon.jpg')
        self.icon.name = icon
        timeline = '%s.64.png' % self.timeline_prefix
        cmd = [settings.ITEM_ICON,
           '-i', self.icon.path
        ]
        if os.path.exists(timeline):
           cmd += ['-l', timeline]
        if frame:
           cmd += ['-f', frame]
        p = subprocess.Popen(cmd)
        p.wait()
        self.save()
        icons = os.path.abspath(os.path.join(settings.MEDIA_ROOT, icon))
        icons = glob(icons.replace('.jpg', '*.jpg'))
        for f in filter(lambda p: not p.endswith('/icon.jpg'), icons):
            os.unlink(f)
        return icon

    def load_subtitles(self):
        layer = Layer.objects.get(name='subtitles')
        Annotation.objects.filter(layer=layer,item=self).delete()
        offset = 0
        language = ''
        languages = [f.language for f in self.files.filter(active=True, is_subtitle=True,
                                                           available=True)]
        if languages:
            if 'en' in languages:
                language = 'en'
            elif '' in languages:
                language = ''
            else:
                language = languages[0] 
        for f in self.files.filter(active=True, is_subtitle=True,
                                   available=True, language=language).order_by('part'):
                user = f.instances.all()[0].volume.user
                for data in f.srt(offset):
                    annotation = Annotation(
                        item=f.item,
                        layer=layer,
                        start=data['in'],
                        end=data['out'],
                        value=data['value'],
                        user=user
                    )
                    annotation.save()
                duration = self.files.filter(Q(is_audio=True)|Q(is_video=True)) \
                                     .filter(active=True, available=True, part=f.part)
                if duration:
                    duration = duration[0].duration
                else:
                    Annotation.objects.filter(layer=layer,item=self).delete()
                    break
                offset += duration
        self.update_find()

def delete_item(sender, **kwargs):
    i = kwargs['instance']
    i.delete_files()
pre_delete.connect(delete_item, sender=Item)

Item.facet_keys = []
for key in settings.CONFIG['itemKeys']:
    if 'autocomplete' in key and not 'autocompleteSortKey' in key:
        Item.facet_keys.append(key['id'])

Item.person_keys = []
for key in settings.CONFIG['itemKeys']:
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
table constructed based on info in settings.CONFIG['itemKeys']
'''
attrs = {
    '__module__': 'item.models',
    'item': models.OneToOneField('Item', related_name='sort', primary_key=True),
    'duration': models.FloatField(null=True, blank=True, db_index=True),
}
for key in filter(lambda k: 'columnWidth' in k, settings.CONFIG['itemKeys']):
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
    value = models.CharField(max_length=1000, db_index=True)
    value_sort = models.CharField(max_length=1000, db_index=True)

    def __unicode__(self):
        return u"%s=%s" % (self.key, self.value)

    def save(self, *args, **kwargs):
        if not self.value_sort:
            self.value_sort = utils.sort_string(self.value)
        super(Facet, self).save(*args, **kwargs)


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
