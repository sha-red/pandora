# -*- coding: utf-8 -*-

import json
import logging
import os
import re
import shutil
import subprocess
import tempfile
import unicodedata
import uuid
from datetime import datetime
from glob import glob
from urllib.parse import quote

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.temp import NamedTemporaryFile
from django.db import models, transaction, connection
from django.db.models import Q, Sum, Max
from django.db.models.signals import pre_delete
from django.utils import datetime_safe

import ox
from oxdjango.fields import JSONField, to_json
from oxdjango.sortmodel import get_sort_field
import ox.web.imdb
import ox.image

from . import managers
from . import utils
from . import tasks
from .timelines import join_tiles
from .data_api import external_data

from annotation.models import Annotation
from archive import extract
from clip.models import Clip, get_layers
from person.models import get_name_sort
from sequence.tasks import get_sequences
from title.models import get_title_sort
from user.utils import update_groups
from user.models import Group
import archive.models

logger = logging.getLogger('pandora.' + __name__)
User = get_user_model()


def get_id(info):
    q = Item.objects.all()
    for key in ('title', 'director', 'year'):
        #       'episodeTitle', 'episodeDirector', 'episodeYear', 'season', 'episode'):
        if key in info and info[key]:
            k = 'find__key'
            v = 'find__value'
            if key in Item.facet_keys + ['title']:
                k = 'facets__key'
                v = 'facets__value'
            if isinstance(info[key], list):
                for value in info[key]:
                    q = q.filter(**{k: key, v: value})
            else:
                q = q.filter(**{k: key, v: info[key]})
    if q.count() == 1:
        return q[0].public_id
    if settings.DATA_SERVICE:
        r = external_data('getId', info)
        if r['status']['code'] == 200:
            imdbId = r['data']['id']
            return imdbId
    return None

def get_item(info, user=None):
    '''
        info dict with:
            imdbId, title, director, year,
            season, episode, episodeTitle, episodeDirector, episodeYear
    '''
    item_data = {
        'title': info.get('title', ''),
        'director': info.get('director', []),
    }

    if list(filter(lambda k: k['id'] == 'year', settings.CONFIG['itemKeys'])):
        item_data['year'] = info.get('year', '') or ''

    # add additional item metadata parsed from path
    ignore_keys = set(list(Item.base_keys) + ['language'] + list(item_data))
    possible_keys = set([k['id'] for k in settings.CONFIG['itemKeys'] if k['id'] not in ignore_keys])
    for key in info:
        if key in possible_keys:
            item_data[key] = info[key]

    for key in ('episodeTitle', 'episodeDirector', 'episodeYear',
                'season', 'episode', 'seriesTitle'):
        if key in info and info[key]:
            item_data[key] = info[key]

    item_data = utils.normalize_dict('NFC', item_data)
    if settings.USE_IMDB:
        if 'imdbId' in info and info['imdbId']:
            try:
                item = Item.objects.get(public_id=info['imdbId'])
            except Item.DoesNotExist:
                item = Item(public_id=info['imdbId'])
                if 'title' in info and 'director' in info:
                    item.external_data = item_data
                item.user = user
                item.oxdbId = item.public_id
                if not item.update_external():
                    item.save(sync=True)
        else:
            public_id = get_id(info)
            if public_id:
                try:
                    item = Item.objects.get(public_id=public_id)
                except Item.DoesNotExist:
                    info['imdbId'] = public_id
                    item = get_item(info, user)
                return item
            try:
                item = Item.objects.get(public_id=info.get('oxdbId'))
            except Item.DoesNotExist:
                item = Item()
                item.user = user
                item.data = item_data
                item.public_id = info.get('oxdbId', item.oxdb_id())
                try:
                    existing_item = Item.objects.get(oxdbId=item.oxdb_id())
                    item = existing_item
                except Item.DoesNotExist:
                    item.oxdbId = item.oxdb_id()
                    item.save(sync=True)
                    tasks.update_poster.delay(item.public_id)
    else:
        title = unicodedata.normalize('NFKD', info['title']).lower()
        qs = Item.objects.filter(find__key='title', find__value=title)
        if 'year' in info:
            qs = qs.filter(find__key='year', find__value=str(info['year']))
        if qs.count() == 1:
            item = qs[0]
        else:
            item = Item()
            item.data = item_data
            item.user = user
            item.save(sync=True)
            tasks.update_poster.delay(item.public_id)
    return item

def get_path(f, x):
    return f.path(x)

def get_icon_path(f, x):
    return get_path(f, 'icon.jpg')

def get_poster_path(f, x):
    return get_path(f, 'poster.jpg')

