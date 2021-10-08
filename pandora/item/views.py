# -*- coding: utf-8 -*-

from datetime import datetime, timedelta
from urllib.parse import quote, urlparse
import mimetypes
import os.path
import random
import time

from PIL import Image
from django.db.models import Count, Sum
from django.http import HttpResponse, HttpResponseForbidden, Http404
from django.shortcuts import get_object_or_404, redirect, render
from django.core.files.temp import NamedTemporaryFile
from wsgiref.util import FileWrapper
from django.conf import settings

from ox.utils import json, ET

from oxdjango.decorators import login_required_json
from oxdjango.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from oxdjango.http import HttpFileResponse
import ox

from . import models
from . import utils
from . import tasks

from archive.models import File, Stream
from archive import extract
from clip.models import Clip 
from user.models import has_capability
from changelog.models import add_changelog

from oxdjango.api import actions


def _order_query(qs, sort, prefix='sort__'):
    order_by = []
    if len(sort) == 1:
        additional_sort = settings.CONFIG['user']['ui']['listSort']
        key = utils.get_by_id(settings.CONFIG['itemKeys'], sort[0]['key'])
        for s in key.get('additionalSort', additional_sort):
            sort.append(s)
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'id': 'public_id',
            'index': 'listitem__index'
        }.get(e['key'], e['key'])
        if key not in ('listitem__index', ):
            key = "%s%s" % (prefix, key)
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    return qs

def _order_by_group(query):
    if 'sort' in query:
        if len(query['sort']) == 1 and query['sort'][0]['key'] == 'items':
            order_by = query['sort'][0]['operator'] == '-' and '-items' or 'items'
            if query['group'] == "year":
                secondary = query['sort'][0]['operator'] == '-' and '-sortvalue' or 'sortvalue'
                order_by = (order_by, secondary)
            elif query['group'] != "keyword":
                order_by = (order_by, 'sortvalue')
            else:
                order_by = (order_by, 'value')
        else:
            order_by = query['sort'][0]['operator'] == '-' and '-sortvalue' or 'sortvalue'
            order_by = (order_by, 'items')
    else:
        order_by = ('-sortvalue', 'items')
    return order_by

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key': 'title', 'operator': '+'}]
    for key in ('sort', 'keys', 'group', 'range', 'position', 'positions'):
        if key in data:
            query[key] = data[key]
    if [r for r in query['range'] if not isinstance(r, int)]:
        query['range'] = [0, 0]
    query['qs'] = models.Item.objects.find(data, user)
    if 'clips' in data:
        conditions = {'query': data['clips']['query']}
        query['clip_qs'] = Clip.objects.find(conditions, user).order_by('start')
        query['clip_filter'] = models.Clip.objects.filter_annotations(conditions, user)
        query['clip_items'] = max(data['clips'].get('items', 5), 0)
        query['clip_keys'] = data['clips'].get('keys')
        if not query['clip_keys']:
            query['clip_keys'] = ['id', 'in', 'out', 'annotations']

    # group by only allows sorting by name or number of itmes
    return query

def get_group(request, query, data):
    group = {
        'items': []
    }
    items = 'items'
    item_qs = query['qs']
    order_by = _order_by_group(query)
    qs = models.Facet.objects.filter(key=query['group']).filter(item__id__in=item_qs)
    qs = qs.values('value').annotate(items=Count('id')).order_by(*order_by)

    if 'positions' in query:
        group['positions'] = {}
        ids = [j['value'] for j in qs]
        group['positions'] = utils.get_positions(ids, query['positions'])
    elif 'range' in data:
        qs = qs[query['range'][0]:query['range'][1]]
        group['items'] = [{'name': i['value'], 'items': i[items]} for i in qs]
    else:
        group['items'] = qs.count()
    return group

def get_position(request, query, data):
    response = {}
    qs = _order_query(query['qs'], query['sort'])
    ids = [j['public_id'] for j in qs.values('public_id')]
    data['conditions'] = data['conditions'] + {
        'value': query['position'],
        'key': query['sort'][0]['key'],
        'operator': '^'
    }
    query = parse_query(data, request.user)
    qs = _order_query(query['qs'], query['sort'])
    if qs.count() > 0:
        response['position'] = utils.get_positions(ids, [qs[0].public_id])[0]
    return response

def get_positions(request, query):
    qs = _order_query(query['qs'], query['sort'])
    ids = list(qs.values_list('public_id', flat=True))
    return utils.get_positions(ids, query['positions'])

def is_editable(request, item):
    if request.user.is_anonymous:
        return False
    if not hasattr(request, 'user_group_names'):
        request.user_group_names = {g.name for g in request.user.groups.all()}
    if request.user.profile.capability('canEditMetadata') or \
            request.user.is_staff or \
            item.get('user') == request.user.username or \
            set(item.get('groups', [])) & request.user_group_names:
        return True
    return False

def get_clips(query, qs):
    n = qs.count()
    if n > query['clip_items']:
        num = query['clip_items']
        clips = []
        step = int(n / (num + 1))
        i = step
        while i <= (n - step) and i < n and len(clips) < num:
            clips.append(qs[i])
            i += step
    else:
        clips = qs
    return [c.json(query['clip_keys'], query['clip_filter']) for c in clips]

def only_p_sums(request, query, m):
    r = {}
    for p in query['keys']:
        if p == 'accessed':
            r[p] = m.sort.accessed or ''
        elif p == 'editable':
            r[p] = is_editable(request, m.cache)
        elif p in item_sort_keys:
            r[p] = getattr(m.sort, p)
        else:
            r[p] = m.cache.get(p)
    if 'clip_qs' in query:
        r['clips'] = get_clips(query, query['clip_qs'].filter(item=m))
    return r

def only_p(request, query, m):
    r = {}
    if m:
        if not isinstance(m, dict):
            m = json.loads(m, object_hook=oxdjango.fields.from_json)
        for p in query['keys']:
            if p == 'editable':
                r[p] = is_editable(request, m)
            else:
                r[p] = m.get(p)
    if 'clip_qs' in query:
        r['clips'] = get_clips(query['clip_qs'].filter(item__public_id=m['id']))
    return r

item_sort_keys = {
    'accessed', 'modified', 'timesaccessed',
    'numberofannotations', 'numberoffiles', 'numberofdocuments'
}

