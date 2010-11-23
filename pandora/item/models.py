# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from datetime import datetime
import os.path
import math
import random
import re
import subprocess
import unicodedata
from glob import glob

from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.utils import simplejson as json
from django.conf import settings

from ox.django import fields
import ox
from ox import stripTags
from ox.normalize import canonicalTitle, canonicalName
from firefogg import Firefogg

import managers
import load
import utils
from archive import extract


class Bin(models.Model):
    name = models.CharField(null=True, max_length=255, unique=True)
    title = models.CharField(null=True, max_length=255)
	#text, string, string from list(fixme), event, place, person
    type = models.CharField(null=True, max_length=255)
    position = models.IntegerField(default=0)

	overlapping = models.BooleanField(default=True)
	enabled = models.BooleanField(default=True)

	enabled = models.BooleanField(default=True)
	public = models.BooleanField(default=True)   #false=users only see there own bins
	subtitle = models.BooleanField(default=True) #bis can be displayed as subtitle, only one bin

	find = models.BooleanField(default=True)
	#words / item duration(wpm), total words, cuts per minute, cuts, number of layers, number of layers/duration
    sort = models.CharField(null=True, max_length=255)

    def properties(self):
        p = {}
        if self.find:
            p[self.name] = {'type': 'bin', 'find': True}
        if self.sort:
            print 'FIXME: need to add sort stuff'
        return p

properties = {
    'title': {'type': 'string', 'sort': 'title', 'find': True},
    'director': {'type': 'person', 'array': True, 'sort': 'string', 'find': True, 'group': True},
    'country': {'type': 'string', 'array': True, 'sort': 'sring', 'find': True, 'group': True},
    'year': {'type': 'string', 'sort': 'string', 'find': True, 'group': True},
    'language': {'type': 'string', 'array': True, 'sort': 'string', 'find': True, 'group': True},
    'runtime': {'type': 'integer', 'sort': 'integer'},
    'writer': {'type': 'person', 'array': True, 'sort': 'string', 'find': True},
    'producer': {'type': 'person', 'array': True,  'sort': 'string', 'find': True},
    'cinematographer': {'type': 'person', 'array': True, 'sort': 'string', 'find': True},
    'editor': {'type': 'person', 'array': True, 'sort': 'string', 'find': True},
    'actors': {'type': 'role', 'array': True, 'sort': 'length', 'find': True},
    'genre': {'type': 'string', 'array': True, 'sort': 'length', 'find': True, 'group': True},
    'keywords': {'type': 'string', 'array': True, 'sort': 'length', 'find': True},
    'summary': {'type': 'title', 'sort': 'length', 'find': True},
    'trivia': {'type': 'title', 'sort': 'length', 'find': True},
    'releasedate': {'type': 'date', 'sort': 'date', 'find': True},
    'runtime': {'type': 'integer', 'sort': 'integer', 'totals': True},

    'budget': {'type': 'float', 'sort': 'float'},
    'gross': {'type': 'float', 'sort': 'float'},
    'profit': {'type': 'float', 'sort': 'float'},

    'rating': {'type': 'integer', 'sort': 'integer'},
    'votes': {'type': 'integer', 'sort': 'integer'},
    'published': {'type': 'date', 'sort': 'date'},
    'modified': {'type': 'date', 'sort': 'date'},
    'popularity': {'type': 'date', 'sort': 'date'},

    #file properties // are those even configurable? think not
    'aspectratio': {'type': 'faction', 'sort': 'float'},
    'duration': {'type': 'float', 'sort': 'float', 'totals': True, "admin": True},
    'color': {'type': 'color', 'sort': 'color'},
    'saturation': {'type': 'integer', 'sort': 'integer'},
    'brightness': {'type': 'integer', 'sort': 'integer'},
    'volume': {'type': 'integer', 'sort': 'integer'},
    'resolution': {'type': 'integer', 'array': True, 'sort': 'integer'}, #FIXME
    'pixels': {'type': 'integer', 'sort': 'string', 'totals': True},
    'size': {'type': 'title', 'sort': 'string', 'totals': True, 'admin': True},
    'bitrate': {'type': 'title', 'sort': 'string'},
    'files': {'type': 'title', 'sort': 'string', 'totals': True, 'admin': True},
    'filename': {'type': 'title', 'sort': 'string'},

    #Layer properties // those need to be defined with bins
    'dialog': {'type': 'title', 'find': True},
    #'clips': {'type': 'title', 'sort': 'string'},
    #'cuts': {'type': 'title', 'sort': 'string'},
    'cutsperminute': {'type': 'integer', 'title': 'Cuts per minute', 'sort': 'string'},
    'words': {'type': 'title', 'sort': 'string'},
    'wordsperminute': {'type': 'integer','title': 'Words per minute', 'sort': 'string'},
}