class Item(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(User, null=True, related_name='items', on_delete=models.CASCADE)
    groups = models.ManyToManyField(Group, blank=True, related_name='items')

    # while metadata is updated, files are set to rendered=False
    rendered = models.BooleanField(default=False, db_index=True)
    # should be set based on user
    level = models.IntegerField(db_index=True)

    public_id = models.CharField(max_length=128, unique=True, blank=True)
    oxdbId = models.CharField(max_length=42, unique=True, blank=True, null=True)
    external_data = JSONField(default=dict, editable=False)
    data = JSONField(default=dict, editable=False)
    cache = JSONField(default=dict, editable=False)
    poster = models.ImageField(default=None, blank=True, upload_to=get_poster_path)
    poster_source = models.TextField(blank=True)
    poster_height = models.IntegerField(default=0)
    poster_width = models.IntegerField(default=0)
    poster_frame = models.FloatField(default=-1)

    icon = models.ImageField(default=None, blank=True, upload_to=get_icon_path)

    stream_info = JSONField(default=dict, editable=False)

    # stream related fields
    stream_aspect = models.FloatField(default=4/3)

    objects = managers.ItemManager()

    def get(self, key, default=None):
        if key == 'rightslevel':
            return self.level
        if key == 'user':
            return self.user and self.user.username or None
        if key == 'groups':
            return [g.name for g in self.groups.all()]
        if self.data and key in self.data:
            return self.data[key]
        if self.external_data and key in self.external_data:
            return self.external_data[key]
        item_key = utils.get_by_id(settings.CONFIG['itemKeys'], key)
        if item_key and 'value' in item_key \
                and isinstance(item_key['value'], dict) \
                and item_key['value'].get('type') == 'map' \
                and self.get(item_key['value']['key']):
            value = re.compile(item_key['value']['map']).findall(self.get(item_key['value']['key']))
            if value and item_key['value'].get('format'):
                value = [item_key['value']['format'].format(value[0])]
            return value[0] if value else default
        return default

    def access(self, user):
        if user.is_anonymous:
            level = 'guest'
        else:
            level = user.profile.get_level()
        editable = self.editable(user)
        if editable:
            return True
        if not self.rendered and settings.CONFIG.get('itemRequiresVideo'):
            return False
        allowed_level = settings.CONFIG['capabilities']['canSeeItem'][level]
        if self.level <= allowed_level:
            return True
        return False

    def editable(self, user):
        if user.is_anonymous:
            return False
        max_level = len(settings.CONFIG['rightsLevels'])
        if self.level > max_level:
            return False
        if user.profile.capability('canEditMetadata') or \
           user.is_staff or \
           self.user == user or \
           self.groups.filter(id__in=user.groups.all()).count() > 0:
            return True
        return False

    def edit(self, data, is_task=False):
        data = data.copy()
        # FIXME: how to map the keys to the right place to write them to?
        if 'id' in data:
            # FIXME: check if id is valid and exists and move/merge items accordingly
            del data['id']
        if 'groups' in data:
            groups = data.pop('groups')
            update_groups(self, groups)
        keys = [k['id'] for k in
                list(filter(lambda i: i.get('description'), settings.CONFIG['itemKeys']))]
        for k in keys:
            key = '%sdescription' % k
            if key in data:
                description = data.pop(key)
                if isinstance(description, dict):
                    for value in description:
                        value = ox.sanitize_html(value)
                        d, created = Description.objects.get_or_create(key=k, value=value)
                        d.description = ox.sanitize_html(description[value])
                        d.save()
                else:
                    value = ox.sanitize_html(data.get(k, self.get(k, '')))
                    if not description:
                        description = ''
                    d, created = Description.objects.get_or_create(key=k, value=value)
                    d.description = ox.sanitize_html(description)
                    d.save()
        for key in data:
            if data[key] is None:
                if key in self.data:
                    del self.data[key]
            else:
                k = list(filter(lambda i: i['id'] == key, settings.CONFIG['itemKeys']))
                ktype = k and k[0].get('type') or ''
                if ktype == 'text':
                    self.data[key] = ox.sanitize_html(data[key])
                elif ktype == '[text]':
                    self.data[key] = [ox.sanitize_html(t) for t in data[key]]
                elif ktype == '[string]':
                    self.data[key] = [ox.escape_html(t) for t in data[key]]
                elif key in ('episodeTitle', 'seriesTitle', 'episodeDirector', 'seriesYear'):
                    self.data[key] = ox.escape_html(data[key])
                elif isinstance(data[key], str):
                    self.data[key] = ox.escape_html(data[key])
                elif isinstance(data[key], list):
                    def cleanup(i):
                        if isinstance(i, str):
                            i = ox.escape_html(i)
                        return i
                    self.data[key] = [cleanup(i) for i in data[key]]
                elif isinstance(data[key], int) or isinstance(data[key], float):
                    self.data[key] = data[key]
                else:
                    self.data[key] = ox.escape_html(data[key])
        p = self.save()
        if not settings.USE_IMDB and list(filter(lambda k: k in self.poster_keys, data)):
            if is_task:
                tasks.update_poster(self.public_id)
            else:
                p = tasks.update_poster.delay(self.public_id)
        return p

    def update_external(self):
        poster_url = self.prefered_poster_url()
        if settings.DATA_SERVICE and not self.public_id.startswith('0x'):
            response = external_data('getData', {'id': self.public_id})
            if response['status']['code'] == 200:
                self.external_data = response['data']
                keys = [
                    k['id'] for k in settings.CONFIG['itemKeys']
                ] + settings.ADDITIONAL_IMDB_KEYS
                for key in set(self.external_data) - set(keys):
                    del self.external_data[key]
                self.save(sync=True)
                if poster_url != self.prefered_poster_url():
                    self.remove_poster()
                    self.make_poster()
                return True
        return False

    def add_default_data(self):
        for k in settings.CONFIG['itemKeys']:
            if 'default' in k and not k['id'] in self.data:
                self.data[k['id']] = k['default']

    def expand_connections(self):
        c = self.get('connections')
        if c:
            for t in list(c):
                if c[t]:
                    if isinstance(c[t][0], str):
                        c[t] = [{'id': i, 'title': None} for i in c[t]]
                    ids = [i['id'] for i in c[t]]
                    known = {}
                    for l in Item.objects.filter(public_id__in=ids):
                        known[l.public_id] = l.get('title')
                    for i in c[t]:
                        if i['id'] in known:
                            i['item'] = i['id']
                            i['title'] = known[i['id']]
                    c[t] = list(filter(lambda x: x['title'], c[t]))
                if not c[t]:
                    del c[t]
        return c

    def __str__(self):
        year = self.get('year')
        if year:
            string = '%s (%s)' % (ox.decode_html(self.get('title', 'Untitled')), self.get('year'))
        else:
            string = self.get('title', 'Untitled')
        return '[%s] %s' % (self.public_id, string)

    def get_absolute_url(self):
        return '/%s' % self.public_id

    def save(self, *args, **kwargs):
        sync = kwargs.get('sync', False)
        if 'sync' in kwargs:
            del kwargs['sync']
        update_poster = False
        update_ids = False
        if not self.id:
            if self.user:
                self.level = settings.CONFIG['rightsLevel'][self.user.profile.get_level()]
            else:
                self.level = settings.CONFIG['rightsLevel']['member']
            if not self.public_id:
                self.public_id = str(uuid.uuid1())
            self.add_default_data()
            super(Item, self).save(*args, **kwargs)
            update_poster = True
            if not settings.USE_IMDB:
                self.public_id = ox.toAZ(self.id)
                # avoid looking like an ad
                if self.id == ox.fromAZ('AD') - 1:
                    cursor = connection.cursor()
                    sql = "SELECT nextval('%s_id_seq')" % self._meta.db_table
                    cursor.execute(sql)

        # this does not work if another item without imdbid has the same metadata
        oxdbId = self.oxdb_id()
        if not settings.USE_IMDB:
            self.oxdbId = None
        elif oxdbId:
            if self.oxdbId != oxdbId:
                q = Item.objects.filter(oxdbId=oxdbId).exclude(id=self.id)
                if q.count() != 0:
                    if utils.is_imdb_id(self.public_id):
                        self.oxdbId = None
                        self.update_sort()
                        q[0].merge_with(self, save=False)
                    else:
                        n = 1
                        key = 'episodeTitle' in self.data and 'episodeTitle' or 'title'
                        title = self.get(key, 'Untitled')
                        while q.count() != 0:
                            n += 1
                            self.data[key] = '%s [%d]' % (title, n)
                            oxdbId = self.oxdb_id()
                            q = Item.objects.filter(oxdbId=oxdbId).exclude(id=self.id)
                self.oxdbId = oxdbId
                update_poster = True
                if not utils.is_imdb_id(self.public_id):
                    update_ids = True

        # id changed, what about existing item with new id?
        if settings.USE_IMDB and not utils.is_imdb_id(self.public_id) and self.oxdbId != self.public_id:
            self.public_id = self.oxdbId
            # FIXME: move files to new id here
        if settings.USE_IMDB and utils.is_imdb_id(self.public_id):
            for key in ('title', 'year', 'director', 'season', 'episode',
                        'seriesTitle', 'episodeTitle'):
                if key in self.data:
                    del self.data[key]

        # update defaults
        if settings.USE_IMDB:
            defaults = list(filter(lambda k: 'default' in k, settings.CONFIG['itemKeys']))
            for k in defaults:
                if utils.is_imdb_id(self.public_id):
                    if k['id'] in self.data and self.data[k['id']] == k['default']:
                        del self.data[k['id']]
                else:
                    if k['id'] not in self.data:
                        self.data[k['id']] = k['default']

        if self.poster and os.path.exists(self.poster.path):
            self.poster_height = self.poster.height
            self.poster_width = self.poster.width
        else:
            self.poster_height = 128
            self.poster_width = 80
        self.update_sort()
        self.update_languages()
        self.cache = self.json()
        self.cache['modified'] = datetime.now()
        super(Item, self).save(*args, **kwargs)
        self.update_find()
        self.update_sort()
        self.update_facets()
        if update_ids:
            for c in self.clips.all():
                c.save()
            for a in self.annotations.all():
                public_id = a.public_id.split('/')[1]
                public_id = "%s/%s" % (self.public_id, public_id)
                if public_id != a.public_id:
                    a.public_id = public_id
                    a.save()
        if sync:
            self.update_file_paths()
            if update_poster:
                tasks.update_poster(self.public_id)
        else:
            tasks.update_file_paths.delay(self.public_id)
            if update_poster:
                return tasks.update_poster.delay(self.public_id)
        return None

    def delete_files(self):
        path = os.path.join(settings.MEDIA_ROOT, self.path())
        if not isinstance(path, bytes):
            path = path.encode('utf-8')
        if os.path.exists(path):
            shutil.rmtree(path)

    def merge_with(self, other, save=True):
        '''
            move all related tables to other and delete self
        '''
        for l in self.lists.all():
            l.remove(self)
            if l.items.filter(id=other.id).count() == 0:
                l.add(other)

        for a in self.annotations.all().order_by('id'):
            a.item = other
            with transaction.atomic():
                a.set_public_id()
            Annotation.objects.filter(id=a.id).update(item=other, public_id=a.public_id)
        try:
            other_sort = other.sort
        except:
            other_sort = None
        self.clips.all().update(item=other, sort=other_sort)

        if hasattr(self, 'files'):
            for f in self.files.all():
                f.item = other
                f.save()
        self.delete()
        if save:
            other.save()
            # FIXME: update poster, stills and streams after this
            if other_sort is None:
                other.clips.all().update(sort=other.sort)

    def merge_streams(self, output, resolution=None, format="webm"):
        streams = [s.get(resolution, format).media.path for s in self.streams()]
        if len(streams) > 1:
            if format == "webm":
                cmd = ['mkvmerge', '-o', output]
                cmd += [streams[0]] + ['+' + s for s in streams[1:]]
                p = subprocess.Popen(cmd, stdout=open('/dev/null', 'w'), stderr=open('/dev/null', 'w'), close_fds=True)
                p.wait()
                return True
            elif format == "mp4":
                fd, tmp_output_txt = tempfile.mkstemp('.txt')
                with open(tmp_output_txt, 'w') as f:
                    f.write('\n'.join(["file '{}'".format(path) for path in streams]))
                cmd = [
                    settings.FFMPEG,
                    '-nostats', '-loglevel', 'error',
                    '-y',
                    '-f', 'concat', '-safe', '0', '-i', tmp_output_txt,
                    '-c', 'copy',
                    output
                ]
                p = subprocess.Popen(
                    cmd, stdout=open('/dev/null', 'w'), stderr=open('/dev/null', 'w'), close_fds=True)
                p.wait()
                os.unlink(tmp_output_txt)
                os.close(fd)
                return True
            else:
                return None
        return streams[0] if streams else None

    def get_posters(self):
        index = []
        if settings.DATA_SERVICE:
            url = self.prefered_poster_url()
            external_posters = self.external_data.get('posters', {})
            services = list(external_posters)
            for service in settings.POSTER_PRECEDENCE:
                if service in services:
                    index.append(service)
            for service in services:
                if service not in index:
                    index.append(service)
            if settings.URL not in index:
                index.append(settings.URL)
        else:
            external_posters = []

        posters = []
        poster = self.path('siteposter.jpg')
        poster = os.path.abspath(os.path.join(settings.MEDIA_ROOT, poster))
        if os.path.exists(poster):
            posters.append({
                'url': '/%s/siteposter.jpg' % self.public_id,
                'width': 640,
                'height': 1024,
                'source': settings.URL,
                'selected': url is None,
                'index': index.index(settings.URL)
            })

        for service in external_posters:
            p = external_posters[service][0]
            selected = True if self.poster_source and self.poster_source == service or url == p['url'] else False
            p['source'] = service
            p['selected'] = selected
            p['index'] = index.index(service)
            posters.append(p)
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
                    'url': '/%s/posterframe%d.jpg' % (self.public_id, p),
                    'height': f['height'],
                    'width': f['width']
                })
                p += 1
        return frames

    def get_stream(self):
        for s in self.streams():
            return s.json()

    def get_layers(self, user=None):
        return get_layers(item=self, user=user)

    def get_documents(self, user=None):
        qs = self.documents.all()
        documents = [d.json(item=self) for d in qs]
        return sorted(documents, key=lambda d: d['index'])

    def json(self, keys=None):
        i = {
            'id': self.public_id,
            'rendered': self.rendered,
            'rightslevel': self.level
        }
        if self.user:
            i['user'] = self.user.username
        i['groups'] = [g.name for g in self.groups.all()]
        i.update(self.external_data)
        i.update(self.data)
        if settings.USE_IMDB:
            i['oxdbId'] = self.oxdbId or self.oxdb_id() or self.public_id
        for k in settings.CONFIG['itemKeys']:
            key = k['id']
            if not keys or key in keys:
                if key not in i:
                    value = self.get(key)
                    # also get values from sort table, i.e. numberof values
                    if not value:
                        try:
                            if self.sort and hasattr(self.sort, key):
                                value = getattr(self.sort, key)
                        except ItemSort.DoesNotExist:
                            pass
                    if value:
                        i[key] = value

        if 'cast' in i and isinstance(i['cast'][0], str):
            i['cast'] = [i['cast']]
        if 'cast' in i and isinstance(i['cast'][0], list):
            i['cast'] = [{'actor': x[0], 'character': x[1]} for x in i['cast']]

        if 'connections' in i:
            i['connections'] = self.expand_connections()

        if not keys or 'posterRatio' in keys:
            if self.poster_height:
                i['posterRatio'] = self.poster_width / self.poster_height

        if keys and 'hasSource' in keys:
            i['hasSource'] = self.streams().exclude(file__data='').exists()

        streams = self.streams()
        i['durations'] = [s[0] for s in streams.values_list('duration')]
        i['duration'] = sum(i['durations'])
        i['audioTracks'] = self.audio_tracks()
        if not i['audioTracks']:
            del i['audioTracks']
        i['parts'] = len(i['durations'])
        if i['parts']:
            i['videoRatio'] = streams[0].aspect_ratio
            i['resolution'] = (streams[0].file.width, streams[0].file.height)
            if i['resolution'] == (0, 0):
                del i['resolution']
                del i['videoRatio']
        else:
            i['duration'] = self.files.filter(
                Q(selected=True) | Q(wanted=True)
            ).aggregate(Sum('duration'))['duration__sum'] 
            videos = self.files.filter(selected=True, is_video=True)
            if i['duration'] and videos.count():
                i['resolution'] = (videos[0].width, videos[0].height)
                if i['resolution'][1] != 0:
                    i['videoRatio'] = i['resolution'][0] / i['resolution'][1]
            else:
                for k in ('resolution', 'videoRatio'):
                    if k in i:
                        del i[k]

        # only needed by admins
        if keys and 'posters' in keys:
            i['posters'] = self.get_posters()

        frames = self.get_frames()
        if keys and 'frames' in keys:
            i['frames'] = frames

        selected_frame = [f for f in frames if f['selected']]
        if selected_frame:
            i['posterFrame'] = selected_frame[0]['position']
        elif self.poster_frame != -1.0:
            i['posterFrame'] = self.poster_frame

        dkeys = [k['id'] for k in
                 list(filter(lambda i: i.get('description'), settings.CONFIG['itemKeys']))]
        if keys:
            dkeys = list(filter(lambda k: k in keys, dkeys))
        for key in dkeys:
            k = list(filter(lambda i: i['id'] == key, settings.CONFIG['itemKeys']))
            if isinstance((k and k[0].get('type') or ''), list):
                i['%sdescription' % key] = {}
                if key == 'name':
                    values = []
                    for ikey in list(filter(lambda i: i.get('sortType') == 'person', settings.CONFIG['itemKeys'])):
                        values += i.get(ikey['id'], [])
                    values = list(set(values))
                else:
                    values = self.get(key)
                if values:
                    values = [ox.sanitize_html(value) for value in values]
                    for d in Description.objects.filter(key=key, value__in=values):
                        i['%sdescription' % key][d.value] = d.description
            else:
                value = ox.sanitize_html(self.get(key, ''))
                qs = Description.objects.filter(key=key, value=value)
                i['%sdescription' % key] = '' if qs.count() == 0 else qs[0].description
        if keys:
            info = {}
            for key in keys:
                if key in i:
                    info[key] = i[key]
            return info
        return i

    def get_item_description(self):
        return ox.strip_tags(
            self.get_item_description_html().replace(
                '</div><div style="margin-top: 8px; text-align: justify">', '; '
            )
        )

    def get_item_description_html(self):
        description = ''
        data = self.json()
        info = []
        for key in [
            'director', 'writer', 'producer',
            'cinematographer', 'editor', 'actor'
        ]:
            value = data.get(key, [])
            if value:
                info.append('<b>%s:</b> %s' % (
                    'Cast' if key == 'actor' else key.capitalize(),
                    ', '.join(value)
                ))
        if info:
            description += '<div style="margin-top: 8px; text-align: justify">%s</div>' % '; '.join(info)
        info = []
        for key in [
            'duration', 'aspectratio',
            'hue', 'saturation', 'lightness',
            'volume', 'cutsperminute', 'wordsperminute'
        ]:
            value = data.get(key, 0)
            if value:
                info.append('<b>%s:</b> %s' % (
                    'Aspect Ratio' if key == 'aspectratio'
                    else 'Cuts per Minute' if key == 'cutsperminute'
                    else 'Words per Minute' if key == 'wordsperminute'
                    else key.capitalize(),
                    ox.format_duration(value * 1000 if value else 0, milliseconds=False) if key == 'duration'
                    else '%.3f:1' % value if key == 'aspectratio'
                    else '%.3f' % value
                ))
        if info:
            description += '<div style="margin-top: 8px; text-align: justify">%s</div>' % '; '.join(info)
        if not settings.USE_IMDB:
            value = data.get('summary', '')
            if value:
                description += '<div style="margin-top: 8px; text-align: justify"><b style="display: none">Summary:</b> %s</div>' % value
        return description

    def oxdb_id(self):
        if not self.get('title') and not self.get('director'):
            return self.public_id
        return ox.get_oxid(self.get('seriesTitle', self.get('title', '')),
                           self.get('director', []),
                           self.get('seriesYear', self.get('year', '')),
                           self.get('season', ''),
                           self.get('episode', ''),
                           self.get('episodeTitle', ''),
                           self.get('episodeDirector', []),
                           self.get('episodeYear', ''))

    '''
        Search related functions
    '''

    def update_languages(self):
        languages = {}
        for layer in settings.CONFIG['layers']:
            l = layer['id']
            ll = []
            if self.annotations.filter(layer=l).count():
                ll.append(settings.CONFIG['language'])
            for a in self.annotations.filter(layer=l, value__contains='lang="'):
                ll += re.compile('lang="(.*?)"').findall(a.value)
            languages[l] = sorted(set(ll))
        changed = languages != self.data.get('annotationLanguages')
        self.data['annotationLanguages'] = languages
        return changed

    def update_find(self):
        layer_keys = []

        def save(key, value):
            if value not in ('', None):
                f, created = ItemFind.objects.get_or_create(item=self, key=key)
                if isinstance(value, bool):
                    value = value and 'true' or 'false'
                if isinstance(value, str):
                    value = ox.decode_html(ox.strip_tags(value.strip()))
                    value = unicodedata.normalize('NFKD', value).lower()
                f.value = value
                f.save()
            else:
                ItemFind.objects.filter(item=self, key=key).delete()

        def get_titles():
            titles = [self.get('title', 'Untitled')]
            if self.get('originalTitle'):
                titles.append(self.get('originalTitle'))
            at = self.get('alternativeTitles')
            if at:
                titles += [a[0] for a in at]
            return titles

        with transaction.atomic():
            for key in settings.CONFIG['itemKeys']:
                i = key['id']
                if i == 'title':
                    save(i, '\n'.join(get_titles()))
                elif i == 'rightslevel':
                    save(i, self.level)
                elif i == 'filename':
                    save(i, '\n'.join(self.all_paths()))
                elif i == 'annotations':
                    qs = Annotation.objects.filter(item=self)
                    qs = qs.filter(layer__in=Annotation.public_layers()).exclude(findvalue=None)
                    qs = qs.order_by('start')
                    save(i, '\n'.join([l.findvalue for l in qs]))
                elif key['type'] == 'layer':
                    qs = Annotation.objects.filter(item=self).exclude(findvalue=None)
                    qs = qs.filter(layer=i)
                    qs = qs.order_by('start')
                    save(i, '\n'.join(list(filter(None, [l.findvalue for l in qs]))))
                    layer_keys.append(i)
                elif i != '*' and i not in self.facet_keys:
                    value = self.get(i)
                    if isinstance(value, list):
                        value = '\n'.join(value)
                    save(i, value)

            for key in self.facet_keys:
                if key in layer_keys:
                    continue
                if key == 'title':
                    values = get_titles()
                elif key == 'character':
                    values = self.get('cast', '')
                    if values:
                        values = list(filter(lambda x: x.strip(),
                                        [f['character'] for f in values]))
                        values = list(set(values))
                elif key == 'name':
                    values = []
                    for k in settings.CONFIG['itemKeys']:
                        if k.get('sortType') == 'person':
                            values += self.get(k['id'], [])
                    values = list(set(values))
                else:
                    values = self.get(key, '')
                if values and isinstance(values, list) and isinstance(values[0], str):
                    save(key, '\n'.join(values))
                else:
                    save(key, values)

            isSeries = self.get('series',
                                self.get('episodeTitle',
                                         self.get('episode',
                                                  self.get('seriesTitle')))) is not None
            save('series', isSeries)

    base_keys = (
        'aspectratio',
        'bitrate',
        'clips',
        'created',
        'cutsperminute',
        'duration',
        'hue',
        'id',
        'oxdbId',
        'lightness',
        'modified',
        'numberofannotations',
        'numberofcuts',
        'numberofdocuments',
        'numberoffiles',
        'parts',
        'pixels',
        'random',
        'timesaccessed',
        'accessed',
        'resolution',
        'width',
        'height',
        'rendered',
        'rightslevel',
        'saturation',
        'size',
        'volume',
    )

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
            return sort_value.lower()

        def set_value(s, name, value):
            if isinstance(value, str):
                value = ox.decode_html(value.lower())
                if not value:
                    value = None
            setattr(s, name, value)

        def get_value(source, key):
            if 'value' in key and 'layer' in key['value']:
                value = [a.value for a in self.annotations.filter(layer=key['value']['layer']).exclude(value='')]
            else:
                value = self.get(source)
            return value

        def get_words(source, key):
            value = get_value(source, key)
            if isinstance(value, list):
                value = '\n'.join(value)
            value = len(value.split(' ')) if value else 0
            return value


        # sort keys based on database, these will always be available
        s.public_id = self.public_id.replace('0x', 'xx')
        s.oxdbId = self.oxdbId
        if not settings.USE_IMDB and s.public_id.isupper() and s.public_id.isalpha():
            s.public_id = ox.sort_string(str(ox.fromAZ(s.public_id)))
        else:
            s.public_id = ox.sort_string(s.public_id)
        s.modified = self.modified or datetime.now()
        s.created = self.created or datetime.now()
        s.rightslevel = self.level

        s.aspectratio = self.get('aspectratio')
        if self.id:
            s.clips = self.clips.count()

        s.numberoffiles = self.files.all().count()
        videos = self.files.filter(selected=True).filter(Q(is_video=True) | Q(is_audio=True))
        if videos.count() > 0:
            # s.duration = sum([v.duration for v in videos])
            s.duration = sum([v.duration for v in self.streams()])
            v = videos[0]
            if v.is_audio or not v.info.get('video'):
                s.resolution = None
                s.width = None
                s.height = None
                s.aspectratio = None
            else:
                s.resolution = v.width * v.height
                s.width = v.width
                s.height = v.height
                if not s.aspectratio and v.display_aspect_ratio:
                    s.aspectratio = float(utils.parse_decimal(v.display_aspect_ratio))
            s.pixels = sum([v.pixels for v in videos])
            s.parts = videos.count()
            s.size = sum([v.size for v in videos])  # FIXME: only size of movies?
            if s.duration:
                s.bitrate = s.size * 8 / s.duration
            else:
                s.bitrate = 0
            s.volume = self.data.get('volume', None)
        else:
            s.duration = None
            s.resolution = None
            s.bitrate = None
            s.pixels = None
            s.filename = None
            s.files = None
            s.size = None
            s.volume = None
            s.parts = 0
            s.aspectratio = None

        for key in ('hue', 'saturation', 'lightness'):
            if key in self.data:
                setattr(s, key, self.data.get(key, None))
        s.numberofannotations = self.annotations.exclude(value='').count()
        s.numberofcuts = len(self.data.get('cuts', []))
        s.numberofdocuments = self.documents.count()
        if s.duration:
            s.cutsperminute = s.numberofcuts / (s.duration/60)
        else:
            s.cutsperminute = None
        s.timesaccessed = self.accessed.aggregate(Sum('accessed'))['accessed__sum']
        if not s.timesaccessed:
            s.timesaccessed = 0
        s.accessed = self.accessed.aggregate(Max('access'))['access__max']

        for key in list(filter(lambda k: k.get('sort', False), settings.CONFIG['itemKeys'])):
            name = key['id']
            source = name
            sort_type = key.get('sortType', key['type'])
            if 'value' in key:
                if 'key' in key['value']:
                    source = key['value']['key']
                sort_type = key['value'].get('type', sort_type)
            if isinstance(sort_type, list):
                sort_type = sort_type[0]
            if name not in self.base_keys:
                if sort_type == 'title':
                    value = get_title_sort(self.get(source, 'Untitled'))
                    value = utils.sort_title(value)[:955]
                    set_value(s, name, value)
                elif sort_type == 'person':
                    value = sortNames(self.get(source, []))
                    if value is None:
                        value = ''
                    value = utils.sort_string(value)[:955]
                    set_value(s, name, value)
                elif sort_type == 'string':
                    value = self.get(source, '')
                    if value is None:
                        value = ''
                    if isinstance(value, list):
                        value = ','.join([str(v) for v in value])
                    value = utils.sort_string(value)[:955]
                    set_value(s, name, value)
                elif sort_type == 'words':
                    value = get_words(source, key) if s.duration else None
                    set_value(s, name, value)
                elif sort_type == 'wordsperminute':
                    value = get_words(source, key)
                    value = value / (s.duration / 60) if value and s.duration else None
                    set_value(s, name, value)
                elif sort_type in ('length', 'integer', 'time', 'float'):
                    # can be length of strings or length of arrays, i.e. keywords
                    if 'layer' in key.get('value', []):
                        value = self.annotations.filter(layer=key['value']['layer']).count()
                    else:
                        value = self.get(source)
                    if isinstance(value, list):
                        value = len(value)
                    set_value(s, name, value)
                elif sort_type == 'year':
                    value = self.get(source)
                    if isinstance(value, str):
                        value = value[:4]
                    set_value(s, name, value)
                elif sort_type == 'date':
                    value = value_ = self.get(source)
                    if isinstance(value, str):
                        value_ = None
                        for fmt in ('%Y-%m-%d', '%Y-%m', '%Y'):
                            try:
                                value_ = datetime_safe.datetime.strptime(value, fmt)
                            except ValueError:
                                pass
                            else:
                                continue
                    set_value(s, name, value_)
        s.save()

    def update_facet(self, key):
        current_values = self.get(key, [])
        if key == 'title':
            if current_values:
                current_values = [current_values]
            else:
                current_values = []
            ot = self.get('originalTitle')
            if ot:
                current_values.append(ot)
            at = self.get('alternativeTitles')
            if at:
                current_values += [a[0] for a in at]
        elif key == 'character':
            current_values = list(filter(lambda x: x.strip(),
                                    [f['character'] for f in self.get('cast', [])]))
            current_values = [item for sublist in [x.split(' / ') for x in current_values]
                              for item in sublist]
        elif key == 'name':
            current_values = []
            for k in settings.CONFIG['itemKeys']:
                if k.get('sortType') == 'person':
                    current_values += self.get(k['id'], [])
        if not isinstance(current_values, list):
            if not current_values:
                current_values = []
            else:
                current_values = [str(current_values)]

        filter_map = utils.get_by_id(settings.CONFIG['itemKeys'], key).get('filterMap')
        if filter_map:
            filter_map = re.compile(filter_map)
            _current_values = []
            for value in current_values:
                value = filter_map.findall(value)
                if value:
                    _current_values.append(value[0])
            current_values = _current_values

        try:
            current_values = list(set(current_values))
        except:
            logger.error('invalid facet data for %s: %s', key, current_values)
            current_values = []
        current_values = [ox.decode_html(ox.strip_tags(v)) for v in current_values]
        current_values = [unicodedata.normalize('NFKD', v) for v in current_values]
        self.update_facet_values(key, current_values)

    def update_layer_facet(self, key):
        from entity.models import Entity
        current_values = [a['value']
                          for a in self.annotations.filter(layer=key).distinct().values('value')]
        layer = utils.get_by_id(settings.CONFIG['layers'], key)
        if layer.get('type') == 'entity':
            current_values = [
                a['name']
                for a in Entity.objects.filter(id__in=[ox.fromAZ(i) for i in current_values]).values('name')
            ]
        current_values = [ox.decode_html(ox.strip_tags(v.replace('<br>', ' '))) for v in current_values]
        current_values = [unicodedata.normalize('NFKD', v) for v in current_values if v]
        self.update_facet_values(key, current_values)

    def update_facet_values(self, key, current_values):
        current_sortvalues = set([value.lower() for value in current_values])
        saved_values = [i.value.lower() for i in Facet.objects.filter(item=self, key=key)]
        removed_values = list(filter(lambda i: i not in current_sortvalues, saved_values))

        if removed_values:
            q = Q()
            for v in removed_values:
                q |= Q(value__iexact=v)
            Facet.objects.filter(item=self, key=key).filter(q).delete()

        for value in current_values:
            if value.lower() not in saved_values:
                sortvalue = value
                if key in self.person_keys + ['name']:
                    sortvalue = get_name_sort(value)
                sortvalue = utils.sort_string(sortvalue).lower()[:900]
                f, created = Facet.objects.get_or_create(item=self, key=key, value=value, sortvalue=sortvalue)
                if created:
                    Facet.objects.filter(item=self, key=key, value__iexact=value).exclude(value=value).delete()
                    Facet.objects.filter(key=key, value__iexact=value).exclude(value=value).update(value=value)
                saved_values.append(value.lower())

    def update_facets(self):
        for key in set(self.facet_keys + ['title']):
            if key in self.layer_facet_keys:
                self.update_layer_facet(key)
            else:
                self.update_facet(key)

    def update_file_paths(self):
        for f in self.files.all():
            if f.normalize_path() != f.path:
                f.save()

    def path(self, name=''):
        h = self.public_id
        h = (7-len(h))*'0' + h
        return os.path.join('items', h[:2], h[2:4], h[4:6], h[6:], name)

    '''
        Video related functions
    '''
    def frame(self, position, height=None):
        offset = 0
        streams = self.streams()
        for stream in streams:
            if stream.duration + offset < position:
                offset += stream.duration
            else:
                if not stream.file.is_video or not stream.file.info.get('video'):
                    return None
                position = position - offset
                if not height:
                    height = stream.resolution
                else:
                    height = min(height, stream.resolution)
                path = os.path.join(settings.MEDIA_ROOT, stream.path(),
                                    'frames', "%dp" % height, "%s.jpg" % position)
                if not os.path.exists(path) and stream.media:
                    extract.frame(stream.media.path, path, position, height, info=stream.info)
                if not os.path.exists(path):
                    return None
                return path

    def extract_clip(self, in_, out, resolution, format, track=None, force=False):
        streams = self.streams(track)
        stream = streams[0].get(resolution, format)
        if streams.count() > 1 and stream.info['duration'] < out:
            video = NamedTemporaryFile(suffix='.%s' % format)
            r = self.merge_streams(video.name, resolution, format)
            if not r:
                return False
            path = video.name
            duration = sum(self.item.cache['durations'])
        else:
            path = stream.media.path
            duration = stream.info['duration']

        cache_name = '%s_%sp_%s.%s' % (self.public_id, resolution, '%s,%s' % (in_, out), format)
        cache_path = os.path.join(settings.MEDIA_ROOT, self.path('cache/%s' % cache_name))
        if os.path.exists(cache_path) and not force:
            return cache_path
        if duration >= out:
            subtitles = utils.get_by_key(settings.CONFIG['layers'], 'isSubtitles', True)
            if subtitles:
                srt = self.srt(subtitles['id'], encoder=ox.srt)
                if len(srt) < 4:
                    srt = None
            else:
                srt = None
            ox.makedirs(os.path.dirname(cache_path))
            extract.chop(path, in_, out, subtitles=srt, dest=cache_path, encode=True)
            return cache_path
        return False

    @property
    def timeline_prefix(self):
        videos = self.streams()
        if len(videos) == 1:
            return os.path.join(settings.MEDIA_ROOT, videos[0].path(''))
        return os.path.join(settings.MEDIA_ROOT, self.path())

    def all_paths(self):
        return list(set([
            item for sublist in
            [f.all_paths() for f in self.files.all()]
            for item in sublist
        ]))

    def get_files(self, user):
        files = self.files.all().select_related()
        if user.profile.get_level() != 'admin':
            files = files.filter(instances__volume__user=user)
        return [f.json() for f in files]

    def users_with_files(self):
        return User.objects.filter(
            volumes__files__file__item=self
        ).order_by('date_joined').distinct()
        # FIXME: profile not showing up here
        # ).order_by('-profile__level', 'date_joined').distinct()

    def sets(self):
        sets = []
        for user in self.users_with_files():
            files = self.files.filter(instances__volume__user=user, instances__ignore=False)
            if files.count():
                sets.append(files)
        if not sets:
            files = self.files.filter(instances=None, available=True)
            if files.count():
                sets.append(files)
        return sets

    def update_wanted(self):
        wanted = []
        for s in self.sets():
            if s.filter(selected=False).count() != 0:
                wanted += [f.id for f in s if not f.available]
            else:
                break
        qs = self.files.all()
        if wanted:
            self.files.filter(id__in=wanted).update(wanted=True)
            qs = qs.exclude(id__in=wanted)
        qs.update(wanted=False)

    def update_selected(self):
        sets = self.sets()
        for s in sets:
            if s.filter(Q(is_video=True) | Q(is_audio=True)).filter(available=False).count() == 0:
                update = False
                self.files.exclude(id__in=s).exclude(part=None).update(part=None)
                deselect = self.files.filter(selected=True).exclude(id__in=s)
                if deselect.count() > 0:
                    deselect.update(selected=False)
                    update = True
                if s.filter(selected=False).count() > 0:
                    s.update(selected=True, wanted=False)
                    update = True
                if update:
                    self.rendered = False
                    self.save()
                break
        if not sets:
            self.rendered = False
            self.files.filter(selected=True).update(selected=False)
            self.save()

    def audio_tracks(self):
        tracks = [f['language']
                  for f in self.files.filter(selected=True).filter(Q(is_video=True) | Q(is_audio=True)).values('language')
                  if f['language']]
        return sorted(set(tracks))

    def streams(self, track=None):
        files = self.files.filter(selected=True).filter(Q(is_audio=True) | Q(is_video=True))
        qs = archive.models.Stream.objects.filter(
            file__in=files, source=None, available=True
        ).select_related()
        if not track:
            tracks = self.audio_tracks()
            if len(tracks) > 1:
                if settings.CONFIG['language'] in tracks:
                    track = settings.CONFIG['language']
                else:
                    track = tracks[0]
        if track:
            qs = qs.filter(file__language=track)
        qs = qs.order_by('file__part', 'file__sort_path')
        return qs

    def update_timeline(self, async_=True):
        streams = self.streams()
        self.make_timeline()
        if streams.count() == 1:
            self.data['hue'], self.data['saturation'], self.data['lightness'] = streams[0].color
            self.data['cuts'] = streams[0].cuts
            self.data['volume'] = streams[0].volume
        else:
            self.data['cuts'] = extract.cuts(self.timeline_prefix)
            self.data['volume'] = 0
            offset = 0
            color = [0, 0, 0]
            n = streams.count()
            for s in streams:
                self.data['volume'] += s.volume * s.duration
                color = [(a+b)/n for a, b in zip(color, ox.image.getRGB(s.color or [0.0] * 3))]
                offset += s.duration
            self.data['hue'], self.data['saturation'], self.data['lightness'] = ox.image.getHSL(color)
            if offset:
                self.data['volume'] /= offset
        # extract.timeline_strip(self, self.data['cuts'], stream.info, self.timeline_prefix[:-8])
        self.cache = self.json()
        self.update_sort()
        self.select_frame()
        self.make_poster()
        self.make_icon()
        self.rendered = streams.count() > 0
        self.save()
        if self.rendered:
            if async_:
                get_sequences.delay(self.public_id)
            else:
                get_sequences(self.public_id)
            tasks.load_subtitles.delay(self.public_id)

    def update_cache(self, **kwargs):
        self.cache = self.json()
        Item.objects.filter(id=self.id).update(cache=self.cache, **kwargs)

    def save_poster(self, data):
        self.poster.name = self.path('poster.jpg')
        poster = self.poster.path
        with open(poster, 'wb') as f:
            f.write(data)
        self.poster_height = self.poster.height
        self.poster_width = self.poster.width
        self.clear_poster_cache(self.poster.path)
        if self.cache.get('posterRatio') != self.poster_width / self.poster_height:
            self.update_cache(poster_width=self.poster_width,
                              poster_height=self.poster_height)

    def prefered_poster_url(self):
        if settings.DATA_SERVICE:
            external_posters = self.external_data.get('posters', {})
            service = self.poster_source
            if service and service != settings.URL and service in external_posters:
                return external_posters[service][0]['url']
            if not service:
                for service in settings.POSTER_PRECEDENCE:
                    if service in external_posters:
                        for p in external_posters[service]:
                            if service in settings.POSTER_ONLY_PORTRAIT and p['width'] > p['height']:
                                continue
                            return p['url']
        return None

    def make_timeline(self):
        streams = self.streams()
        if streams.count() > 1:
            timelines = []
            durations = []
            for s in self.streams():
                timelines.append(s.timeline_prefix)
                durations.append(s.duration)
            join_tiles(timelines, durations, self.timeline_prefix)
        else:
            # remove joined timeline if it was created at some point
            for f in glob(os.path.join(settings.MEDIA_ROOT, self.path(), 'timeline*.jpg')):
                os.unlink(f)

    def remove_poster(self):
        if self.poster:
            self.clear_poster_cache(self.poster.path)
            self.poster.delete()
        self.clear_poster_cache(os.path.join(settings.MEDIA_ROOT, self.path('siteposter.jpg')))

    def clear_poster_cache(self, poster=None):
        if poster is None:
            poster = self.poster.path
        for f in glob(poster.replace('.jpg', '*.jpg')):
            if f != poster:
                try:
                    os.unlink(f)
                except OSError:
                    pass

    def make_poster(self):
        ox.makedirs(os.path.join(settings.MEDIA_ROOT, self.path()))
        poster = self.path('poster.jpg')
        poster = os.path.abspath(os.path.join(settings.MEDIA_ROOT, poster))

        if self.poster and self.poster.path != poster:
            self.clear_poster_cache(self.poster.path)
            self.poster.delete()

        if not self.poster or not os.path.exists(self.poster.path):
            poster = self.make_siteposter()
            url = self.prefered_poster_url()
            if url:
                data = ox.net.read_url(url)
                self.save_poster(data)
            elif os.path.exists(poster):
                with open(poster, 'rb') as f:
                    data = f.read()
                    if data:
                        self.save_poster(data)
            self.clear_poster_cache(poster)

    def make_siteposter(self):
        poster = self.path('siteposter.jpg')
        poster = os.path.abspath(os.path.join(settings.MEDIA_ROOT, poster))

        frame = self.get_poster_frame_path()
        timeline = '%stimelineantialias64p.jpg' % self.timeline_prefix
        audio_timeline = '%stimelineaudio64p.jpg' % self.timeline_prefix
        if not os.path.exists(timeline) and os.path.exists(audio_timeline):
            timeline = audio_timeline

        cmd = [settings.ITEM_POSTER, '-d', '-', '-p', poster]
        data = self.json()
        if frame:
            data['frame'] = frame
        if os.path.exists(timeline):
            data['timeline'] = timeline
        data['oxdbId'] = self.oxdbId or self.oxdb_id() or self.public_id
        data = utils.normalize_dict('NFC', data)
        ox.makedirs(os.path.join(settings.MEDIA_ROOT, self.path()))
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE, close_fds=True)
        p.communicate(json.dumps(data, default=to_json).encode('utf-8'))
        self.clear_poster_cache(poster)
        return poster

    def poster_frames(self):
        frames = []
        if settings.CONFIG['media']['importFrames']:
            offset = 0
            for f in self.files.filter(selected=True, is_video=True).order_by('sort_path'):
                for ff in f.frames.all().order_by('position'):
                    if ff.frame:
                        frames.append({
                            'position': offset + ff.position,
                            'path': ff.frame.path,
                            'width': ff.width,
                            'height': ff.height
                        })
                offset += f.duration
        else:
            if 'videoRatio' in self.cache and self.sort.duration and self.streams():
                width, height = self.cache['resolution']
                if width and height:
                    pos = self.sort.duration / 2
                    for p in [pos/2, pos, pos+pos/2]:
                        p = int(p)
                        path = self.frame(p, height)
                        if path:
                            frames.append({
                                'position': p,
                                'path': path,
                                'width': width,
                                'height': height,
                            })
        return frames

    def select_frame(self):
        frames = self.poster_frames()
        if frames:
            heat = [ox.image.getImageHeat(f['path']) for f in frames]
            self.poster_frame = heat.index(max(heat))
            if not settings.CONFIG['media']['importFrames']:
                self.poster_frame = frames[self.poster_frame]['position']

    def get_poster_frame_path(self):
        path = None
        frames = self.poster_frames()
        if frames and self.poster_frame < 0:
            self.select_frame()
        if self.poster_frame >= 0:
            if settings.CONFIG['media']['importFrames']:
                if frames and len(frames) > int(self.poster_frame):
                    path = frames[int(self.poster_frame)]['path']
                elif frames:
                    path = frames[int(len(frames)/2)]['path']
            else:
                size = max(settings.CONFIG['video']['resolutions'])
                path = self.frame(self.poster_frame, size)

        return path

    def make_icon(self):
        frame = self.get_poster_frame_path()
        icon = self.path('icon.jpg')
        self.icon.name = icon
        timeline = '%stimelineantialias64p.jpg' % self.timeline_prefix
        audio_timeline = '%stimelineaudio64p.jpg' % self.timeline_prefix
        if not os.path.exists(timeline) and os.path.exists(audio_timeline):
            timeline = audio_timeline
        cmd = [settings.ITEM_ICON, '-i', self.icon.path]
        if os.path.exists(timeline):
            cmd += ['-l', timeline]
        if frame:
            cmd += ['-f', frame]
        if settings.ITEM_ICON_DATA:
            cmd += '-d', '-'
            data = self.json()
            data = utils.normalize_dict('NFC', data)
            p = subprocess.Popen(cmd, stdin=subprocess.PIPE, close_fds=True)
            p.communicate(json.dumps(data, default=to_json).encode('utf-8'))
        else:
            p = subprocess.Popen(cmd, close_fds=True)
            p.wait()
        # remove cached versions
        icon = os.path.abspath(os.path.join(settings.MEDIA_ROOT, icon))
        for f in glob(icon.replace('.jpg', '*.jpg')):
            if f != icon:
                try:
                    os.unlink(f)
                except OSError:
                    pass
        return icon

    def add_empty_clips(self):
        if not settings.EMPTY_CLIPS:
            return
        subtitles = utils.get_by_key(settings.CONFIG['layers'], 'isSubtitles', True)
        if not subtitles:
            return
        # otherwise add empty 5 seconds annotation every minute
        duration = sum([s[0] for s in self.streams().values_list('duration')])
        layer = subtitles['id']
        # FIXME: allow annotations from no user instead?
        user = User.objects.all().order_by('id')[0]

        clips = [(i, i+5) for i in range(0, int(duration) - 5, 60)]
        exist = []
        delete = []
        for a in Annotation.objects.filter(layer=layer, item=self, value=''):
            clip = (a.start, a.end)
            if clip not in clips:
                delete.append(a.id)
            else:
                exist.append(clip)
        if delete:
            Annotation.objects.filter(layer=layer, item=self, value='', id__in=delete).delete()
        clips = list(set(clips) - set(exist))
        for clip in clips:
            annotation = Annotation(
                item=self,
                layer=layer,
                start=clip[0],
                end=clip[1],
                value='',
                user=user
            )
            annotation.save()

    def load_subtitles(self, force=False):
        subtitles = utils.get_by_key(settings.CONFIG['layers'], 'isSubtitles', True)
        if not subtitles:
            return
        layer = subtitles['id']
        existing = self.annotations.filter(layer=layer).exclude(value='')
        # only import on 0xdb for now or if forced manually
        # since this will remove all existing subtitles
        if force or not existing.count() or settings.USE_IMDB:
            new = []
            current = [(v.start, v.end, v.value) for v in Annotation.objects.filter(layer=layer, item=self)]
            current.sort()
            offset = 0
            language = ''
            subtitles = self.files.filter(selected=True, is_subtitle=True, available=True)
            languages = [f.language for f in subtitles]
            if languages:
                if 'en' in languages:
                    language = 'en'
                elif '' in languages:
                    language = ''
                else:
                    language = languages[0]

            # loop over all videos
            for f in self.files.filter(Q(is_audio=True) | Q(is_video=True)) \
                               .filter(selected=True).order_by('sort_path'):
                subtitles_added = False
                prefix = os.path.splitext(f.path)[0]
                if f.instances.all().count() > 0:
                    user = f.instances.all()[0].volume.user
                else:
                    # FIXME: allow annotations from no user instead?
                    user = User.objects.all().order_by('id')[0]
                # if there is a subtitle with the same prefix, import
                q = subtitles.filter(path__startswith=prefix,
                                     language=language)
                if q.count() == 1:
                    s = q[0]
                    for data in s.srt(offset):
                        subtitles_added = True
                        value = data['value'].replace('\n', '<br>\n').replace('<br><br>\n', '<br>\n')
                        if data['in'] < self.cache['duration'] and data['out'] > self.cache['duration']:
                            data['out'] = self.cache['duration']
                        if data['in'] < self.cache['duration']:
                            new.append((float('%0.03f' % data['in']), float('%0.03f' % data['out']), value))
                # otherwise add empty 5 seconds annotation every minute
                if not subtitles_added:
                    start = offset and int(offset / 60) * 60 + 60 or 0
                    for i in range(start,
                                   int(offset + f.duration) - 5,
                                   60):
                        new.append((i, i+5, ''))
                offset += f.duration
            if current != new:
                with transaction.atomic():
                    # FIXME: only reset if most subtitles are new
                    Annotation.objects.filter(layer=layer, item=self).delete()
                    AnnotationSequence.reset(self)
                    for start, end, value in new:
                        annotation = Annotation(
                            item=self,
                            layer=layer,
                            start=start,
                            end=end,
                            value=value,
                            user=user
                        )
                        annotation.save(delay_matches=True)
                    # remove left over clips without annotations
                    Clip.objects.filter(item=self, annotations__id=None).delete()
                for a in self.annotations.filter(layer=layer):
                    a.update_matches()
            return True
        else:
            self.add_empty_clips()
            return False

    def srt(self, layer, language=None, encoder=ox.srt):
        def format_value(value):
            value = value.replace('<br/>', '<br>').replace('<br>\n', '\n').replace('<br>', '\n')
            value = value.replace('\n\n', '<br>\n')
            return value
        annotations = self.annotations.filter(layer=layer).exclude(value='')
        if language:
            annotations = annotations.filter(languages__contains=language)

        return encoder.encode([{
            'in': a.start,
            'out': a.end,
            'value': format_value(a.value)
        } for a in annotations.order_by('start', 'end', 'sortvalue')])

    def next_annotationid(self):
        return AnnotationSequence.nextid(self)