def get_items(request, query):
    items = []
    qs = _order_query(query['qs'], query['sort'])
    qs = qs[query['range'][0]:query['range'][1]]
    # items = [m.json(_p) for m in qs]
    if any(p for p in query['keys'] if p in item_sort_keys):
        qs = qs.select_related()
        items = [only_p_sums(request, query, m) for m in qs]
    else:
        items = [only_p(request, query, m['cache']) for m in qs.values('cache')]
    return items

def get_stats(request, query):
    stats = {}
    items = query['qs']
    files = File.objects.filter(item__in=items).filter(selected=True).filter(size__gt=0)
    r = files.aggregate(
        Sum('duration'),
        Sum('pixels'),
        Sum('size')
    )
    totals = [
        i['id']
        for i in settings.CONFIG['totals']
        if 'capability' not in i or has_capability(request.user, i['capability'])
    ]
    if 'duration' in totals:
        stats['duration'] = r['duration__sum']
    if 'files' in totals:
        stats['files'] = files.count()
    if 'items' in totals:
        stats['items'] = items.count()
    if 'pixels' in totals:
        stats['pixels'] = r['pixels__sum']
    if 'runtime' in totals:
        stats['runtime'] = items.aggregate(Sum('sort__runtime'))['sort__runtime__sum'] or 0
    if 'size' in totals:
        stats['size'] = r['size__sum']
    for key in ('runtime', 'duration', 'pixels', 'size'):
        if key in totals and stats[key] is None:
            stats[key] = 0
    return stats

def find(request, data):
    '''
    Finds items for a given query
    takes {
        clipsQuery: object, // clips query object (optional)
        group: string, // item key to group results by (optional)
        keys: [string], // list of keys to return, [] for all (optional)
        positions: [string], // list of item ids (optional)
        query: { // query object
            conditions: [{ // list of condition objects...
                key: string, // item key
                operator: string, // comparison operator, see below
                value: string // value
            }, { // ... and/or query objects (nested subconditions)
                conditions: [object, ...], // list of condition objects
                operator: string // logical operator, '&' or '|'
            }],
            operator: string // logical operator, '&' or '|'
        },
        range: [int, int] // items to return, per current sort order
        sort: [{ // list of sort objects, applied in the given ordering
            key: string, // item key
            operator: string // sort operator, '+' or '-'
        }]
    }
    returns { // if `keys` is present
        items: [ // returns list of matching items
            {
                id: string, // item id
                ... // more item properties
            },
            ... // more items
        ]
    } or { // if `clipsQuery` is present
        clips: [ // returns list of matching clips
            {
                id: string, // clip id
                ... // more clip properties
            },
            ... // more clips
        ]
    } or { // if `group` is present
        items: [ // returns results for filters
            {
                name: string, // value for item key specified as group
                items: int // number of matches
            },
            ... // more group objects
        ]
    } or { // if `keys` is missing
        items: int // returns total number of items
    } or { // if `positions` is present
        positions: { // returns positions of given items
            id: position, // position of the item, per current sort order
            ... // more id/position pairs
        }
    }
    notes: Comparison operators are '=' (contains) '==' (is), '^' (starts with),
    '$' (ends with), '<', '<=', '>', or '>=', each optionally prefixed with '!'
    (not).
    To make a query for "all videos in groups that the user is in", pass
    "groups" as key and "$my" as value.
    Leaving out `keys` or passing `positions` can be useful when building a
    responsive UI: First leave out `keys` to get totals as fast as possible,
    then pass `positions` to get the positions of previously selected items,
    finally make the query with the `keys` you need and an appropriate `range`.
    For more examples, see https://wiki.0x2620.org/wiki/pandora/QuerySyntax.
    see: add, edit, get, lookup, remove, upload
    '''
    if settings.JSON_DEBUG:
        print(json.dumps(data, indent=2))
    query = parse_query(data, request.user)

    response = json_response({})
    if 'group' in query:
        response['data'] = get_group(request, query, data)
    elif 'position' in query:
        response['data'] = get_position(request, query, data)
    elif 'positions' in query:
        response['data']['positions'] = get_positions(request, query)
    elif 'keys' in query:
        response['data']['items'] = get_items(request, query)
    else:  # otherwise stats
        response['data'] = get_stats(request, query)
    return render_to_json_response(response)
actions.register(find)

def autocomplete(request, data):
    '''
    Returns autocomplete strings for a given item key and search string
    takes {
        key: string, // item key
        value: string, // search string
        operator: string, // '=', '==', '^', '$'
        query: object, // item query to limit results, see `find`
        range: [int, int] // range of results to return
    }
    returns {
        items: [string, ...] // list of matching strings
    }
    see: autocompleteDocuments, autocompleteEntities
    '''
    if 'range' not in data:
        data['range'] = [0, 10]
    op = data.get('operator', '=')

    key = utils.get_by_id(settings.CONFIG['itemKeys'], data['key'])
    order_by = key.get('autocompleteSort', False)
    if order_by:
        for o in order_by:
            if o['operator'] != '-':
                o['operator'] = ''
        order_by = ['%(operator)ssort__%(key)s' % o for o in order_by]
    else:
        order_by = ['-items']
    sort_type = key.get('sortType', key.get('type', 'string'))
    if sort_type == 'title':
        qs = parse_query({'query': data.get('query', {})}, request.user)['qs']
        if data['value']:
            if op == '=':
                qs = qs.filter(find__key=data['key'], find__value__icontains=data['value'])
            elif op == '==':
                qs = qs.filter(find__key=data['key'], find__value__iexact=data['value'])
            elif op == '^':
                qs = qs.filter(find__key=data['key'], find__value__istartswith=data['value'])
            elif op == '$':
                qs = qs.filter(find__key=data['key'], find__value__iendswith=data['value'])
        qs = qs.order_by(*order_by, nulls_last=True)
        qs = qs[data['range'][0]:data['range'][1]]
        response = json_response({})
        response['data']['items'] = list(set([i.get(data['key']) for i in qs]))
    else:
        qs = models.Facet.objects.filter(key=data['key'])
        if data['value']:
            if op == '=':
                qs = qs.filter(value__icontains=data['value'])
            elif op == '==':
                qs = qs.filter(value__iexact=data['value'])
            elif op == '^':
                qs = qs.filter(value__istartswith=data['value'])
            elif op == '$':
                qs = qs.filter(value__iendswith=data['value'])
        if 'query' in data:
            item_query = parse_query({'query': data.get('query', {})}, request.user)['qs']
            qs = qs.filter(item__in=item_query)
        qs = qs.values('value').annotate(items=Count('id'))
        qs = qs.order_by(*order_by)
        qs = qs[data['range'][0]:data['range'][1]]
        response = json_response({})
        response['data']['items'] = [i['value'] for i in qs]
    return render_to_json_response(response)