def siteJson():
	r = {}
	r['findKeys'] = [{"id": "all", "title": "All"}]
	for k in properties:
		i = properties[k]
		if i.get('find', False):
		    f = {"id": k, "title": i.get('title', k.capitalize())}
		    if i.get('autocomplete', False):
			    f['autocomplete'] = True
		    r['findKeys'].append(f)
	r['groups'] = filter(lambda k: properties[k].get('group', False), properties.keys())
    r['itemViews'] = [
        {"id": "info", "title": "Info"},
        {"id": "statistics", "title": "Statistics"},
        {"id": "clips", "title": "Clips"},
        {"id": "timeline", "title": "Timeline"},
        {"id": "map", "title": "Map"},
        {"id": "calendar", "title": "Calendar"},
        {"id": "files", "title": "Files", "admin": True}
    ]
    r['listViews'] = [
        {"id": "list", "title": "as List"},
        {"id": "icons", "title": "as Icons"},
        {"id": "info", "title": "with Info"},
        {"id": "clips", "title": "with Clips"},
        {"id": "timelines", "title": "with Timelines"},
        {"id": "maps", "title": "with Maps"},
        {"id": "calendars", "title": "with Calendars"},
        {"id": "clip", "title": "as Clips"},
        {"id": "map", "title": "on Map"},
        {"id": "calendar", "title": "on Calendar"}
    ]
    r['site'] = {
        "name": settings.SITENAME,
        "id": settings.SITEID,
        "url": settings.URL
    }
    r['sections'] = [
        {"id": "history", "title": "History"},
        {"id": "lists", "title": "My Lists"},
        {"id": "public", "title": "Public Lists"},
        {"id": "featured", "title": "Featured Lists"}
    ]
	r['sortKeys'] = []
	for k in properties:
		i = properties[k]
		if 'sort' in i:
			f = {
				"id": k,
				"title": i.get('title', k.capitalize()),
				"operator": i.get('operator', ''),
				"align": i.get('align', 'left'),
				"width": i.get('width', 180),
			}
			if not i.get('removable', True):
				f['removable'] = False
			r['sortKeys'].append(f)

	r['totals'] = [{"id": "items"}]
	for k in properties:
		i = properties[k]
		if i.get('totals', False):
			f = {"id": k}
			if i.get('admin', False):
				f['admin'] = True
			r['totals'].append(f)

    #FIXME: defaults should also be populated from properties
    r["user"] = {
        "group": "guest",
        "preferences": {},
        "ui": {
            "columns": ["id", "title", "director", "country", "year", "language", "genre"],
            "findQuery": {"conditions": [], "operator": ""},
            "groupsQuery": {"conditions": [], "operator": "|"},
            "groupsSize": 128,
            "itemView": "info",
            "listQuery": {"conditions": [], "operator": ""},
            "listsSize": 192,
            "listView": "icons",
            "sections": ["history", "lists", "public", "featured"],
            "showGroups": True,
            "showInfo": True,
            "showLists": True,
            "showMovies": True,
            "sort": [
                {"key": "director", "operator": ""}
            ],
            "theme": "classic"
        },
        "username": ""
    }
	return r

