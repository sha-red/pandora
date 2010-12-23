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
import tasks
from archive import extract

from annotaion.models import Annotation, Layer
from person.models import get_name_sort, Person


def siteJson():
	r = {}
	r['findKeys'] = [{"id": "all", "title": "All"}]
	for p in Property.objects.all():
		if p.find:
		    title = p.title
		    if not title:
		        title = p.name.capitalize()
		    f = {"id": p.name, "title": title}
		    f['autocomplete'] = p.autocomplete
		    r['findKeys'].append(f)
		    
	r['groups'] = [p.name for p in Property.objects.filter(group=True)]
	r['layers'] = [l.json() for l in Layer.objects.all()]

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
	for p in Property.objects.exclude(sort=''):
	    title = p.title
	    if not title:
	        title = p.name.capitalize()

		f = {
			"id": p.name,
			"title": title,
			"operator": p.operator,
			"align": p.align,
			"width": p.width,
		}
		if not p.removable:
			f['removable'] = False
		r['sortKeys'].append(f)
	r['sortKeys'].append([{"id": "id", "title": "ID", "operator": "", "align": "left", "width": 90}])

	r['totals'] = [{"id": "items"}]
	for p in Property.objects.filter(totals=True):
	    f = {'id': p.name, 'admin': p.admin}
	    r['totals'].append(f)

    #FIXME: defaults should also be populated from properties
    r["user"] = {
        "group": "guest",
        "preferences": {},
        "ui": {
            "columns": ["id"] + [p.name for p in Property.objects.filter(default=True)],
            "findQuery": {"conditions": [], "operator": ""},
            "groupsQuery": {"conditions": [], "operator": "|"},
            "groupsSize": 128,
            "itemView": "timeline",
            "listQuery": {"conditions": [], "operator": ""},
            "listsSize": 192,
            "listView": "icons",
            "sections": ["history", "lists", "public", "featured"],
            "showGroups": True,
            "showInfo": True,
            "showLists": True,
            "showMovies": True,
            "sort": settings.DEFAULT_SORT,
            "theme": settings.DEFAULT_THEME
        },
        "username": ""
    }
	return r

def get_item(info):
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
            item.save()
            tasks.update_imdb.delay(item.itemId)
            #item.update_imdb()
            tasks.update_poster.delay(item.itemId)
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
                    'directors': info['directors'],
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
    return item