def delete_item(sender, **kwargs):
    i = kwargs['instance']
    i.delete_files()
pre_delete.connect(delete_item, sender=Item)

Item.facet_keys = []
Item.layer_facet_keys = []
Item.poster_keys = []
for key in settings.CONFIG['itemKeys']:
    if 'autocomplete' in key and 'autocompleteSortKey' not in key or \
            key.get('filter'):
        Item.facet_keys.append(key['id'])
    elif key.get('type') == 'layer' and \
            utils.get_by_id(settings.CONFIG['layers'], key['id']).get('type') == 'string':
        Item.facet_keys.append(key['id'])
    if key['id'] in ('title', 'director', 'year') or key.get('poster'):
        Item.poster_keys.append(key['id'])
    if key.get('type') == 'layer' and (
            key.get('filter') or
            utils.get_by_id(settings.CONFIG['layers'], key['id']).get('type') == 'string'
    ):
        Item.layer_facet_keys.append(key['id'])

Item.person_keys = []
for key in settings.CONFIG['itemKeys']:
    if key.get('sortType') == 'person':
        Item.person_keys.append(key['id'])

class ItemFind(models.Model):
    """
        used to find items,
        item.update_find populates this table
        its used in manager.ItemManager
    """

    class Meta:
        unique_together = ("item", "key")

    item = models.ForeignKey('Item', related_name='find', db_index=True, on_delete=models.CASCADE)
    key = models.CharField(max_length=200, db_index=True)
    value = models.TextField(blank=True, db_index=settings.DB_GIN_TRGM)

    def __str__(self):
        return "%s=%s" % (self.key, self.value)