actions.register(autocomplete)

def findId(request, data):
    '''
    Undocumented
    takes {
        id: string
        title: string
        director: [string]
        year: int
    }
    '''
    response = json_response({})
    response['data']['items'] = []
    if 'id' in data:
        qs = models.Item.objects.filter(public_id=data['id'])
        if qs.count() == 1:
            response['data']['items'] = [
                i.json(['title', 'director', 'year', 'id']) for i in qs
            ]

    if not response['data']['items'] \
            and settings.USE_IMDB \
            and settings.DATA_SERVICE:
        r = models.external_data('getId', data)
        if r['status']['code'] == 200:
            response['data']['items'] = [r['data']]
    return render_to_json_response(response)
actions.register(findId)


def getMetadata(request, data):
    '''
    Gets metadata from an external service
    takes {
        id: string, // item id
        keys: [string] // list of item keys to return
    }
    returns {
       key: value // item key and value
       ... // more key/value pairs
    }
    notes: This can be used to populate metadata from a remote source, like
    IMDb.
    see: getIds, updateExternalData
    '''
    response = json_response({})
    if settings.DATA_SERVICE:
        '''
        info = {}
        for c in data['query']['conditions']:
            info[c['key']] = c['value']
        r = models.external_data('getId', info)
        '''
        r = models.external_data('getData', {'id': data['id']})
        if r['status']['code'] == 200:
            if 'keys' in data and data['keys']:
                for key in data['keys']:
                    if key in r['data']:
                        response['data'][key] = r['data'][key]
            else:
                response['data'] = r['data']
    return render_to_json_response(response)
actions.register(getMetadata)

def getIds(request, data):
    '''
    Gets ids from an external service
    takes {
        title: string, // title
        director: [string], // list of directors
        year: int // year
    }
    returns {
        items: [{
            title: string, // title
            director: [string], // list of directors
            year: int, // year
            originalTitle: string // original title
        }]
    }
    notes: This can be used to populate metadata from a remote source, like
    IMDb.
    see: getMetadata, updateExternalData
    '''
    response = json_response({})
    if settings.DATA_SERVICE:
        r = models.external_data('getIds', data)
        if r['status']['code'] == 200:
            response['data']['items'] = r['data']['items']
    else:
        response['data']['items']
    return render_to_json_response(response)
actions.register(getIds)

def get(request, data):
    '''
    Gets an item by id
    takes {
        id: string, // item id
        keys: [string] // item properties to return
    }
    returns {
        key: value, // item key and value
        ... // more key/value pairs
    }
    see: add, edit, find, lookup, remove, upload
    '''
    response = json_response({})
    data['keys'] = data.get('keys', [])
    item = get_object_or_404_json(models.Item, public_id=data['id'])
    if item.access(request.user):
        info = item.json(data['keys'])
        if not data['keys'] or 'stream' in data['keys']:
            info['stream'] = item.get_stream()
        if not data['keys'] or 'streams' in data['keys']:
            info['streams'] = [s.file.oshash for s in item.streams()]
        if data['keys'] and 'layers' in data['keys']:
            info['layers'] = item.get_layers(request.user)
        if data['keys'] and 'documents' in data['keys']:
            info['documents'] = item.get_documents(request.user)
        if data['keys'] and 'files' in data['keys']:
            info['files'] = item.get_files(request.user)
        if not data['keys'] or 'groups' in data['keys'] \
                and item.editable(request.user):
            info['groups'] = [g.name for g in item.groups.all()]
        for k in settings.CONFIG['itemKeys']:
            if 'capability' in k \
                    and not (item.editable(request.user) or has_capability(request.user, k['capability'])) \
                    and k['id'] in info \
                    and k['id'] not in ('parts', 'durations', 'duration'):
                del info[k['id']]
        info['editable'] = item.editable(request.user)
        response['data'] = info
    else:
        # response = json_response(status=403, text='permission denied')
        response = json_response(status=404, text='not found')
    return render_to_json_response(response)
actions.register(get)

def edit_item(user, item, data, is_task=False):
    data = data.copy()
    update_clips = False
    response = json_response(status=200, text='ok')
    if 'rightslevel' in data:
        if user.profile.capability('canEditRightsLevel'):
            item.level = int(data['rightslevel'])
        else:
            response = json_response(status=403, text='permission denied')
        del data['rightslevel']
    if 'user' in data:
        if user.profile.get_level() in ('admin', 'staff') and \
                models.User.objects.filter(username=data['user']).exists():
            new_user = models.User.objects.get(username=data['user'])
            if new_user != item.user:
                item.user = new_user
                update_clips = True
        del data['user']
    if 'groups' in data:
        if not user.profile.capability('canManageUsers'):
            # Users wihtout canManageUsers can only add/remove groups they are not in
            groups = set([g.name for g in item.groups.all()])
            user_groups = set([g.name for g in user.groups.all()])
            other_groups = list(groups - user_groups)
            data['groups'] = [g for g in data['groups'] if g in user_groups] + other_groups
    r = item.edit(data, is_task=is_tras)
    if r:
        r.wait()
    if update_clips:
        tasks.update_clips.delay(item.public_id)
    return response

@login_required_json
def add(request, data):
    '''
    Adds a new item (without video)
    takes {
        title: string, // title (optional)

        ... // more key/value pairs (like edit, can be passed to add)
    }
    returns {
        id: string, // item id
        title: string, // title
        ... // more item properties
    }
    notes: To allow for this, set config option `itemRequiresVideo` to false.
    see: edit, find, get, lookup, remove, upload
    '''
    if not request.user.profile.capability('canAddItems'):
        response = json_response(status=403, text='permission denied')
    else:
        response = json_response(status=200, text='created')
        data['title'] = data.get('title', 'Untitled')
        request_data = data.copy()
        item = models.Item()
        item.data['title'] = data['title']
        item.user = request.user
        p = item.save()
        if p:
            p.wait()
        else:
            i.make_poster()
        del data['title']
        if data:
            response = edit_item(request.user, item, data)
        response['data'] = item.json()
        add_changelog(request, request_data, item.public_id)
    return render_to_json_response(response)