def getItem(info):
    '''
        info dict with:
            imdbId, title, director, episode_title, season, series
    '''
    if 'imdbId' in info and info['imdbId']:
        try:
            item = Item.objects.get(itemId=info['imdbId'])
        except Item.DoesNotExist:
            item = Item(itemId=info['imdbId'])
            if 'title' in info and 'directors' in info:
                item.external_data = {
                    'title': info['title'],
                    'directors': info['directors'],
                    'year': info.get('year', '')
                }
            #FIXME: this should be done async
            #item.save()
            #tasks.updateImdb.delay(item.itemId)
            item.updateImdb()
            tasks.updatePoster.delay(item.itemId)
    else:
        q = Item.objects.filter(find__title=info['title'])
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
                    'directors': info['directors'],
                    'year': info.get('year', '')
                }
                item.itemId = info['oxdbId']

                for key in ('episode_title', 'series_title', 'season', 'episode'):
                    if key in info and info[key]:
                        item.data[key] = info[key]
                item.save()
    return item

class ItemProperty(models.Model):
    name = models.CharField(null=True, max_length=255, unique=True)
    title = models.CharField(null=True, max_length=255)
	#text, string, string from list(fixme), event, place, person
    type = models.CharField(null=True, max_length=255)
    array = models.BooleanField(default=False)
    position = models.IntegerField(default=0)

	#sort values: title, string, integer, float, date
    sort = models.CharField(null=True, max_length=255)

    totals = models.BooleanField(default=False)
    admin = models.BooleanField(default=False)

	def json(self):
		j = {}
		for key in ('type', 'sort', 'title', 'array', 'totals', 'admin'):
			value = getattr(self, key)
			if value:
				j[key] = value
		return j