'''
ItemSort
table constructed based on info in settings.CONFIG['itemKeys']
'''
attrs = {
    '__module__': 'item.models',
    'item': models.OneToOneField('Item', related_name='sort', primary_key=True, on_delete=models.CASCADE),
    'duration': models.FloatField(null=True, blank=True, db_index=True),
    'width': models.BigIntegerField(null=True, blank=True, db_index=True),
    'height': models.BigIntegerField(null=True, blank=True, db_index=True),
    'created': models.DateTimeField(null=True, blank=True, db_index=True),
}
for key in list(filter(lambda k: k.get('sort', False) or k['type'] in ('integer', 'time', 'float', 'date', 'enum'), settings.CONFIG['itemKeys'])):
    name = key['id']
    name = {'id': 'public_id'}.get(name, name)
    sort_type = key.get('sortType', key['type'])
    if isinstance(sort_type, list):
        sort_type = sort_type[0]
    field = get_sort_field(sort_type)
    if name not in attrs:
        attrs[name] = field[0](**field[1])

ItemSort = type('ItemSort', (models.Model,), attrs)
ItemSort.fields = [f.name for f in ItemSort._meta.fields]

class Access(models.Model):
    class Meta:
        unique_together = ("item", "user")

    access = models.DateTimeField(auto_now=True)
    item = models.ForeignKey(Item, related_name='accessed', on_delete=models.CASCADE)
    user = models.ForeignKey(User, null=True, related_name='accessed_items', on_delete=models.CASCADE)
    accessed = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.accessed:
            self.accessed = 0
        self.accessed += 1
        super(Access, self).save(*args, **kwargs)
        timesaccessed = Access.objects.filter(item=self.item).aggregate(Sum('accessed'))['accessed__sum']
        ItemSort.objects.filter(item=self.item).update(timesaccessed=timesaccessed, accessed=self.access)

    def __str__(self):
        if self.user:
            return "%s/%s/%s" % (self.user, self.item, self.access)
        return "%s/%s" % (self.item, self.access)