actions.register(add, cache=False)

@login_required_json
def edit(request, data):
    '''
    Edits metadata of an item
    takes {
        id: string, // item id
        key: value, // item key and new value
        ... // more key/value pairs
    }
    returns {
        key: value // item key and new value
        ... // more key/value pairs
    }
    see: add, find, get, lookup, remove, upload
    '''
    if isinstance(data['id'], list):
        add_changelog(request, data)
        t = tasks.bulk_edit.delay(data, request.user.username)
        response = json_response(status=200, text='ok')
        response['data']['taskId'] = t.task_id
    else:
        item = get_object_or_404_json(models.Item, public_id=data['id'])
        if item.editable(request.user):
            add_changelog(request, data)
            response = edit_item(request.user, item, data)
            response['data'] = item.json()
        else:
            response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(edit, cache=False)


def extractClip(request, data):
    '''
    Extract and cache clip

    takes {
        item: string
        resolution: int
        format: string
        in: float
        out: float
    }
    returns {
        taskId: string, // taskId
    }
    '''
    item = get_object_or_404_json(models.Item, public_id=data['item'])
    if not item.access(request.user):
        return HttpResponseForbidden()

    response = json_response()
    t = tasks.extract_clip.delay(data['item'], data['in'], data['out'], data['resolution'], data['format'])
    response['data']['taskId'] = t.task_id
    return render_to_json_response(response)
actions.register(extractClip, cache=False)

@login_required_json
def remove(request, data):
    '''
    Removes an item
    takes {
        id: string // item id
    }
    returns {}
    notes: The return status code is 200 for success or 403 for permission denied.
    see: add, edit, find, get, lookup, upload
    '''
    response = json_response({})
    item = get_object_or_404_json(models.Item, public_id=data['id'])
    user = request.user
    if user.profile.capability('canRemoveItems') or \
            user.is_staff or \
            item.user == user or \
            item.groups.filter(id__in=user.groups.all()).count() > 0:
        add_changelog(request, data)
        item.delete()
        response = json_response(status=200, text='removed')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(remove, cache=False)

def setPosterFrame(request, data):
    '''
    Sets the poster frame for an item
    takes {
        id: string, // item id
        position: float // position in seconds
    }
    returns {}
    see: setPoster
    '''
    item = get_object_or_404_json(models.Item, public_id=data['id'])
    if item.editable(request.user):
        item.poster_frame = float(data['position'])
        item.save()
        tasks.update_poster(item.public_id)
        response = json_response()
        add_changelog(request, data)
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(setPosterFrame, cache=False)


def setPoster(request, data):
    '''
    Sets the poster for an item
    takes {
        id: string, // item id
        source: string // poster url
    }
    returns {
        poster: {
            height: int, // height in px
            url: string, // poster url
            width: int // width in px
        }
    }
    see: setPosterFrame
    '''
    item = get_object_or_404_json(models.Item, public_id=data['id'])
    response = json_response()
    if item.editable(request.user):
        valid_sources = [p['source'] for p in item.get_posters()]
        if data['source'] in valid_sources:
            item.poster_source = data['source']
            item.remove_poster()
            item.save()
            tasks.update_poster(item.public_id)
            response = json_response()
            response['data']['posterAspect'] = item.poster_width/item.poster_height
            add_changelog(request, data)
        else:
            response = json_response(status=403, text='invalid poster url')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(setPoster, cache=False)

def updateExternalData(request, data):
    '''
    Updates metadata from an external service
    takes {
        id: string // item id
    }
    returns {
        taskId: string, // taskId
    }
    notes: This can be used to populate metadata from a remote source, like
    IMDb.
    see: getIds, getMetadata
    '''
    item = get_object_or_404_json(models.Item, public_id=data['id'])
    response = json_response()
    if item.editable(request.user):
        t = tasks.update_external.delay(item.public_id)
        response['data']['taskId'] = t.task_id
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(updateExternalData, cache=False)

def lookup(request, data):
    '''
    Looks up an item given partial metadata
    takes {
        director: [string], // directors (optional)
        id: string, // item id (optional)
        title: string, // title (optional)
        year: string // year (optional)
    }
    returns {
        director: [string], // director
        id: string, // item id
        title: string, // title
        year: string // year
    }
    see: add, edit, find, get, remove, upload
    '''
    i = None
    if 'id' in data:
        i = models.Item.objects.get(public_id=data['id'])
    elif not list(filter(None, [d not in ('title', 'year', 'director') for d in data.keys()])):
        qs = models.Item.objects.find({'query': {
            'conditions': [
                {'key': key, 'value': data[key], 'operator': '=='} for key in data
            ],
            'operator': '&'
        }}, request.user)
        if qs.count() == 1:
            i = qs[0]
    if i:
        r = {'id': i.public_id}
        for key in ('title', 'director', 'year'):
            value = i.get(key)
            if value is not None:
                r[key] = value
        response = json_response(r)
    else:
        response = json_response(status=404, text='not found')
    return render_to_json_response(response)
actions.register(lookup)