class Property(models.Model):
    class Meta:
        ordering = ('position', )
        verbose_name_plural = "Properties"
               
    name = models.CharField(null=True, max_length=255, unique=True)
    title = models.CharField(null=True, max_length=255, blank=True)
	#text, string, string from list(fixme), event, place, person
    type = models.CharField(null=True, max_length=255)
    array = models.BooleanField(default=False)
    position = models.IntegerField(default=0)
    width = models.IntegerField(default=180)
    align = models.CharField(null=True, max_length=255, default='left')
    operator = models.CharField(null=True, max_length=5, default='', blank=True)
	default = models.BooleanField('Enabled by default', default=False)
	removable = models.BooleanField(default=True)

	#sort values: title, string, integer, float, date
    sort = models.CharField(null=True, max_length=255, blank=True)
	find = models.BooleanField(default=False)
	autocomplete = models.BooleanField(default=False)
	group = models.BooleanField(default=False)

    totals = models.BooleanField(default=False)
    admin = models.BooleanField(default=False)

    def __unicode__(self):
        if self.title:
            return self.title
        return self.name

	def json(self):
		j = {}
		for key in ('type', 'sort', 'title', 'array', 'totals', 'admin'):
			value = getattr(self, key)
			if value:
				j[key] = value
		return j

    def save(self, *args, **kwargs):
        if not self.title:
            self.title = self.name.capitalize()
        super(Property, self).save(*args, **kwargs)
    
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
    external_data = fields.DictField(default={}, editable=False)
    data = fields.DictField(default={}, editable=False)
    json = fields.DictField(default={}, editable=False)
    poster = models.ImageField(default=None, blank=True, upload_to=lambda i, x: i.path("poster.jpg"))
    poster_url = models.TextField(blank=True)
    poster_height = models.IntegerField(default=0)
    poster_width = models.IntegerField(default=0)
    poster_frame = models.FloatField(default=-1)
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
        _reviews = {}
        for r in reviews:
            for url in settings.REVIEW_WHITELIST:
                if url in r[0]:
                    _reviews[settings.REVIEW_WHITELIST[url]] = r[0]
        return _reviews

    def update_imdb(self):
        if len(self.itemId) == 7:
            self.external_data = ox.web.imdb.Imdb(self.itemId)
            self.save()

    def __unicode__(self):
        year = self.get('year')
        if year:
            return u'%s (%s)' % (self.get('title'), self.get('year'))
        return self.get('title')

    def get_absolute_url(self):
        return '/%s' % self.itemId

    def save(self, *args, **kwargs):
        self.json = self.get_json()
        self.oxdbId = self.oxdb_id()

        if self.poster:
            self.poster_height = self.poster.height
            self.poster_width = self.poster.width
        else:
            self.poster_height = 128
            self.poster_width = 80
        super(Item, self).save(*args, **kwargs)
        self.update_find()
        self.update_sort()
        self.update_facets()

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
    #FIXME: this should not be used
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
        #FIXME: subtitles should be stored in Annotation
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

    def oxdb_id(self):
        return utils.oxdb_id(self.get('title', ''), self.get('directors', []), str(self.get('year', '')),
                          self.get('season', ''), self.get('episode', ''),
                          self.get('episode_title', ''), self.get('episode_directors', ''), self.get('episode_year', ''))

    '''
        Search related functions
    '''
    def update_find(self):
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
        save('dialog', '\n'.join([l.value for l in Annotation.objects.filter(type='subtitle', item=self).order_by('start')]))

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
            sort_value = ''
            if values:
                sort_value = '; '.join([get_name_sort(name) for name in values])
            if not sort_value:
                sort_value = ''
            return sort_value

        #title
        title = canonicalTitle(self.get('title'))
        s.title = utils.sort_title(title)

        s.country = ','.join(self.get('countries', []))
        s.year = self.get('year', '')
        s.year_desc = s.year

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
        videos = self.main_videos()
        if len(videos) > 0:
            s.duration = sum([v.duration for v in videos])
            s.resolution = videos[0].width * videos[0].height
            s.aspectratio = int(1000 * utils.parse_decimal(v.display_aspect_ratio))
            #FIXME: should be average over all files
            if 'bitrate' in videos[0].info:
                s.bitrate = videos[0].info['bitrate']
            s.pixels = sum([v.pixels for v in videos])
            s.filename = ' '.join([v.name for v in videos])
            s.files = self.files.all().count()
            s.size = sum([v.size for v in videos]) #FIXME: only size of movies?
        else:
            s.duration = 0
            s.resolution = 0
            s.aspectratio = 0
            s.bitrate = 0
            s.pixels = 0
            s.filename = 0
            s.files = 0
            s.size = 0

        s.color = int(sum(self.data.get('color', [])))
        s.cuts = len(self.data.get('cuts', []))
        s.cutsperminute = s.cuts / (s.duration/60)
        for key in ('title', 'language', 'country') + self.person_keys:
            setattr(s, '%s_desc'%key, getattr(s, key))
            if not getattr(s, key):
                setattr(s, key, u'zzzzzzzzzzzzzzzzzzzzzzzzz')
        if not s.year:
            s.year_desc = '';
            s.year = '9999';
        #FIXME: also deal with number based rows like genre, keywords etc
        s.save()

    def update_facets(self):
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
        item.update_find populates this table
        its used in manager.ItemManager
    """
    class Meta:
        unique_together = ("item", "key")

    item = models.ForeignKey('Item', related_name='find', db_index=True)
    key = models.CharField(max_length=200, db_index=True)
    value = models.TextField(blank=True)

#FIXME: make sort based on site.json
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
    resolution = models.BigIntegerField(blank=True, db_index=True)
    aspectratio = models.IntegerField('Aspect Ratio', blank=True, db_index=True)
    bitrate = models.IntegerField(blank=True, db_index=True)
    pixels = models.BigIntegerField(blank=True, db_index=True)
    filename = models.CharField(max_length=1024, blank=True, db_index=True)
    files = models.IntegerField(blank=True, db_index=True)
    size = models.BigIntegerField(blank=True, db_index=True)
    color = models.IntegerField(blank=True, db_index=True)
    saturation = models.IntegerField(blank=True, db_index=True)
    brightness = models.IntegerField(blank=True, db_index=True)
    cuts = models.IntegerField(blank=True, db_index=True)
    cutsperminute = models.FloatField(blank=True, db_index=True)


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