class Facet(models.Model):
    '''
        used for keys that can have multiple values like people, languages etc.
        does not perform to well if total number of items goes above 10k
        this happens for keywords in 0xdb right now
    '''

    class Meta:
        unique_together = ("item", "key", "value")

    item = models.ForeignKey('Item', related_name='facets', on_delete=models.CASCADE)
    key = models.CharField(max_length=200, db_index=True)
    value = models.CharField(max_length=1000, db_index=True)
    sortvalue = models.CharField(max_length=1000, db_index=True)

    def __str__(self):
        return "%s=%s" % (self.key, self.value)

    def save(self, *args, **kwargs):
        if not self.sortvalue:
            self.sortvalue = utils.sort_string(self.value).lower()[:900]
        self.sotvalue = self.sortvalue.lower()
        super(Facet, self).save(*args, **kwargs)

class Description(models.Model):
    '''
        shared itemkey descriptions
    '''
    class Meta:
        unique_together = ("key", "value")
    key = models.CharField(max_length=200, db_index=True)
    value = models.CharField(max_length=1000, db_index=True)
    description = models.TextField()

    def __str__(self):
        return "%s=%s" % (self.key, self.value)

class AnnotationSequence(models.Model):
    item = models.OneToOneField('Item', related_name='_annotation_sequence', on_delete=models.CASCADE)
    value = models.BigIntegerField(default=1)

    @classmethod
    def reset(cls, item):
        s, created = cls.objects.get_or_create(item=item)
        ids = [ox.fromAZ(a['public_id'].split('/')[1])
               for a in item.annotations.exclude(public_id=None).values('public_id')]
        s.value = max(ids) if ids else 0
        s.save()

    @classmethod
    def nextid(cls, item):
        s, created = cls.objects.get_or_create(item=item)
        if created:
            nextid = s.value
        else:
            cursor = connection.cursor()
            sql = "UPDATE %s SET value = value + 1 WHERE item_id = %s RETURNING value" % (cls._meta.db_table, item.id)
            cursor.execute(sql)
            nextid = cursor.fetchone()[0]
        return "%s/%s" % (item.public_id, ox.toAZ(nextid))
