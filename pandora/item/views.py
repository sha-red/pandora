# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import os.path
from datetime import datetime, timedelta
import mimetypes

import Image
from django.db.models import Count, Sum, Max
from django.http import HttpResponse, HttpResponseForbidden, Http404
from django.shortcuts import get_object_or_404, redirect
from django.conf import settings

from ox.utils import json

from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from ox.django.http import HttpFileResponse
from django.db.models import Q
import ox

import models
import utils
import tasks

from archive.models import File, Stream
from archive import extract
from clip.models import Clip 

from api.actions import actions


def _order_query(qs, sort, prefix='sort__'):
    order_by = []
    if len(sort) == 1:
        if sort[0]['key'] == 'title':
            sort.append({'operator': '-', 'key': 'year'})
            sort.append({'operator': '+', 'key': 'director'})
        elif sort[0]['key'] == 'director':
            sort.append({'operator': '-', 'key': 'year'})
            sort.append({'operator': '+', 'key': 'title'})
        elif sort[0]['key'] == 'year':
            sort.append({'operator': '+', 'key': 'director'})
            sort.append({'operator': '+', 'key': 'title'})
        elif not sort[0]['key'] in ('value', 'value_sort'):
            sort.append({'operator': '+', 'key': 'director'})
            sort.append({'operator': '-', 'key': 'year'})
            sort.append({'operator': '+', 'key': 'title'})

    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'id': 'itemId',
            'accessed': 'accessed__access',
            'viewed': 'accessed__access',
        }.get(e['key'], e['key'])
        if key not in ('accessed__access', 'accessed__accessed'):
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
                secondary = query['sort'][0]['operator'] == '-' and '-value_sort' or 'value_sort'
                order_by = (order_by, secondary)
            elif query['group'] != "keyword":
                order_by = (order_by, 'value_sort')
            else:
                order_by = (order_by,)
        else:
            order_by = query['sort'][0]['operator'] == '-' and '-value_sort' or 'value_sort'
            order_by = (order_by, 'items')
    else:
        order_by = ('-value_sort', 'items')
    return order_by

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'title', 'operator':'+'}]
    for key in ('sort', 'keys', 'group', 'range', 'position', 'positions'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Item.objects.find(data, user)

    if 'clips' in data:
        query['clip_qs'] = Clip.objects.find({'query': data['clips']['query']},
                                             user).order_by('start')
        query['clip_items'] = data['clips'].get('items', 5)
        query['clip_keys'] = data['clips'].get('keys')
        if not query['clip_keys']:
            query['clip_keys'] = ['id', 'in', 'out', 'annotations']

    #group by only allows sorting by name or number of itmes
    return query

def find(request):
    '''
        param data {
            'query': query,
            'sort': array,
            'range': array
            clipsQuery: ...
        }

            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
            sort: array of key, operator dics
                [
                    {
                        key: "year",
                        operator: "-"
                    },
                    {
                        key: "director",
                        operator: ""
                    }
                ]
            range:       result range, array [from, to]
            keys:  array of keys to return
            group:    group elements by, country, genre, director...

        with keys, items is list of dicts with requested properties:
          return {'status': {'code': int, 'text': string},
                'data': {items: array}}

Groups
        param data {
            'query': query,
            'key': string,
            'group': string,
            'range': array
            clips: {}
        }

            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
            range:       result range, array [from, to]
            keys:  array of keys to return
            group:    group elements by, country, genre, director...

        possible values for keys: name, items

        with keys
        items contains list of {'name': string, 'items': int}:
        return {'status': {'code': int, 'text': string},
            'data': {items: array}}

        without keys: return number of items in given query
          return {'status': {'code': int, 'text': string},
                'data': {items: int}}

Positions
        param data {
            'query': query,
            'positions': [],
            'sort': array
        }

            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
            positions: ids of items for which positions are required
        return {
            status: {...},
            data: {
                positions: {
                    id: position
                }
            }
        }
    '''
    data = json.loads(request.POST['data'])
    if settings.JSON_DEBUG:
        print json.dumps(data, indent=2)
    query = parse_query(data, request.user)

    response = json_response({})
    if 'group' in query:
        response['data']['items'] = []
        items = 'items'
        item_qs = query['qs']
        order_by = _order_by_group(query)
        qs = models.Facet.objects.filter(key=query['group']).filter(item__id__in=item_qs)
        qs = qs.values('value').annotate(items=Count('id')).order_by(*order_by)

        if 'positions' in query:
            response['data']['positions'] = {}
            ids = [j['value'] for j in qs]
            response['data']['positions'] = utils.get_positions(ids, query['positions'])
        elif 'range' in data:
            qs = qs[query['range'][0]:query['range'][1]]
            response['data']['items'] = [{'name': i['value'], 'items': i[items]} for i in qs]
        else:
            response['data']['items'] = qs.count()
    elif 'position' in query:
        qs = _order_query(query['qs'], query['sort'])
        ids = [j['itemId'] for j in qs.values('itemId')]
        data['conditions'] = data['conditions'] + {
            'value': query['position'],
            'key': query['sort'][0]['key'],
            'operator': '^'
        }
        query = parse_query(data, request.user)
        qs = _order_query(query['qs'], query['sort'])
        if qs.count() > 0:
            response['data']['position'] = utils.get_positions(ids, [qs[0].itemId])[0]
    elif 'positions' in query:
        qs = _order_query(query['qs'], query['sort'])
        ids = [j['itemId'] for j in qs.values('itemId')]
        response['data']['positions'] = utils.get_positions(ids, query['positions'])
    elif 'keys' in query:
        response['data']['items'] = []
        qs = _order_query(query['qs'], query['sort'])
        _p = query['keys']

        def get_clips(qs):
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
            return [c.json(query['clip_keys']) for c in clips]

        def only_p_sums(m):
            r = {}
            for p in _p:
                if p == 'viewed' and request.user.is_authenticated():
                    value = m.accessed.filter(user=request.user).annotate(v=Max('access'))
                    r[p] = value.exists() and value[0].v or None
                elif p  == 'accessed':
                    r[p] = m.a
                elif p == 'popularity':
                    r[p] = m.sort.popularity
                else:
                    r[p] = m.json.get(p, '')
            if 'clip_qs' in query:
                r['clips'] = get_clips(query['clip_qs'].filter(item=m))
            return r
        def only_p(m):
            r = {}
            if m:
                m = json.loads(m, object_hook=ox.django.fields.from_json)
                for p in _p:
                    r[p] = m.get(p, '')
            if 'clip_qs' in query:
                r['clips'] = get_clips(query['clip_qs'].filter(item__itemId=m['id']))
            return r
        qs = qs[query['range'][0]:query['range'][1]]
        #response['data']['items'] = [m.get_json(_p) for m in qs]
        if 'popularity' in _p:
            qs = qs.annotate(popularity=Sum('accessed__accessed'))
        if 'accessed' in _p:
            qs = qs.annotate(a=Max('accessed__access'))
        if 'viewed' in _p or 'popularity' in _p or 'accessed' in _p:
            qs = qs.select_related()
            response['data']['items'] = [only_p_sums(m) for m in qs]
        else:
            response['data']['items'] = [only_p(m['json']) for m in qs.values('json')]

    else: # otherwise stats
        items = query['qs']
        files = File.objects.filter(item__in=items).filter(size__gt=0)
        r = files.aggregate(
            Sum('duration'),
            Sum('pixels'),
            Sum('size')
        )
        response['data']['duration'] = r['duration__sum']
        response['data']['files'] = files.count()
        response['data']['items'] = items.count()
        response['data']['pixels'] = r['pixels__sum']
        response['data']['runtime'] = items.aggregate(Sum('sort__runtime'))['sort__runtime__sum']
        response['data']['size'] = r['size__sum']
        for key in ('runtime', 'duration', 'pixels', 'size'):
            if response['data'][key] == None:
                response['data'][key] = 0 
    return render_to_json_response(response)
actions.register(find)


def autocomplete(request):
    '''
        param data
            key
            value
            operator '', '^', '$'
            range
        return 
    '''
    data = json.loads(request.POST['data'])
    if not 'range' in data:
        data['range'] = [0, 10]
    op = data.get('operator', '')

    key = settings.CONFIG['keys'][data['key']]
    order_by = key.get('autocompleteSortKey', False)
    if order_by:
        order_by = '-sort__%s' % order_by
    else:
        order_by = '-items'
    sort_type = key.get('sort', key.get('type', 'string'))
    if sort_type == 'title':
        qs = parse_query({'query': data.get('query', {})}, request.user)['qs']
        if data['value']:
            if op == '':
                qs = qs.filter(find__key=data['key'], find__value__icontains=data['value'])
            elif op == '^':
                qs = qs.filter(find__key=data['key'], find__value__istartswith=data['value'])
            elif op == '$':
                qs = qs.filter(find__key=data['key'], find__value__iendswith=data['value'])
        qs = qs.order_by(order_by, nulls_last=True)
        qs = qs[data['range'][0]:data['range'][1]]
        response = json_response({})
        response['data']['items'] = [i.get(data['key']) for i in qs]    
    else:
        qs = models.Facet.objects.filter(key=data['key'])
        if data['value']:
            if op == '':
                qs = qs.filter(value__icontains=data['value'])
            elif op == '^':
                qs = qs.filter(value__istartswith=data['value'])
            elif op == '$':
                qs = qs.filter(value__iendswith=data['value'])
        qs = qs.values('value').annotate(items=Count('id'))
        qs = qs.order_by(order_by)
        qs = qs[data['range'][0]:data['range'][1]]
        response = json_response({})
        response['data']['items'] = [i['value'] for i in qs]
    return render_to_json_response(response)
actions.register(autocomplete)

def findId(request):
    '''
        param data {
            'query': query,
            'sort': array,
            'range': array
        }

    '''
    data = json.loads(request.POST['data'])
    response = json_response({})
    response['data']['items'] = []
    '''
    FIXME: can not handle query for director []
    query = parse_query(data, request.user)
    qs = _order_query(query['qs'], query['sort'])
    if qs.count() == 1:
        response['data']['items'] = [i.get_json(data['keys']) for i in qs]
    elif settings.DATA_SERVICE:
    '''
    if settings.DATA_SERVICE:
        '''
        info = {}
        for c in data['query']['conditions']:
            info[c['key']] = c['value']
        r = models.external_data('getId', info)
        '''
        r = models.external_data('getId', data)
        if r['status']['code'] == 200:
            response['data']['items'] = [r['data']]
    return render_to_json_response(response)
actions.register(findId)

def get(request):
    '''
        param data {
            id: string
            keys: array
        }
        return item array
    '''
    response = json_response({})
    data = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Item, itemId=data['id'])
    if item.access(request.user):
        info = item.get_json(data['keys'])
        if not data['keys'] or 'stream' in data['keys']:
            info['stream'] = item.get_stream()
        if not data['keys'] or 'layers' in data['keys']:
            info['layers'] = item.get_layers(request.user)
        if data['keys'] and 'files' in data['keys']:
            info['files'] = item.get_files(request.user)
        response['data'] = info
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(get)