class Item(models.Model):
    person_keys = ('director', 'writer', 'producer', 'editor', 'cinematographer', 'actor', 'character')
    facet_keys = person_keys + ('country', 'language', 'genre', 'keyword')

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    published = models.DateTimeField(default=datetime.now, editable=False)

    #only items that have data from files are available,
    #this is indicated by setting available to True 
    available = models.BooleanField(default=False, db_index=True)

    itemId = models.CharField(max_length=128, unique=True, blank=True)
    oxdbId = models.CharField(max_length=42, unique=True, blank=True)

    objects = managers.ItemManager()

    def get(self, key, default=None):
        if self.data and key in self.data:
            return self.data[key]
        if self.external_data and key in self.external_data:
            return self.external_data[key]
        return default

    def editable(self, user):
        #FIXME: make permissions work
        return False

    def edit(self, data):
        #FIXME: how to map the keys to the right place to write them to?
		for key in data:
			if key != 'id':
				setattr(self.data, key, data[key])
        self.oxdb.save()
        self.save()

    def reviews(self):
        reviews = self.get('reviews', [])
        whitelist = [w for w in ReviewWhitelist.objects.all()]
        _reviews = {}
        for r in reviews:
            for w in whitelist:
                if w.url in r[0]:
                    _reviews[w.title] = r[0]
        return _reviews

    external_data = fields.DictField(default={}, editable=False)
    data = fields.DictField(default={}, editable=False)

    json = fields.DictField(default={}, editable=False)

    def updateImdb(self):
        if len(self.itemId) == 7:
            self.external_data = ox.web.imdb.Imdb(self.itemId)
            self.save()

    poster = models.ImageField(default=None, blank=True, upload_to=lambda m, x: os.path.join(itemid_path(m.itemId), "poster.jpg"))
    poster_url = models.TextField(blank=True)
    poster_height = models.IntegerField(default=0)
    poster_width = models.IntegerField(default=0)

    poster_frame = models.FloatField(default=-1)

    #stream related fields
    stream_aspect = models.FloatField(default=4/3)

    def __unicode__(self):
        year = self.get('year')
        if year:
            return u'%s (%s)' % (self.get('title'), self.get('year'))
        return self.get('title')

    def get_absolute_url(self):
        return '/timeline#%s' % self.itemId

    def save(self, *args, **kwargs):
        self.json = self.get_json()
        if not self.oxdbId:
            self.oxdbId = self.oxid()

        if self.poster:
            self.poster_height = self.poster.height
            self.poster_width = self.poster.width
        else:
            self.poster_height = 128
            self.poster_width = 80
        super(Item, self).save(*args, **kwargs)
        self.updateFind()
        self.updateSort()
        self.updateFacets()

    def delete(self, *args, **kwargs):
        self.delete_poster()
        for f in glob("%s*"%self.timeline_prefix):
            os.unlink(f)
        for f in glob("%sstrip*"%self.timeline_prefix[:-8]):
            os.unlink(f)
        super(Item, self).delete(*args, **kwargs)

    def mergeWith(self, other):
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
        #FIXME: should this really happen for layers?
        for l in self.layer.all():
            l.items.remove(self)
            if l.items.filter(id=other.id) == 0:
                l.items.add(other)
        if hasattr(self, 'files'):
            for f in self.files.all():
                f.item = other
                f.save()
        self.delete()
        other.save()

    '''
        JSON cache related functions
    '''
    _public_fields = {
        'itemId': 'id',
        'title':   'title',
        'year':    'year',

        'runtime':    'runtime',
        'release_date':    'release_date',

        'countries': 'country',
        'directors': 'director',
        'writers': 'writer',
        'editors': 'editor',
        'producers': 'producer',
        'cinematographer': 'cinematographer',
        'languages': 'language',
        'genres': 'genre',
        'keywords': 'keyword',
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
        #FIXME: subtitles should be stored in Layer
        qs = self.files.filter(is_subtitle=True, is_main=True, available=True)
        if qs.count()>0:
            layers['subtitles'] = qs[0].srt()
        return layers

    def get_json(self, fields=None):
        item = {}
        for key in self._public_fields:
            pub_key = self._public_fields.get(key, key)
            if not fields or pub_key in fields:
                if hasattr(self, key):
                    value = getattr(self, key)
                else:
                    value = self.get(key)
                if callable(value):
                    item[pub_key] = value()
                else:
                    item[pub_key] = value
        if not fields:
            item['stream'] = self.get_stream()
        item['poster'] = self.get_poster()
        item['posters'] = self.get_posters()
        if fields:
            for f in fields:
                if f.endswith('.length') and f[:-7] in ('cast', 'genre', 'trivia'):
                    item[f] = getattr(self.sort, f[:-7])
        return item

    def fields(self):
        fields = {}
        for f in self._meta.fields:
            if f.name in self._public_fields:
                fields[f.name] = {}
                fields[f.name]['order'] = 'desc'
                fields[f.name]['type'] = type(f)
        return fields
    fields = classmethod(fields)

    def oxid(self):
        return utils.oxid(self.get('title', ''), self.get('directors', []), str(self.get('year', '')),
                          self.get('series title', ''), self.get('episode title', ''),
                          self.get('season', ''), self.get('episode', ''))


    '''
        Search related functions
    '''
    def updateFind(self):
        def save(key, value):
            f, created = ItemFind.objects.get_or_create(item=self, key=key)
            if value not in ('', '||'):
                f.value = value
                f.save()
            else:
                f.delete()

        save('title', '\n'.join([self.get('title'), self.get('original_title', '')]))
        
        #FIXME: filter us/int  title
        #f.title += ' '.join([t.title for t in self.alternative_titles()])

        save('year', self.get('year', ''))

        for key in self.facet_keys:
            if key == 'actor':
                values = [i[0] for i in self.get('actor', [])]
            elif key == 'character':
                values = [i[1] for i in self.get('actor', [])]
            else:
                values = self.get(utils.plural_key(key), [])
            save(key, '|%s|'%'|'.join(values))
        save('summary', self.get('plot', '') + self.get('plot_outline', ''))
        save('trivia', ' '.join(self.get('trivia', [])))
        save('location', '|%s|'%'|'.join(self.get('filming_locations', [])))

        #FIXME:
        #f.dialog = 'fixme'
        save('dialog', '\n'.join([l.value for l in Layer.objects.filter(type='subtitle', item=self).order_by('start')]))

        #FIXME: collate filenames
        #f.filename = self.filename
        all_find = ' '.join([f.value for f in ItemFind.objects.filter(item=self).exclude(key='all')])
        save('all', all_find)

    def updateSort(self):
        try:
            s = self.sort
        except ItemSort.DoesNotExist:
            s = ItemSort(item=self)

        def sortNames(values):
            sort_value = ''
            if values:
                sort_value = '; '.join([getPersonSort(name) for name in values])
            if not sort_value:
                sort_value = ''
            return sort_value

        #title
        title = canonicalTitle(self.get('title'))
        s.title = utils.sort_title(title)

        s.country = ','.join(self.get('countries', []))
        s.year = self.get('year', '')

        for key in self.person_keys:
            setattr(s, key, sortNames(self.get(utils.plural_key(key), [])))

        for key in ('language', 'country'):
            setattr(s, key, ','.join(self.get(utils.plural_key(key), [])))

        s.runtime = self.get('runtime', 0)

        for key in ('keywords', 'genres', 'cast', 'summary', 'trivia', 'connections'):
            setattr(s, key, len(self.get(key, '')))
            
        s.itemId = self.itemId.replace('0x', 'xx')
        s.rating = self.get('rating', -1)
        s.votes = self.get('votes', -1)

        # data from related subtitles
        s.scenes = 0 #FIXME
        s.dialog =  0 #FIXME
        s.words =  0 #FIXME
        s.wpm =    0 #FIXME
        s.risk =   0 #FIXME
        # data from related files
        s.duration = 0 #FIXME
        s.resolution = 0 #FIXME
        s.aspectratio = 0 #FIXME
        s.bitrate = 0 #FIXME
        s.pixels = 0 #FIXME
        s.filename = 0 #FIXME
        s.files = 0 #FIXME
        s.size = 0 #FIXME

        for key in ('title', 'language', 'country') + self.person_keys:
            setattr(s, '%s_desc'%key, getattr(s, key))
            if not getattr(s, key):
                setattr(s, key, u'zzzzzzzzzzzzzzzzzzzzzzzzz')
        if not s.year:
            s.year_desc = '';
            s.year = '9999';
        #FIXME: also deal with number based rows like genre, keywords etc
        s.save()

    def updateFacets(self):
        #FIXME: what to do with Unkown Director, Year, Country etc. 
        for key in self.facet_keys:
            if key == 'actor':
                current_values = [i[0] for i in self.get('actor', [])]
            elif key == 'character':
                current_values = [i[1] for i in self.get('actor', [])]
            else:
                current_values = self.get(utils.plural_key(key), [])
            saved_values = [i.value for i in Facet.objects.filter(item=self, key=key)]
            removed_values = filter(lambda x: x not in current_values, saved_values)
            if removed_values:
                Facet.objects.filter(item=self, key=key, value__in=removed_values).delete()
            for value in current_values:
                if value not in saved_values:
                    value_sort = value
                    if key in self.person_keys:
                        value_sort = getPersonSort(value)
                    f = Facet(key=key, value=value, value_sort=value_sort)
                    f.item = self
                    f.save()
        year = self.get('year', None)
        if year:
            f, created = Facet.objects.get_or_create(key='year', value=year, value_sort=year, item=self)
        else:
            Facet.objects.filter(item=self, key='year').delete()

    '''
        Video related functions
    '''
    def frame(self, position, width=128):
        stream = self.streams.filter(profile=settings.VIDEO_PROFILE+'.webm')[0]
        path = os.path.join(settings.MEDIA_ROOT, itemid_path(self.itemId), 'frames', "%d"%width, "%s.jpg"%position)
        if not os.path.exists(path):
            extract.frame(stream.video.path, path, position, width)
        return path

    @property
    def timeline_prefix(self):
        return os.path.join(settings.MEDIA_ROOT, itemid_path(self.itemId), 'timeline')

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

    def updateStreams(self):
        files = {}
        for f in self.main_videos():
            files[utils.sort_title(f.name)] = f.video.path
        
        #FIXME: how to detect if something changed?
        if files:
            stream, created = Stream.objects.get_or_create(item=self, profile='%s.webm' % settings.VIDEO_PROFILE)
            stream.video.name = stream_path(stream)
            cmd = []
            print files
            for f in sorted(files):
                cmd.append('+')
                cmd.append(files[f])
            if not os.path.exists(os.path.dirname(stream.video.path)):
                os.makedirs(os.path.dirname(stream.video.path))
            cmd = [ 'mkvmerge', '-o', stream.video.path ] + cmd[1:]
            #print cmd
            p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            #p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
            p.wait()
            stream.save()

            if 'video' in stream.info:
                extract.timeline(stream.video.path, self.timeline_prefix)
                self.stream_aspect = stream.info['video'][0]['width']/stream.info['video'][0]['height']
                self.data['cuts'] = extract.cuts(self.timeline_prefix)
                self.data['average_color'] = extract.average_color(self.timeline_prefix)
                #extract.timeline_strip(self, self.data['cuts'], stream.info, self.timeline_prefix[:-8])

            stream.extract_derivatives()
            #something with poster
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

    def download_poster(self, force=False):
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
        for f in self.main_videos():
            for frame in f.frames.all():
                path = os.path.join(itemid_path(self.itemId), 'poster.pandora.%s.%s.jpg'%(part, frame.position))
                path = os.path.abspath(os.path.join(settings.MEDIA_ROOT, path))
                posters[path] = frame.frame.path
            part += 1
        return posters

    def make_local_posters(self):
        posters = self.local_posters()
        for poster in posters:
            frame = posters[poster]
            timeline = os.path.join(itemid_path(self.itemId), 'timeline.64.png')
            timeline = os.path.abspath(os.path.join(settings.MEDIA_ROOT, timeline))
            cmd = [settings.ITEM_POSTER,
                   '-t', self.get('title'),
                   '-d', ', '.join(self.get('directors', ['Unknown Director'])),
                   '-y', str(self.get('year', '')),
                   '-f', frame,
                   '-l', timeline,
                   '-p', poster
                  ]
            if len(self.itemId) == 7:
                cmd += ['-i', self.itemId]
            cmd += ['-o', self.oxdbId]
            p = subprocess.Popen(cmd)
            p.wait()
        return posters.keys()

class ItemFind(models.Model):
    """
        used to find items,
        item.updateFind populates this table
        its used in manager.ItemManager
    """
    class Meta:
        unique_together = ("item", "key")

    item = models.ForeignKey('Item', related_name='find', db_index=True)
    key = models.CharField(max_length=200, db_index=True)
    value = models.TextField(blank=True)

class ItemSort(models.Model):
    """
        used to sort items, all sort values are in here
    """
    item = models.OneToOneField('Item', related_name='sort', primary_key=True)

    title = models.CharField(max_length=1000, db_index=True)
    director = models.TextField(blank=True, db_index=True)
    country = models.TextField(blank=True, db_index=True)
    year = models.CharField(max_length=4, db_index=True)

    producer = models.TextField(blank=True, db_index=True)
    writer = models.TextField(blank=True, db_index=True)
    editor = models.TextField(blank=True, db_index=True)
    cinematographer = models.TextField(blank=True, db_index=True)

    language = models.TextField(blank=True, db_index=True)
    runtime = models.IntegerField(blank=True, null=True, db_index=True)

    keywords = models.IntegerField(blank=True, db_index=True)
    genre = models.TextField(blank=True, db_index=True)
    cast = models.IntegerField(blank=True, db_index=True)
    summary = models.IntegerField(blank=True, db_index=True)
    trivia = models.IntegerField(blank=True, db_index=True)
    connections = models.IntegerField(blank=True, db_index=True)

    rating = models.FloatField(blank=True, db_index=True)
    votes = models.IntegerField(blank=True, db_index=True)
    scenes = models.IntegerField(blank=True, db_index=True)
    dialog = models.IntegerField(null=True, blank=True, db_index=True)
    words = models.IntegerField(null=True, blank=True, db_index=True)
    wpm = models.IntegerField('Words per Minute', null=True, blank=True, db_index=True)
    risk = models.IntegerField(null=True, blank=True, db_index=True)

    itemId = models.CharField('ID', max_length=128, blank=True, db_index=True)

    duration = models.FloatField(default=-1, db_index=True)
    resolution = models.IntegerField(blank=True, db_index=True)
    aspectratio = models.IntegerField('Aspect Ratio', blank=True, db_index=True)
    bitrate = models.IntegerField(blank=True, db_index=True)
    pixels = models.BigIntegerField(blank=True, db_index=True)
    filename = models.IntegerField(blank=True, db_index=True)
    files = models.IntegerField(blank=True, db_index=True)
    size = models.BigIntegerField(blank=True, db_index=True)

    #required to move empty values to the bottom for both asc and desc sort
    title_desc = models.CharField(max_length=1000, db_index=True)
    director_desc = models.TextField(blank=True, db_index=True)
    country_desc = models.TextField(blank=True, db_index=True)
    year_desc = models.CharField(max_length=4, db_index=True)

    producer_desc = models.TextField(blank=True, db_index=True)
    writer_desc = models.TextField(blank=True, db_index=True)
    editor_desc = models.TextField(blank=True, db_index=True)
    cinematographer_desc = models.TextField(blank=True, db_index=True)

    language_desc = models.TextField(blank=True, db_index=True)

    _private_fields = ('id', 'item')
    #return available sort fields
    #FIXME: should return mapping name -> verbose_name
    def fields(self):
        fields = []
        for f in self._meta.fields:
            if f.name not in self._private_fields:
                name = f.verbose_name
                name = name[0].capitalize() + name[1:]
                fields.append(name)
        return tuple(fields)
    fields = classmethod(fields)

class Facet(models.Model):
    item = models.ForeignKey('Item', related_name='facets')
    key = models.CharField(max_length=200, db_index=True)
    value = models.CharField(max_length=200)
    value_sort = models.CharField(max_length=200)

    def save(self, *args, **kwargs):
        if not self.value_sort:
            self.value_sort = self.value
        super(Facet, self).save(*args, **kwargs)

def getPersonSort(name):
    person, created = Person.objects.get_or_create(name=name)
    name_sort = unicodedata.normalize('NFKD', person.name_sort)
    return name_sort

class Person(models.Model):
    name = models.CharField(max_length=200)
    name_sort = models.CharField(max_length=200)

    #FIXME: how to deal with aliases
    aliases = fields.TupleField(default=[])


    imdbId = models.CharField(max_length=7, blank=True)

    class Meta:
        ordering = ('name_sort', )

    def __unicode__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.name_sort:
            self.name_sort = ox.normalize.canonicalName(self.name)
        super(Person, self).save(*args, **kwargs)

    def get_or_create(model, name, imdbId=None):
        if imdbId:
            q = model.objects.filter(name=name, imdbId=imdbId)
        else:
            q = model.objects.all().filter(name=name)
        if q.count() > 0:
            o = q[0]
        else:
            o = model.objects.create(name=name)
            if imdbId:
                o.imdbId = imdbId
            o.save()
        return o
    get_or_create = classmethod(get_or_create)

    def json(self):
        return self.name

class Place(models.Model):
    '''
        Places are named locations, they should have geographical information attached to them.
    '''

    name = models.CharField(max_length=200, unique=True)
    name_sort = models.CharField(max_length=200)
    manual = models.BooleanField(default=False)
    items = models.ManyToManyField(Item, related_name='places')

    #FIXME: how to deal with aliases
    aliases = fields.TupleField(default=[])

    #FIXME: geo data, is this good enough?
    lat_sw = models.FloatField(default=0)
    lng_sw = models.FloatField(default=0)
    lat_ne = models.FloatField(default=0)
    lng_ne = models.FloatField(default=0)
    lat_center = models.FloatField(default=0)
    lng_center = models.FloatField(default=0)
    area = models.FloatField(default=-1)

    class Meta:
        ordering = ('name_sort', )

    def __unicode__(self):
        return self.name

    def json(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.name_sort:
            self.name_sort = self.name

        #update center
        self.lat_center = ox.location.center(self.lat_sw, self.lat_ne)
        self.lng_center = ox.location.center(self.lng_sw, self.lng_ne)

        #update area
        self.area = location.area(self.lat_sw, self.lng_sw, self.lat_ne, self.lng_ne)

        super(Place, self).save(*args, **kwargs)

class Event(models.Model):
    '''
        Events are events in time that can be once or recurring,
        From Mondays to Spring to 1989 to Roman Empire
    '''
    name = models.CharField(null=True, max_length=255, unique=True)
    name_sort = models.CharField(null=True, max_length=255, unique=True)

    class Meta:
        ordering = ('name_sort', )

    #FIXME: how to deal with aliases
    aliases = fields.TupleField(default=[])

    #once|year|week|day
    recurring = models.IntegerField(default=0)

    #start yyyy-mm-dd|mm-dd|dow 00:00|00:00
    #end   yyyy-mm-dd|mm-dd|dow 00:00|00:01
    start = models.CharField(null=True, max_length=255)
    end = models.CharField(null=True, max_length=255)

    def save(self, *args, **kwargs):
        if not self.name_sort:
            self.name_sort = self.name
        super(Event, self).save(*args, **kwargs)

class ReviewWhitelist(models.Model):
    name = models.CharField(max_length=255, unique=True)
    url = models.CharField(max_length=255, unique=True)

class List(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User)
    name = models.CharField(max_length=255, unique=True)
    public = models.BooleanField(default=False)
    items = models.ManyToManyField(Item, related_name='lists', through='ListItem')

    def add(self, item):
        q = self.items.filter(id=item.id)
        if q.count() == 0:
            l = ListItem()
            l.list = self
            l.item = item
            l.save()

    def remove(self, item):
        self.ListItem.objects.all().filter(item=item, list=self).delete()

    def __unicode__(self):
        return u'%s (%s)' % (self.title, unicode(self.user))

    def editable(self, user):
        #FIXME: make permissions work
        if self.user == user or user.has_perm('Ox.admin'):
            return True
        return False

class ListItem(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    list = models.ForeignKey(List)
    item = models.ForeignKey(Item)

    def __unicode__(self):
        return u'%s in %s' % (unicode(self.item), unicode(self.list))

class Layer(models.Model):
    #FIXME: here having a item,start index would be good
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User)
    item = models.ForeignKey(Item)

    #seconds
    start = models.FloatField(default=-1)
    stop = models.FloatField(default=-1)

    type = models.CharField(blank=True, max_length=255)
    value = models.TextField()
    
    #FIXME: relational layers, Locations, clips etc
    #location = models.ForeignKey('Location', default=None)

    def editable(self, user):
        if user.is_authenticated():
            if obj.user == user.id or user.has_perm('0x.admin'):
                return True
            if user.groups.filter(id__in=obj.groups.all()).count() > 0:
                return True
        return False

class Collection(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    users = models.ManyToManyField(User, related_name='collections')
    name = models.CharField(blank=True, max_length=2048)
    subdomain = models.CharField(unique=True, max_length=2048)
    items = models.ForeignKey(Item)

    def editable(self, user):
        return self.users.filter(id=user.id).count() > 0

def itemid_path(h):
    return os.path.join('items', h[:2], h[2:4], h[4:6], h[6:])

def stream_path(stream):
    return os.path.join(itemid_path(stream.item.itemId), stream.profile)

class Stream(models.Model):
    class Meta:
        unique_together = ("item", "profile")

    item = models.ForeignKey(Item, related_name='streams')
    profile = models.CharField(max_length=255, default='96p.webm')
    video = models.FileField(default=None, blank=True, upload_to=lambda f, x: stream_path(f))
    source = models.ForeignKey('Stream', related_name='derivatives', default=None, null=True)
    available = models.BooleanField(default=False)
    info = fields.DictField(default={})

    #def __unicode__(self):
    #    return self.video

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

    def __unicode__(self):
        return u"%s (%s)" % (self.profile, self.item)

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

