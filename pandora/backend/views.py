# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import os.path
import re
from datetime import datetime
from urllib2 import unquote
import mimetypes

from django import forms
from django.core.paginator import Paginator
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Q, Avg, Count, Sum
from django.http import HttpResponse, Http404
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404, redirect
from django.template import RequestContext
from django.conf import settings

try:
    import simplejson as json
except ImportError:
    from django.utils import simplejson as json

from oxdjango.decorators import login_required_json
from oxdjango.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from oxdjango.http import HttpFileResponse
import ox

import models
import utils
import tasks

from user.models import getUserJSON
from user.views import api_login, api_logout, api_register, api_contact, api_recover, api_preferences, api_findUser

from archive.views import api_update, api_upload, api_editFile

from archive.models import File
from archive import extract


def api(request):
    if request.META['REQUEST_METHOD'] == "OPTIONS":
        response = HttpResponse('')
        response = render_to_json_response({'status': {'code': 200, 'text': 'use POST'}})
        response['Access-Control-Allow-Origin'] = '*'
        return response
    if not 'action' in request.POST:
        return apidoc(request)
    function = request.POST['action']
    #FIXME: possible to do this in f
    #data = json.loads(request.POST['data'])

    f = globals().get('api_'+function, None)
    if f:
        response = f(request)
    else:
        response = render_to_json_response(json_response(status=400,
                                text='Unknown function %s' % function))
    response['Access-Control-Allow-Origin'] = '*'
    return response

def api_api(request):
    '''
        returns list of all known api action
        return {'status': {'code': int, 'text': string},
                'data': {actions: ['api', 'hello', ...]}}
    '''
    actions = globals().keys()
    actions = map(lambda a: a[4:], filter(lambda a: a.startswith('api_'), actions))
    actions.sort()
    return render_to_json_response(json_response({'actions': actions}))

def api_hello(request):
    '''
        return {'status': {'code': int, 'text': string},
                'data': {user: object}}
    '''
    #data = json.loads(request.POST['data'])
    response = json_response({})
    if request.user.is_authenticated():
        response['data']['user'] = getUserJSON(request.user)
    else:
        response['data']['user'] = {'name': 'Guest', 'group': 'guest', 'preferences': {}}
    return render_to_json_response(response)

def api_error(request):
    '''
        trows 503 error
    '''
    success = error_is_success
    return render_to_json_response({})

def _order_query(qs, sort, prefix='sort__'):
    order_by = []
    if len(sort) == 1:
        if sort[0]['key'] in ('title', 'director'):
            sort.append({'operator': '-', 'key': 'year'})
        if sort[0]['key'] in ('year', ):
            sort.append({'operator': '+', 'key': 'director'})
    for e in sort:
        operator = e['operator']
        if operator != '-': operator = ''
        key = {'id': 'itemId'}.get(e['key'], e['key'])
        #FIXME: this should be a property of models.ItemSort!!!
        if operator=='-' and key in ('title', 'director', 'writer', 'producer', 'editor', 'cinematographer', 'language', 'country', 'year'):
            key = '%s_desc' % key
        order = '%s%s%s' % (operator, prefix, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by)
    return qs