def frame(request, id, size, position=None):
    item = get_object_or_404(models.Item, public_id=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    frame = None
    if not position:
        if settings.CONFIG['media']['importFrames'] or item.poster_frame == -1:
            frames = item.poster_frames()
            if frames:
                position = item.poster_frame
                if position == -1 or position > len(frames):
                    position = int(len(frames)/2)
                position = frames[int(position)]['position']
            elif item.poster_frame == -1 and item.sort.duration:
                position = item.sort.duration/2
            else:
                position = 0
        else:
            position = item.poster_frame
    else:
        position = float(position.replace(',', '.'))

    if not frame:
        frame = item.frame(position, int(size))

    if not frame:
        frame = os.path.join(settings.STATIC_ROOT, 'jpg/list256.jpg')
        # raise Http404
    response = HttpFileResponse(frame, content_type='image/jpeg')
    if request.method == 'OPTIONS':
        response.allow_access()
    return response

def poster_frame(request, id, position):
    item = get_object_or_404(models.Item, public_id=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    position = int(position)
    frames = item.poster_frames()
    if frames and len(frames) > position:
        frame = frames[position]['path']
        return HttpFileResponse(frame, content_type='image/jpeg')
    raise Http404


def image_path_to_response(image, size=None):
    if size:
        size = int(size)
        path = image.replace('.jpg', '.%d.jpg' % size)
        if not os.path.exists(path):
            image_size = max(Image.open(image).size)
            if size > image_size:
                path = image
            else:
                extract.resize_image(image, path, size=size)
    else:
        path = image
    return HttpFileResponse(path, content_type='image/jpeg')

def image_to_response(image, size=None):
    if size:
        size = int(size)
        path = image.path.replace('.jpg', '.%d.jpg' % size)
        if not os.path.exists(path):
            image_size = max(image.width, image.height)
            if size > image_size:
                path = image.path
            else:
                extract.resize_image(image.path, path, size=size)
    else:
        path = image.path
    return HttpFileResponse(path, content_type='image/jpeg')

def siteposter(request, id, size=None):
    item = get_object_or_404(models.Item, public_id=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    poster = item.path('siteposter.jpg')
    poster = os.path.abspath(os.path.join(settings.MEDIA_ROOT, poster))
    if size:
        size = int(size)
        image = Image.open(poster)
        image_size = max(image.size)
        if size < image_size:
            path = poster.replace('.jpg', '.%d.jpg' % size)
            extract.resize_image(poster, path, size=size)
            poster = path
    return HttpFileResponse(poster, content_type='image/jpeg')


def temp_poster():
    poster_path = os.path.join(settings.STATIC_ROOT, 'jpg/poster.jpg')
    with open(poster_path, 'rb') as fd:
        response = HttpResponse(fd.read(), content_type='image/jpeg')
    response['Cache-Control'] = 'no-store'
    response['Expires'] = datetime.strftime(datetime.utcnow() + timedelta(seconds=10), "%a, %d-%b-%Y %H:%M:%S GMT")
    return response

def poster(request, id, size=None):
    item = get_object_or_404(models.Item, public_id=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    if not item.poster:
        poster_path = os.path.join(settings.MEDIA_ROOT, item.path('poster.jpg'))
        if os.path.exists(poster_path):
            item.poster.name = item.path('poster.jpg')
            item.poster_height = item.poster.height
            item.poster_width = item.poster.width
            models.Item.objects.filter(pk=item.id).update(
                poster=item.poster.name,
                poster_height=item.poster_height,
                poster_width=item.poster_width,
                icon=item.icon.name,
                cache=item.json()
            )
    siteposter = item.path('siteposter.jpg')
    siteposter = os.path.abspath(os.path.join(settings.MEDIA_ROOT, siteposter))
    if item.poster and os.path.exists(item.poster.path):
        return image_to_response(item.poster, size)
    elif os.path.exists(siteposter):
        return image_path_to_response(siteposter, size)
    else:
        return temp_poster()

def icon(request, id, size=None):
    item = get_object_or_404(models.Item, public_id=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    if item.icon and os.path.exists(item.icon.path):
        return image_to_response(item.icon, size)
    else:
        return temp_poster()

def timeline(request, id, size, position=-1, format='jpg', mode=None):
    item = get_object_or_404(models.Item, public_id=id)
    if not item.access(request.user):
        return HttpResponseForbidden()

    modes = [t['id'] for t in settings.CONFIG['timelines']]
    if not mode:
        mode = 'antialias'
        if mode not in modes:
            mode = modes[0]
    if mode not in modes:
        raise Http404
    modes.pop(modes.index(mode))

    prefix = os.path.join(item.timeline_prefix, 'timeline')
    position = int(position)

    def timeline():
        timeline = '%s%s%sp' % (prefix, mode, size) 
        if position > -1:
            timeline += '%d' % int(position)
        return timeline + '.jpg'

    path = timeline()
    while modes and not os.path.exists(path):
        mode = modes.pop(0)
        path = timeline()
    response = HttpFileResponse(path, content_type='image/jpeg')
    if request.method == 'OPTIONS':
        response.allow_access()
    return response

def download_source(request, id, part=None):
    item = get_object_or_404(models.Item, public_id=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    if part:
        part = int(part) - 1
    else:
        part = 0
    streams = item.streams()
    if part > len(streams):
        raise Http404
    f = streams[part].file
    if not f.data:
        raise Http404

    parts = ['%s - %s ' % (item.get('title'), settings.SITENAME), item.public_id]
    if len(streams) > 1:
        parts.append('.Part %d' % (part + 1))
    parts.append('.')
    parts.append(f.extension)
    filename = ''.join(parts)

    path = f.data.path
    content_type = mimetypes.guess_type(path)[0]
    response = HttpFileResponse(path, content_type=content_type)
    response['Content-Disposition'] = "attachment; filename*=UTF-8''%s" % quote(filename.encode('utf-8'))
    return response

def download(request, id, resolution=None, format='webm', part=None):
    item = get_object_or_404(models.Item, public_id=id)
    if not resolution or int(resolution) not in settings.CONFIG['video']['resolutions']:
        resolution = max(settings.CONFIG['video']['resolutions'])
    else:
        resolution = int(resolution)
    if not item.access(request.user) or not item.rendered:
        return HttpResponseForbidden()
    if part is not None:
        part = int(part) - 1
        streams = item.streams()
        if part > len(streams):
            raise Http404
    ext = '.%s' % format
    parts = ['%s - %s ' % (item.get('title'), settings.SITENAME), item.public_id]
    if resolution != max(settings.CONFIG['video']['resolutions']):
        parts.append('.%dp' % resolution)
    if part is not None:
        parts.append('.Part %d' % (part + 1))
    parts.append(ext)
    filename = ''.join(parts)
    video = NamedTemporaryFile(suffix=ext)
    content_type = mimetypes.guess_type(video.name)[0]
    if part is None:
        r = item.merge_streams(video.name, resolution, format)
        if not r:
            return HttpResponseForbidden()
        elif r is True:
            response = HttpResponse(FileWrapper(video), content_type=content_type)
            try:
                response['Content-Length'] = os.path.getsize(video.name)
            except:
                pass
        else:
            response = HttpFileResponse(r, content_type=content_type)
    else:
        stream = streams[part].get(resolution, format)
        path = stream.media.path
        content_type = mimetypes.guess_type(path)[0]
        response = HttpFileResponse(path, content_type=content_type)
    response['Content-Disposition'] = "attachment; filename*=UTF-8''%s" % quote(filename.encode('utf-8'))
    return response

def torrent(request, id, filename=None):
    item = get_object_or_404(models.Item, public_id=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    if not item.torrent:
        raise Http404
    if not filename or filename.endswith('.torrent'):
        response = HttpResponse(item.get_torrent(request),
                                content_type='application/x-bittorrent')
        filename = utils.safe_filename("%s.torrent" % item.get('title'))
        response['Content-Disposition'] = "attachment; filename*=UTF-8''%s" % quote(filename.encode('utf-8'))
        return response
    while filename.startswith('/'):
        filename = filename[1:]
    filename = filename.replace('/../', '/')
    filename = item.path('torrent/%s' % filename)
    filename = os.path.abspath(os.path.join(settings.MEDIA_ROOT, filename))
    response = HttpFileResponse(filename)
    response['Content-Disposition'] = "attachment; filename*=UTF-8''%s" % \
                                      quote(os.path.basename(filename.encode('utf-8')))
    return response

def video(request, id, resolution, format, index=None, track=None):
    resolution = int(resolution)
    resolutions = sorted(settings.CONFIG['video']['resolutions'])
    if resolution not in resolutions:
        raise Http404
    item = get_object_or_404(models.Item, public_id=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    if index:
        index = int(index) - 1
    else:
        index = 0
    streams = item.streams(track)
    if index + 1 > streams.count():
        raise Http404
    stream = streams[index].get(resolution, format)
    if not stream.available or not stream.media:
        raise Http404
    path = stream.media.path

    # server side cutting
    t = request.GET.get('t')
    if t:
        def parse_timestamp(s):
            if ':' in s:
                s = ox.time2ms(s) / 1000
            return float(s)
        t = list(map(parse_timestamp, t.split(',')))
        ext = '.%s' % format
        duration = stream.info['duration']

        filename = "Clip of %s - %s-%s - %s %s%s" % (
            item.get('title'),
            ox.format_duration(t[0] * 1000).replace(':', '.')[:-4],
            ox.format_duration(t[1] * 1000).replace(':', '.')[:-4],
            settings.SITENAME.replace('/', '-'),
            item.public_id,
            ext
        )
        content_type = mimetypes.guess_type(path)[0]

        cache_name = '%s_%sp_%s.%s' % (item.public_id, resolution, '%s,%s' % (t[0], t[1]), format)
        cache_path = os.path.join(settings.MEDIA_ROOT, item.path('cache/%s' % cache_name))
        if os.path.exists(cache_path):
            response = HttpFileResponse(cache_path, content_type=content_type)
            response['Content-Disposition'] = "attachment; filename*=UTF-8''%s" % quote(filename.encode('utf-8'))
            return response

        # multipart request beyond first part, merge parts and chop that
        if not index and streams.count() > 1 and stream.info['duration'] < t[1]:
            video = NamedTemporaryFile(suffix=ext)
            r = item.merge_streams(video.name, resolution, format)
            if not r:
                return HttpResponseForbidden()
            path = video.name
            duration = sum(item.cache['durations'])

        if len(t) == 2 and t[1] > t[0] and duration >= t[1]:
            # FIXME: could be multilingual here
            subtitles = utils.get_by_key(settings.CONFIG['layers'], 'isSubtitles', True)
            if subtitles:
                srt = item.srt(subtitles['id'], encoder=ox.srt)
                if len(srt) < 4:
                    srt = None
            else:
                srt = None
            response = HttpResponse(extract.chop(path, t[0], t[1], subtitles=srt), content_type=content_type)
            response['Content-Disposition'] = "attachment; filename*=UTF-8''%s" % quote(filename.encode('utf-8'))
            return response
        else:
            filename = "%s - %s %s%s" % (
                item.get('title'),
                settings.SITENAME.replace('/', '-'),
                item.public_id,
                ext
            )
            response = HttpFileResponse(path, content_type=content_type)
            response['Content-Disposition'] = "attachment; filename*=UTF-8''%s" % quote(filename.encode('utf-8'))
            return response
    if not settings.XSENDFILE and not settings.XACCELREDIRECT:
        return redirect(stream.media.url)
    response = HttpFileResponse(path)
    response['Cache-Control'] = 'public'
    return response


_subtitle_formats = {
    'srt': ('text/x-srt', ox.srt),
    'vtt': ('text/vtt', ox.vtt),
}


def srt(request, id, layer, language=None, index=None, ext='srt'):
    item = get_object_or_404(models.Item, public_id=id)
    if not item.access(request.user):
        response = HttpResponseForbidden()
    else:
        content_type, encoder = _subtitle_formats[ext]
        response = HttpResponse()
        if language:
            filename = "%s.%s.%s" % (item.get('title'), language, ext)
        else:
            filename = "%s.%s" % (item.get('title'), ext)
        response['Content-Disposition'] = "attachment; filename*=UTF-8''%s" % quote(filename.encode('utf-8'))
        response['Content-Type'] = content_type
        response.write(item.srt(layer, language, encoder=encoder))
    return response

def random_annotation(request):
    n = models.Item.objects.all().count()
    pos = random.randint(0, n)
    item = models.Item.objects.all()[pos]
    n = item.annotations.all().count()
    pos = random.randint(0, n)
    clip = item.annotations.all()[pos]
    return redirect('/%s' % clip.public_id)

def atom_xml(request):
    add_updated = True
    feed = ET.Element("feed")
    feed.attrib['xmlns'] = 'http://www.w3.org/2005/Atom'
    feed.attrib['xmlns:media'] = 'http://search.yahoo.com/mrss/'
    feed.attrib['xml:lang'] = 'en'
    title = ET.SubElement(feed, "title")
    title.text = settings.SITENAME
    title.attrib['type'] = 'text'
    link = ET.SubElement(feed, "link")
    link.attrib['rel'] = 'self'
    link.attrib['type'] = 'application/atom+xml'
    atom_link = request.build_absolute_uri('/atom.xml')
    link.attrib['href'] = atom_link
    '''
    rights = ET.SubElement(feed, 'rights')
    rights.attrib['type'] = 'text'
    rights.text = "PGL"
    '''
    el = ET.SubElement(feed, 'id')
    el.text = atom_link

    level = settings.CONFIG['capabilities']['canSeeItem']['guest']
    if not request.user.is_anonymous:
        level = request.user.profile.level
    for item in models.Item.objects.filter(level__lte=level, rendered=True).order_by('-created')[:7]:
        if add_updated:
            updated = ET.SubElement(feed, "updated")
            updated.text = item.modified.strftime("%Y-%m-%dT%H:%M:%SZ")
            add_updated = False

        page_link = request.build_absolute_uri('/%s' % item.public_id)

        entry = ET.Element("entry")
        title = ET.SubElement(entry, "title")
        title.text = ox.decode_html(item.get('title'))
        link = ET.SubElement(entry, "link")
        link.attrib['rel'] = 'alternate'
        link.attrib['href'] = "%s/info" % page_link
        updated = ET.SubElement(entry, "updated")
        updated.text = item.modified.strftime("%Y-%m-%dT%H:%M:%SZ")
        published = ET.SubElement(entry, "published")
        published.text = item.created.strftime("%Y-%m-%dT%H:%M:%SZ")
        el = ET.SubElement(entry, "id")
        el.text = page_link

        if item.get('director'):
            el = ET.SubElement(entry, "author")
            name = ET.SubElement(el, "name")
            name.text = ox.decode_html(', '.join(item.get('director')))
        elif item.user:
            el = ET.SubElement(entry, "author")
            name = ET.SubElement(el, "name")
            name.text = item.user.username

        for topic in item.get('topics', []):
            el = ET.SubElement(entry, "category")
            el.attrib['term'] = topic

        '''
        el = ET.SubElement(entry, "rights")
        el.text = "PGL"
        el = ET.SubElement(entry, "link")
        el.attrib['rel'] = "license"
        el.attrib['type'] = "text/html"
        el.attrib['href'] = item.licenseUrl
        '''
        '''
        el = ET.SubElement(entry, "contributor")
        name = ET.SubElement(el, "name")
        name.text = item.user.username
        '''

        description = item.get('description', item.get('summary'))
        if description:
            content = ET.SubElement(entry, "content")
            content.attrib['type'] = 'html'
            content.text = description

        format = ET.SubElement(entry, "format")
        format.attrib['xmlns'] = 'http://transmission.cc/FileFormat'
        streams = item.streams().filter(source=None).order_by('-id')
        if streams.exists():
            stream = streams[0]
            for key in ('size', 'duration', 'video_codec',
                        'framerate', 'width', 'height',
                        'audio_codec', 'samplerate', 'channels'):
                value = stream.info.get(key)
                if not value and stream.info.get('video'):
                    value = stream.info['video'][0].get({
                        'video_codec': 'codec'
                    }.get(key, key))
                if not value and stream.info.get('audio'):
                    value = stream.info['audio'][0].get({
                        'audio_codec': 'codec'
                    }.get(key, key))
                if value and value != -1:
                    el = ET.SubElement(format, key)
                    el.text = str(value)
        el = ET.SubElement(format, 'pixel_aspect_ratio')
        el.text = "1:1"

        if has_capability(request.user, 'canDownloadVideo'):
            if item.torrent:
                el = ET.SubElement(entry, "link")
                el.attrib['rel'] = 'enclosure'
                el.attrib['type'] = 'application/x-bittorrent'
                el.attrib['href'] = '%s/torrent/' % page_link
                el.attrib['length'] = '%s' % ox.get_torrent_size(item.torrent.path)
            # FIXME: loop over streams
            # for s in item.streams().filter(resolution=max(settings.CONFIG['video']['resolutions'])):
            for s in item.streams().filter(source=None):
                el = ET.SubElement(entry, "link")
                el.attrib['rel'] = 'enclosure'
                el.attrib['type'] = 'video/%s' % s.format
                el.attrib['href'] = '%s/%sp.%s' % (page_link, s.resolution, s.format)
                el.attrib['length'] = '%s' % s.media.size

        el = ET.SubElement(entry, "media:thumbnail")
        thumbheight = 96
        thumbwidth = int(thumbheight * item.stream_aspect)
        thumbwidth -= thumbwidth % 2
        el.attrib['url'] = '%s/%sp.jpg' % (page_link, thumbheight)
        el.attrib['width'] = str(thumbwidth)
        el.attrib['height'] = str(thumbheight)
        feed.append(entry)     
    return HttpResponse(
        '<?xml version="1.0" encoding="utf-8" ?>\n' + ET.tostring(feed).decode(),
        'application/atom+xml'
    )

def oembed(request):
    format = request.GET.get('format', 'json')
    maxwidth = int(request.GET.get('maxwidth', 640))
    maxheight = int(request.GET.get('maxheight', 480))

    url = request.GET['url']
    parts = urlparse(url).path.split('/')
    if len(parts) < 2:
        raise Http404
    public_id = parts[1]
    item = get_object_or_404_json(models.Item, public_id=public_id)
    embed_url = request.build_absolute_uri('/%s' % public_id)
    if url.startswith(embed_url):
        embed_url = url
    if '#embed' not in embed_url:
        embed_url = '%s#embed' % embed_url

    oembed = {}
    oembed['version'] = '1.0'
    oembed['type'] = 'video'
    oembed['provider_name'] = settings.SITENAME
    oembed['provider_url'] = request.build_absolute_uri('/')
    oembed['title'] = item.get('title')
    # oembed['author_name'] = item.get('director')
    # oembed['author_url'] = ??
    height = max(settings.CONFIG['video']['resolutions'])
    height = min(height, maxheight)
    width = int(round(height * item.stream_aspect))
    if width > maxwidth:
        width = maxwidth
        height = min(maxheight, int(width / item.stream_aspect))
    oembed['html'] = '<iframe width="%s" height="%s" src="%s" frameborder="0" allowfullscreen></iframe>' % (width, height, embed_url)
    oembed['width'] = width
    oembed['height'] = height
    thumbheight = 96
    thumbwidth = int(thumbheight * item.stream_aspect)
    thumbwidth -= thumbwidth % 2
    oembed['thumbnail_height'] = thumbheight
    oembed['thumbnail_width'] = thumbwidth
    oembed['thumbnail_url'] = request.build_absolute_uri('/%s/%sp.jpg' % (item.public_id, thumbheight))
    if format == 'xml':
        oxml = ET.Element('oembed')
        for key in oembed:
            e = ET.SubElement(oxml, key)
            e.text = str(oembed[key])
        return HttpResponse(
            '<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n' + ET.tostring(oxml).decode(),
            'application/xml'
        )
    return HttpResponse(json.dumps(oembed, indent=2), 'application/json')

def sitemap_xml(request):
    sitemap = os.path.abspath(os.path.join(settings.MEDIA_ROOT, 'sitemap.xml'))
    if not os.path.exists(sitemap):
        tasks.update_sitemap(request.build_absolute_uri('/'))
    elif time.mktime(time.localtime()) - os.stat(sitemap).st_ctime > 24*60*60:
        tasks.update_sitemap.delay(request.build_absolute_uri('/'))
    response = HttpFileResponse(sitemap)
    response['Content-Type'] = 'application/xml'
    return response

def sitemap_part_xml(request, part):
    part = int(part)
    sitemap = os.path.abspath(os.path.join(settings.MEDIA_ROOT, 'sitemap%06d.xml' % part))
    if not os.path.exists(sitemap):
        raise Http404
    response = HttpFileResponse(sitemap)
    response['Content-Type'] = 'application/xml'
    return response

def item_json(request, id):
    level = settings.CONFIG['capabilities']['canSeeItem']['guest']
    if not request.user.is_anonymous:
        level = request.user.profile.level
    qs = models.Item.objects.filter(public_id=id, level__lte=level)
    if qs.count() == 0:
        response = json_response(status=404, text='not found')
    else:
        item = qs[0]
        response = item.json()
        response['layers'] = item.get_layers(request.user)
    return render_to_json_response(response)

def item_xml(request, id):
    level = settings.CONFIG['capabilities']['canSeeItem']['guest']
    if not request.user.is_anonymous:
        level = request.user.profile.level
    qs = models.Item.objects.filter(public_id=id, level__lte=level)
    if qs.count() == 0:
        response = json_response(status=404, text='not found')
        response = render_to_json_response(response)
    else:
        item = qs[0]
        j = item.json()
        j['layers'] = item.get_layers(request.user)
        if 'resolution' in j:
            j['resolution'] = {'width': j['resolution'][0], 'height': j['resolution'][1]}

        def xmltree(root, key, data):
            if isinstance(data, list) or \
                isinstance(data, tuple):
                e = ET.SubElement(root, key)
                for value in data:
                    xmltree(e, key, value)
            elif isinstance(data, dict):
                for k in data:
                    if data[k]:
                        xmltree(root, k, data[k])
            else:
                e = ET.SubElement(root, key)
                e.text = str(data)

        oxml = ET.Element('item')
        xmltree(oxml, 'item', j)
        response = HttpResponse(
            '<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n' + ET.tostring(oxml).decode(),
            'application/xml'
        )
    return response

def item(request, id):
    id = id.split('/')[0]
    view = None
    template = 'index.html'
    level = settings.CONFIG['capabilities']['canSeeItem']['guest']
    if not request.user.is_anonymous:
        level = request.user.profile.level
    qs = models.Item.objects.filter(public_id=id, level__lte=level)
    if qs.count() == 0:
        ctx = {
            'base_url': request.build_absolute_uri('/'),
            'settings': settings
        }
    else:
        item = qs[0]
        template = 'item.html'
        keys = [
            'year',
            'director',
            'writer',
            'producer',
            'cinematographer',
            'editor',
            'actor',
            'topic',
        ]
        if not settings.USE_IMDB:
            keys += [
                'summary'
            ]
        keys += [
            'duration'
            'aspectratio'
            'hue',
            'saturation',
            'lightness',
            'volume',
            'numberofcuts',
        ]

        data = []
        for k in keys:
            value = item.get(k)
            key = utils.get_by_id(settings.CONFIG['itemKeys'], k)
            if value:
                if k == 'actor':
                    title = 'Cast'
                else:
                    title = key['title'] if key else k.capitalize()
                if isinstance(value, list):
                    value = value = ', '.join([str(v) for v in value])
                elif key and key.get('type') == 'float':
                    value = '%0.3f' % value
                elif key and key.get('type') == 'time':
                    value = ox.format_duration(value * 1000)
                data.append({'key': k, 'title': title, 'value': value})
        clips = []
        clip = {'in': 0, 'annotations': []}
        # logged in users should have javascript. not adding annotations makes load faster
        if not settings.USE_IMDB and request.user.is_anonymous:
            for a in item.annotations.exclude(
                layer='subtitles'
            ).exclude(
                value=''
            ).filter(
                layer__in=models.Annotation.public_layers()
            ).order_by('start', 'end', 'sortvalue'):
                if clip['in'] < a.start:
                    if clip['annotations']:
                        clip['annotations'] = '<br />\n'.join(clip['annotations'])
                        clips.append(clip)
                    clip = {'in': a.start, 'annotations': []}
                clip['annotations'].append(a.value)
            if clip['annotations']:
                clip['annotations'] = '<br />\n'.join(clip['annotations'])
                clips.append(clip)
        head_title = item.get('title', '')
        title = item.get('title', '')
        if item.get('director'):
            head_title += ' (%s)' % ', '.join(item.get('director', []))
        if item.get('year'):
            head_title += ' %s' % item.get('year')
            title += ' (%s)' % item.get('year')
        if view:
            head_title += ' – %s' % view
        head_title += ' – %s' % settings.SITENAME
        head_title = ox.decode_html(head_title)
        title = ox.decode_html(title)
        ctx = {
            'current_url': request.build_absolute_uri(request.get_full_path()),
            'base_url': request.build_absolute_uri('/'),
            'url': request.build_absolute_uri('/%s' % id),
            'id': id,
            'settings': settings,
            'data': data,
            'clips': clips,
            'icon': settings.CONFIG['user']['ui']['icons'] == 'frames' and 'icon' or 'poster',
            'title': title,
            'head_title': head_title,
            'description': item.get_item_description(),
            'description_html': item.get_item_description_html()
        }
        if not settings.USE_IMDB:
            value = item.get('topic' in keys and 'topic' or 'keywords')
            if isinstance(value, list):
                value = value = ', '.join(value)
            if value:
                ctx['keywords'] = ox.strip_tags(value)

    return render(request, template, ctx)

