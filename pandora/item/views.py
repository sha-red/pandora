# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import os.path
from datetime import datetime

from django.db.models import Count, Sum, Max
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, redirect
from django.conf import settings

from ox.utils import json

from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from ox.django.http import HttpFileResponse
import ox

import models
import utils
import tasks

from archive.models import File
from archive import extract

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
            if query['group'] == "year":
                order_by = query['sort'][0]['operator'] == '-' and 'items' or '-items'
            else:
                order_by = query['sort'][0]['operator'] == '-' and '-items' or 'items'
            if query['group'] != "keyword":
                order_by = (order_by, 'value_sort')
            else:
                order_by = (order_by,)
        else:
            order_by = query['sort'][0]['operator'] == '-' and '-value_sort' or 'value_sort'
            order_by = (order_by, 'items')
    else:
        order_by = ('-value_sort', 'items')
    return order_by

def _parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'title', 'operator':'+'}]
    for key in ('sort', 'keys', 'group', 'range', 'ids'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Item.objects.find(data, user)
    #group by only allows sorting by name or number of itmes
    return query


def find(request):
    '''
        param data {
            'query': query,
            'sort': array,
            'range': array
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
            'ids': []
        }

            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
            ids:  ids of items for which positions are required
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
    query = _parse_query(data, request.user)

    response = json_response({})
    if 'group' in query:
        response['data']['items'] = []
        items = 'items'
        item_qs = query['qs']
        order_by = _order_by_group(query)
        qs = models.Facet.objects.filter(key=query['group']).filter(item__id__in=item_qs)
        qs = qs.values('value').annotate(items=Count('id')).order_by(*order_by)

        if 'ids' in query:
            response['data']['positions'] = {}
            ids = [j['value'] for j in qs]
            response['data']['positions'] = utils.get_positions(ids, query['ids'])
        elif 'range' in data:
            qs = qs[query['range'][0]:query['range'][1]]
            response['data']['items'] = [{'name': i['value'], 'items': i[items]} for i in qs]
        else:
            response['data']['items'] = qs.count()
    elif 'ids' in query:
        qs = _order_query(query['qs'], query['sort'])
        response['data']['positions'] = {}
        ids = [j['itemId'] for j in qs.values('itemId')]
        response['data']['positions'] = utils.get_positions(ids, query['ids'])
    elif 'keys' in query:
        response['data']['items'] = []
        qs = _order_query(query['qs'], query['sort'])
        _p = query['keys']
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
                if isinstance(r[p], datetime):
                    r[p] = r[p].strftime('%Y-%m-%dT%H:%M:%SZ')
            return r
        def only_p(m):
            r = {}
            if m:
                m = json.loads(m)
                for p in _p:
                    r[p] = m.get(p, '')
            return r
        qs = qs[query['range'][0]:query['range'][1]]
        #response['data']['items'] = [m.get_json(_p) for m in qs]
        if 'popularity' in _p:
            qs = qs.annotate(popularity=Sum('accessed__accessed'))
        if 'accessed' in _p:
            qs = qs.annotate(a=Max('accessed__access'))
        if 'viewed' in _p or 'popularity' in _p or 'accessed' in _p:
            response['data']['items'] = [only_p_sums(m) for m in qs]
        else:
            response['data']['items'] = [only_p(m['json']) for m in qs.values('json')]
    else: # otherwise stats
        items = query['qs']
        files = File.objects.all().filter(item__in=items).filter(size__gt=0)
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

    site_config = models.site_config()
    key = site_config['keys'][data['key']]
    order_by = key.get('autocompleteSortKey', False)
    if order_by:
        order_by = '-sort__%s' % order_by
    else:
        order_by = '-items'
    sort_type = key.get('sort', key.get('type', 'string'))
    if sort_type == 'title':
        qs = _parse_query({'query': data.get('query', {})}, request.user)['qs']
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
        response['data']['item'] = info
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
        response = json_response(status=501, text='not implemented')
        item.edit(data)
    else:
        response = json_response(status=403, text='permissino denied')
    return render_to_json_response(response)
actions.register(editItem, cache=False)

@login_required_json
def removeItem(request):
    '''
        param data
            string id

        return {'status': {'code': int, 'text': string}}
    '''
    response = json_response({})
    itemId = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Item, itemId=itemId)
    if item.editable(request.user):
        response = json_response(status=501, text='not implemented')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(removeItem, cache=False)

'''
    Poster API
'''
def parse(request): #parse path and return info
    '''
        param data {
            path: string
        }
        return {
            status: {'code': int, 'text': string},
            data: {
                imdb: string
            }
        }
    '''
    path = json.loads(request.POST['data'])['path']
    response = json_response(utils.parse_path(path))
    return render_to_json_response(response)
actions.register(parse)


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
        #FIXME: some things need to be updated after changing this
        item.poster_frame = data['position']
        item.save()
        tasks.update_poster.delay(item.itemId)
        response = json_response()
    else:
        response = json_response(status=403, text='permissino denied')
    return render_to_json_response(response)
actions.register(setPosterFrame, cache=False)

def setPoster(request): #parse path and return info
    '''
        param data {
            id: itemId,
            url: string
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
    if item.editable(request.user):
        valid_urls = [p.url for p in item.poster_urls.all()]
        if data['url'] in valid_urls:
            item.poster_url = data['url']
            if item.poster:
                item.poster.delete()
            item.save()
            tasks.update_poster.delay(item.itemId)
            response = json_response()
            response['data']['poster'] = item.get_poster()
        else:
            response = json_response(status=403, text='invalid poster url')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(setPoster, cache=False)

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
def frame(request, id, position, size):
    item = get_object_or_404(models.Item, itemId=id)
    position = float(position.replace(',', '.'))
    frame = item.frame(position, int(size))
    if not frame:
        raise Http404
    return HttpFileResponse(frame, content_type='image/jpeg')


def image_to_response(item, image, size=None):
    if size:
        size = int(size)
        path = image.path.replace('.jpg', '.%d.jpg'%size)
        if not os.path.exists(path):
            image_size = max(image.width, image.height)
            if size > image_size:
                return redirect('/%s/icon.jpg' % item.itemId)
            extract.resize_image(image.path, path, size=size)
    else:
        path = image.path
    return HttpFileResponse(path, content_type='image/jpeg')


def poster(request, id, size=None):
    item = get_object_or_404(models.Item, itemId=id)
    if size == 'large':
        size = None
    if item.poster:
        return image_to_response(item, item.poster, size)
    else:
        if not size:
            size='large'
        return redirect('http://0xdb.org/%s/poster.%s.jpg' % (item.itemId, size))
        poster_path = os.path.join(settings.STATIC_ROOT, 'png/posterDark.48.png')
    return HttpFileResponse(poster_path, content_type='image/jpeg')


def icon(request, id, size=None):
    item = get_object_or_404(models.Item, itemId=id)
    if item.icon:
        return image_to_response(item, item.icon, size)
    else:
        raise Http404


def timeline(request, id, timeline, size, position):
    item = get_object_or_404(models.Item, itemId=id)
    if timeline == 'strip':
        timeline = '%s.%s.%04d.png' %(item.timeline_prefix[:-8] + 'strip', size, int(position))
    else:
        timeline = '%s.%s.%04d.png' %(item.timeline_prefix, size, int(position))
    return HttpFileResponse(timeline, content_type='image/png')


def timeline_overview(request, id, size):
    item = get_object_or_404(models.Item, itemId=id)
    timeline = '%s.%s.png' %(item.timeline_prefix, size)
    return HttpFileResponse(timeline, content_type='image/png')


def video(request, id, profile):
    item = get_object_or_404(models.Item, itemId=id)
    stream = get_object_or_404(item.streams, profile=profile)
    path = stream.video.path
    content_type = path.endswith('.mp4') and 'video/mp4' or 'video/webm'
    #server side cutting
    t = request.GET.get('t', None)
    if t:
        t = map(float, t.split(','))
        ext = os.path.splitext(profile)[1]
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
    return HttpFileResponse(path, content_type=content_type)