def _parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'title', 'operator':'+'}]
    for key in ('sort', 'keys', 'group', 'list', 'range', 'ids'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Item.objects.find(data, user)
    #group by only allows sorting by name or number of itmes
    return query

def _get_positions(ids, get_ids):
    positions = {}
    for i in get_ids:
        try:
            positions[i] = ids.index(i)
        except:
            pass
    return positions

def api_find(request):
    '''
        param data
            {'query': query, 'sort': array, 'range': array}
        
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
        param data
            {'query': query, 'key': string, 'group': string, 'range': array}
        
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
        param data
            {'query': query, 'ids': []}
        
            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
            ids:  ids of items for which positions are required
    '''
    data = json.loads(request.POST['data'])
    if settings.JSON_DEBUG:
        print json.dumps(data, indent=2)
    query = _parse_query(data, request.user)
    
    response = json_response({})
    if 'group' in query:
        if 'sort' in query:
            if len(query['sort']) == 1 and query['sort'][0]['key'] == 'items':
                if query['group'] == "year":
                    query['sort'].append({'key': 'name', 'operator':'-'})
                else:
                    query['sort'].append({'key': 'name', 'operator':'+'})
        else:
            query['sort'] = [{'key': 'name', 'operator':'+'}]
        response['data']['items'] = []
        items = 'items'
        item_qs = query['qs']
        qs = models.Facet.objects.filter(key=query['group']).filter(item__id__in=item_qs)
        qs = qs.values('value').annotate(items=Count('id')).order_by()
        name = 'value'
        name_sort = 'value_sort'

        #replace normalized items/name sort with actual db value
        for i in range(0, len(query['sort'])):
            if query['sort'][i]['key'] == 'name':
                query['sort'][i]['key'] = name_sort
            elif query['sort'][i]['key'] == 'items':
                query['sort'][i]['key'] = items
        qs = _order_query(qs, query['sort'], prefix='')
        if 'ids' in query:
            #FIXME: this does not scale for larger results
            response['data']['positions'] = {}
            ids = [j[name] for j in qs]
            response['data']['positions'] = _get_positions(ids, query['ids'])

        elif 'range' in data:
            qs = qs[query['range'][0]:query['range'][1]]
            response['data']['items'] = [{'name': i[name], 'items': i[items]} for i in qs]
        else:
            response['data']['items'] = qs.count()
    elif 'ids' in query:
        #FIXME: this does not scale for larger results
        qs = _order_query(query['qs'], query['sort'])
        
        response['data']['positions'] = {}
        ids = [j['itemId'] for j in qs.values('itemId')]
        response['data']['positions'] = _get_positions(ids, query['ids'])

    elif 'keys' in query:
        response['data']['items'] = []
        qs = _order_query(query['qs'], query['sort'])
        _p = query['keys']
        def only_p(m):
            r = {}
            if m:
                m = json.loads(m)
                for p in _p:
                    r[p] = m.get(p, '')
            return r
        qs = qs[query['range'][0]:query['range'][1]]
        response['data']['items'] = [only_p(m['json']) for m in qs.values('json')]
    else: # otherwise stats
        items = query['qs']
        files = File.objects.all().filter(item__in=items)
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
        if response['data']['runtime'] == None:
            response['data']['runtime'] = 1337
        response['data']['size'] = r['size__sum']
    return render_to_json_response(response)

def api_getItem(request):
    '''
        param data
            string id

        return item array
    '''
    response = json_response({})
    itemId = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Item, itemId=itemId)
    #FIXME: check permissions
    info = item.get_json()
    info['stream'] = item.get_stream()
    info['layers'] = item.get_layers()
    response['data'] = {'item': info}
    return render_to_json_response(response)

@login_required_json
def api_editItem(request):
    '''
        param data
            {id: string, key: value,..}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    data = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Item, itemId=data['id'])
    if item.editable(request.user):
        response = json_response(status=501, text='not implemented')
        item.edit(data)
    else:
        response = json_response(status=403, text='permissino denied')
    return render_to_json_response(response)

@login_required_json
def api_removeItem(request):
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
        response = json_response(status=403, text='permissino denied')
    return render_to_json_response(response)

@login_required_json
def api_addLayer(request):
    '''
        param data
            {key: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    response = {'status': {'code': 501, 'text': 'not implemented'}}
    return render_to_json_response(response)

@login_required_json
def api_removeLayer(request):
    '''
        param data
            {key: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    response = {'status': {'code': 501, 'text': 'not implemented'}}
    return render_to_json_response(response)

@login_required_json
def api_editLayer(request):
    '''
        param data
            {key: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    response = json_response({})
    data = json.loads(request.POST['data'])
    layer = get_object_or_404_json(models.Layer, pk=data['id'])
    if layer.editable(request.user):
        response = json_response(status=501, text='not implemented')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)

    response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)

'''
    List API
'''
@login_required_json
def api_addListItem(request):
    '''
        param data
            {key: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)

@login_required_json
def api_removeListItem(request):
    '''
        param data
            {key: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)

@login_required_json
def api_addList(request):
    '''
        param data
            {key: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)

@login_required_json
def api_editList(request):
    '''
        param data
            {key: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)

def api_removeList(request):
    '''
        param data
            {key: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)

'''
    Poster API