def getItem(request):
    '''
        param data
            string id

        return item array
    '''
    response = json_response({})
    itemId = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Item, itemId=itemId)
    if item.access(request.user):
        info = item.get_json()
        info['stream'] = item.get_stream()
        info['layers'] = item.get_layers(request.user)
        response['data'] = info
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(getItem)


@login_required_json
def editItem(request):
    '''
        param data {
            id: string,
            key: value,..
        }
        return {
            status: {'code': int, 'text': string},
            data: {}
        }
    '''
    data = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Item, itemId=data['id'])
    if item.editable(request.user):
        response = json_response(status=200, text='ok')
        item.edit(data)
    else:
        response = json_response(status=403, text='permissino denied')
    return render_to_json_response(response)
actions.register(editItem, cache=False)

@login_required_json
def remove(request):
    '''
        param data {
            id: string
        }

        return {'status': {'code': int, 'text': string}}
    '''
    response = json_response({})
    data = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Item, itemId=data['id'])
    if item.editable(request.user):
        #FIXME: is this cascading enough or do we end up with orphan files etc.
        item.delete()
        response = json_response(status=200, text='removed')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(remove, cache=False)

'''
    Poster API
'''


def setPosterFrame(request): #parse path and return info
    '''
        param data {
            id: itemId,
            position: float
        }
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Item, itemId=data['id'])
    if item.editable(request.user):
        item.poster_frame = data['position']
        item.save()
        tasks.update_poster(item.itemId)
        response = json_response()
    else:
        response = json_response(status=403, text='permissino denied')
    return render_to_json_response(response)
actions.register(setPosterFrame, cache=False)

def setPoster(request): #parse path and return info
    '''
        param data {
            id: itemId,
            source: string
        }
        return {
            status: {'code': int, 'text': string},
            data: {
                poster: {url,width,height}
            }
        }
    '''
    data = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Item, itemId=data['id'])
    response = json_response()
    if item.editable(request.user):
        valid_sources = [p['source'] for p in item.get_posters()]
        if data['source'] in valid_sources:
            item.poster_source = data['source']
            if item.poster:
                item.poster.delete()
            item.save()
            tasks.update_poster(item.itemId)
            response = json_response()
            response['data']['posterAspect'] = item.poster_width/item.poster_height
        else:
            response = json_response(status=403, text='invalid poster url')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(setPoster, cache=False)

def updateExternalData(request):
    '''
        param data {
            id: itemId,
        }
        return {
            status: {'code': int, 'text': string},
            data: {
                poster: {url,width,height}
            }
        }
    '''
    data = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Item, itemId=data['id'])
    response = json_response()
    if item.editable(request.user):
        item.update_external()
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(updateExternalData, cache=False)

def lookup(request):
    '''
        param data {
            title: string,
            director: [string],
            year: string,
            id: string
        }
        return {
            status: {'code': int, 'text': string},
            data: {
                title: string,
                director: [string],
                year: string,
                id: string
            }
        }
    '''
    data = json.loads(request.POST['data'])
    if 'id' in data:
        i = models.Item.objects.get(itemId=data['id'])
        r = {'id': i.itemId}
        for key in ('title', 'director', 'year'):
            r[key] = i.get(key)
        response = json_response(r)
    else:
        response = json_response(status=404, text='not found')
    return render_to_json_response(response)
actions.register(lookup)

def getImdbId(request):
    '''
        param data {
            title: string,
            director: string,
            year: string
        }
        return {
            status: {'code': int, 'text': string},
            data: {
                imdbId:string
            }
        }
    '''
    data = json.loads(request.POST['data'])
    imdbId = ox.web.imdb.getImdbId(data['title'], data['director'], timeout=-1)
    if imdbId:
        response = json_response({'imdbId': imdbId})
    else:
        response = json_response(status=404, text='not found')
    return render_to_json_response(response)
actions.register(getImdbId)

'''
    media delivery