'''
def api_parse(request): #parse path and return info
    '''
        param data
            {path: string}
        return {'status': {'code': int, 'text': string},
                data: {imdb: string}}
    '''
    path = json.loads(request.POST['data'])['path']
    response = json_response(utils.parse_path(path))
    return render_to_json_response(response)


def api_setPosterFrame(request): #parse path and return info
    '''
        param data
            {id: itemId, position: float}
        return {'status': {'code': int, 'text': string},
                data: {}}
    '''
    data = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Item, itemId=data['id'])
    if item.editable(request.user):
        #FIXME: some things need to be updated after changing this
        item.poster_frame = data['position']
        item.save()
        response = json_response(status=200, text='ok')
    else:
        response = json_response(status=403, text='permissino denied')
    return render_to_json_response(response)

def api_setPoster(request): #parse path and return info
    '''
        param data
            {id: itemId, url: string}
        return {'status': {'code': int, 'text': string},
                data: {poster: {url,width,height}}}
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
            tasks.updatePoster.delay(item.itemId)
            response = json_response(status=200, text='ok')
            response['data']['poster'] = item.get_poster()
        else:
            response = json_response(status=403, text='invalid poster url')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)

def api_getImdbId(request):
    '''
        param data
            {title: string, director: string, year: string}
        return {'status': {'code': int, 'text': string},
                'data': {imdbId:string }}
    '''
    imdbId = ox.web.imdb.guess(search_title, r['director'], timeout=-1)
    if imdbId:
        response = json_response({'imdbId': imdbId})
    else:
        response = json_response(status=404, text='not found')
    return render_to_json_response(response)

def apidoc(request):
    '''
        this is used for online documentation at http://127.0.0.1:8000/api/
    '''
    import sys
    def trim(docstring):
        if not docstring:
            return ''
        # Convert tabs to spaces (following the normal Python rules)
        # and split into a list of lines:
        lines = docstring.expandtabs().splitlines()
        # Determine minimum indentation (first line doesn't count):
        indent = sys.maxint
        for line in lines[1:]:
            stripped = line.lstrip()
            if stripped:
                indent = min(indent, len(line) - len(stripped))
        # Remove indentation (first line is special):
        trimmed = [lines[0].strip()]
        if indent < sys.maxint:
            for line in lines[1:]:
                trimmed.append(line[indent:].rstrip())
        # Strip off trailing and leading blank lines:
        while trimmed and not trimmed[-1]:
            trimmed.pop()
        while trimmed and not trimmed[0]:
            trimmed.pop(0)
        # Return a single string:
        return '\n'.join(trimmed)

    functions = filter(lambda x: x.startswith('api_'), globals().keys())
    api = []
    for f in sorted(functions):
        api.append({
            'name': f[4:],
            'doc': trim(globals()[f].__doc__).replace('\n', '<br>\n')
        })
    context = RequestContext(request, {'api': api,
                                       'sitename': settings.SITENAME,})
    return render_to_response('api.html', context)

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

def poster(request, id, size=None):
    item = get_object_or_404(models.Item, itemId=id)
    if size == 'large':
        size = None
    if item.poster:
        if size:
            size = int(size)
            poster_path = item.poster.path.replace('.jpg', '.%d.jpg'%size)
            if not os.path.exists(poster_path):
                poster_size = max(item.poster.width, item.poster.height)
                if size > poster_size:
                    return redirect('/%s/poster.jpg' % item.itemId)
                extract.resize_image(item.poster.path, poster_path, size=size)
        else:
            poster_path = item.poster.path
    else:
        if not size: size='large'
        return redirect('http://0xdb.org/%s/poster.%s.jpg' % (item.itemId, size))
        poster_path = os.path.join(settings.STATIC_ROOT, 'png/posterDark.48.png')
    return HttpFileResponse(poster_path, content_type='image/jpeg')

def timeline(request, id, timeline, size, position):
    item = get_object_or_404(models.Item, itemId=id)
    if timeline == 'strip':
        timeline = '%s.%s.%04d.png' %(item.timeline_prefix[:-8] + 'strip', size, int(position))
    else:
        timeline = '%s.%s.%04d.png' %(item.timeline_prefix, size, int(position))
    return HttpFileResponse(timeline, content_type='image/png')

def video(request, id, profile):
    item = get_object_or_404(models.Item, itemId=id)
    stream = get_object_or_404(item.streams, profile=profile)
    path = stream.video.path
    content_type = path.endswith('.mp4') and 'video/mp4' or 'video/webm'
    return HttpFileResponse(path, content_type=content_type)


'''
    ajax html snapshots
    http://code.google.com/web/ajaxcrawling/docs/html-snapshot.html    
'''
def html_snapshot(request):
    fragment = unquote(request.GET['_escaped_fragment_'])
    url = request.build_absolute_uri('/ra')
    url = 'http://'+settings.URL
    response = HttpResponse('sorry, server side rendering for %s!#%s not yet implemented'%(url, fragment))
    return response