'''
def frame(request, id, size, position=None):
    item = get_object_or_404(models.Item, itemId=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    frame = None
    if not position:
        frames = item.poster_frames()
        if frames:
            position = item.poster_frame
            if position == -1 or position > len(frames):
                position = int(len(frames)/2)
            position = frames[int(position)]['position']
        elif item.poster_frame == -1 and item.sort.duration:
            position = item.sort.duration/2
        else:
            position = item.poster_frame
    else:
        position = float(position.replace(',', '.'))

    if not frame:
        frame = item.frame(position, int(size))

    if not frame:
        raise Http404
    return HttpFileResponse(frame, content_type='image/jpeg')

def poster_frame(request, id, position):
    item = get_object_or_404(models.Item, itemId=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    position = int(position)
    frames = item.poster_frames()
    if frames and len(frames) > position:
        frame = frames[position]['path']
        return HttpFileResponse(frame, content_type='image/jpeg')
    raise Http404


def image_to_response(image, size=None):
    if size:
        size = int(size)
        path = image.path.replace('.jpg', '.%d.jpg'%size)
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
    item = get_object_or_404(models.Item, itemId=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    poster = item.path('siteposter.jpg')
    poster = os.path.abspath(os.path.join(settings.MEDIA_ROOT, poster))
    if size:
        size = int(size)
        image = Image.open(poster)
        image_size = max(image.size)
        if size < image_size:
            path = poster.replace('.jpg', '.%d.jpg'%size)
            extract.resize_image(poster, path, size=size)
            poster = path
    return HttpFileResponse(poster, content_type='image/jpeg')

def poster(request, id, size=None):
    item = get_object_or_404(models.Item, itemId=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    if item.poster:
        return image_to_response(item.poster, size)
    else:
        poster_path = os.path.join(settings.STATIC_ROOT, 'png/posterDark.48.png')
        response = HttpFileResponse(poster_path, content_type='image/jpeg')
        response['Cache-Control'] = 'no-cache'
        return response


def icon(request, id, size=None):
    item = get_object_or_404(models.Item, itemId=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    if item.icon:
        return image_to_response(item.icon, size)
    else:
        raise Http404


def timeline(request, id, size, position):
    item = get_object_or_404(models.Item, itemId=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    timeline = '%s%sp%04d.png' %(item.timeline_prefix, size, int(position))
    return HttpFileResponse(timeline, content_type='image/png')


def timeline_overview(request, id, size):
    item = get_object_or_404(models.Item, itemId=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    timeline = '%s%sp.png' %(item.timeline_prefix, size)
    return HttpFileResponse(timeline, content_type='image/png')

def torrent(request, id, filename=None):
    item = get_object_or_404(models.Item, itemId=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    if not item.torrent:
        raise Http404
    if not filename or filename.endswith('.torrent'):
        response = HttpFileResponse(item.torrent.path,
                                    content_type='application/x-bittorrent')
        filename = "%s.torrent" % item.get('title')
        response['Content-Disposition'] = 'attachment; filename="%s"' % filename.encode('utf-8')
        return response
    while filename.startswith('/'):
        filename = filename[1:]
    filename = filename.replace('/../', '/')
    filename = item.path('torrent/%s' % filename)
    filename = os.path.abspath(os.path.join(settings.MEDIA_ROOT, filename))
    response = HttpFileResponse(filename)
    response['Content-Disposition'] = 'attachment; filename="%s"' % \
                                      os.path.basename(filename.encode('utf-8'))
    return response

def video(request, id, resolution, format, index=None):
    item = get_object_or_404(models.Item, itemId=id)
    if not item.access(request.user):
        return HttpResponseForbidden()
    if index:
        index = int(index) - 1
    else:
        index = 0
    #streams = Stream.object.filter(file__item__itemId=item.itemId,
    #                               file__selected=True, file__part=index,
    #                               resolution=resolution, format=format)
    #if streams.count() != 1:
    # reise Http404
    streams = Stream.objects.filter(file__item__itemId=item.itemId,
                                    resolution=resolution, format=format).order_by('file__part')
    if index > streams.count():
        raise Http404
    stream = streams[index]
    if not stream.available or not stream.video:
        raise Http404
    path = stream.video.path

    #server side cutting
    #FIXME: this needs to join segments if needed
    t = request.GET.get('t')
    if t:
        t = map(float, t.split(','))
        ext = '.%s' % format
        content_type = mimetypes.guess_type(path)[0]
        if len(t) == 2 and t[1] > t[0] and stream.info['duration']>=t[1]:
            response = HttpResponse(extract.chop(path, t[0], t[1]), content_type=content_type)
            filename = "Clip of %s - %s-%s - %s %s%s" % (
                item.get('title'),
                ox.formatDuration(t[0] * 1000),
                ox.formatDuration(t[1] * 1000),
                settings.SITENAME,
                item.itemId,
                ext
            )
            response['Content-Disposition'] = 'attachment; filename="%s"' % filename
            return response
        else:
            filename = "%s - %s %s%s" % (
                item.get('title'),
                settings.SITENAME,
                item.itemId,
                ext
            )
            response = HttpFileResponse(path, content_type=content_type)
            response['Content-Disposition'] = 'attachment; filename="%s"' % filename
            return response
    if not settings.XSENDFILE and not settings.XACCELREDIRECT:
        return redirect(stream.video.url)
    response = HttpFileResponse(path)
    response['Cache-Control'] = 'public'
    return response
