# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os.path
import re
from datetime import datetime
from urllib2 import unquote
import json

from django import forms
from django.core.paginator import Paginator
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Q, Avg, Count
from django.http import HttpResponse
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404
from django.template import RequestContext

try:
    import simplejson as json
except ImportError:
    from django.utils import simplejson as json

from oxdjango.decorators import login_required_json
from oxdjango.shortcuts import render_to_json_response, get_object_or_404_json

import models
import utils
from daemon import send_bg_message

from oxuser.models import getUserJSON
from oxuser.views import api_login, api_logout, api_register, api_recover, api_preferences

    
def api(request):
    if request.META['REQUEST_METHOD'] == "OPTIONS":
        response = HttpResponse('')
        #response = render_to_json_response({'status': {'code': 200, 'text': 'please use POST'}})
        response['Access-Control-Allow-Origin'] = '*'
        return response
    if not 'action' in request.POST:
        return apidoc(request)
    function = request.POST['action']
    #FIXME: possible to do this in f
    #data = json.loads(request.POST['data'])

    #FIXME: security considerations, web facing api should not call anything in globals!!!
    f = globals().get('api_'+function, None)
    if f:
        response = f(request)
    else:
        response = render_to_json_response(
            {'status': {'code': 400, 'text': 'Unknown function %s' % function}})
    #response['Access-Control-Allow-Origin'] = '*'
    return response

def api_hello(request):
    '''
        return {'status': {'code': int, 'text': string},
                'data': {user: object}}
    '''
    response = {'status': {'code': 200, 'text': 'ok'}, 'data': {}}
    if request.user.is_authenticated():
        response['data']['user'] = getUserJSON(request.user)
    else:
        response['data']['user'] = {'name': 'Guest'}
    return render_to_json_response(response)

def api_error(request):
    '''
        trows 503 error
    '''
    success = error_is_success
    return render_to_json_response({})

def _order_query(qs, s, prefix='sort__'):
    order_by = []
    for e in s.split(','):
        o = e.split(':')
        if len(o) == 1: o.append('asc')
        order = {'id': 'movieId'}.get(o[0], o[0])
        order = '%s%s' % (prefix, order)
        if o[1] == 'desc':
           order = '-%s' % order
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by)
    return qs

def _parse_query(request):
    get = json.loads(request.POST['data'])
    query = {}
    query['i'] = 0
    query['o'] = 100
    query['s'] = 'title:asc'
    def parse_dict(s):
        d = s.split(",")
        return [i.strip() for i in d]
    _dicts = ['p', ]
    _ints = ['n', ]
    for key in ('s', 'p', 'g', 'l', 'n'):
        if key in get:
            if key in _ints:
                query[key] = int(get[key])
            elif key in _dicts:
                query[key] = parse_dict(get[key])
            else:
                query[key] = get[key]
    query['q'] = models.Movie.objects.find(request)
    if 'r' in get:
        r = get['r'].split(':')
        if len(r) == 1: r.append(0)
        if r[0] == '': r[0] = 0
        if r[1] == '': r[0] = -1
        query['i'] = int(r[0])
        query['o'] = int(r[1])
    #group by only allows sorting by name or number of itmes
    return query

def api_find(request):
    '''
        param data
            {'q': query, 's': sort, 'r': range}
        
            q:  query string, can contain field:search more on query syntax at
                   http://wiki.0xdb.org/wiki/QuerySyntax
            s:  comma seperated list of field:order, default: director:asc,year:desc 
            r:  result ragne, from:to or from
            p:  properties to return, if obmited stats are returned
            g:  group elements by, country, genre, director...

        with p, items is list of dicts with requested properties:
          return {'status': {'code': int, 'text': string},
                'data': {items: array}}

        with g, items contains list of {'title': string, 'items': int}:
          return {'status': {'code': int, 'text': string},
                'data': {items: array}}

        with g + n=1, return number of items in given query
          return {'status': {'code': int, 'text': string},
                'data': {items: int}}

        without p or g, return stats about query:
          return {'status': {'code': int, 'text': string},
                'data': {items=int, files=int, pixels=int, size=int, duration=int}}
    '''
    query = _parse_query(request)
    response = {'status': {'code': 200, 'text':'ok'}, 'data':{}}
    if 'p' in query:
        response['data']['items'] = []
        qs = _order_query(query['q'], query['s'])
        if 'n' in query:
            response = {'items': qs.count()}
        else:
            _p = query['p']
            def only_p(m):
                r = {}
                if m:
                    m = json.loads(m)
                    for p in _p:
                        r[p] = m[p]
                return r
            qs = qs[query['i']:query['o']]

            response['data']['items'] = [only_p(m['json']) for m in qs.values('json')]

    elif 'g' in query:
        if query['s'].split(':')[0] not in ('name', 'items'):
            query['s'] = 'name'
        #FIXME: also filter lists here
        response['data']['items'] = []
        name = 'name'
        items = 'movies'
        movie_qs = query['q']
        _objects = {
            'country': models.Country.objects,
            'genre': models.Genre.objects,
            'language': models.Language.objects,
            'director': models.Person.objects.filter(cast__role='directors'),
        }
        if query['g'] in _objects:
            qs = _objects[query['g']].filter(movies__id__in=movie_qs).values('name').annotate(movies=Count('movies'))
        elif query['g'] == "year":
            qs = movie_qs.values('imdb__year').annotate(movies=Count('id'))
            name='imdb__year'
        if 'n' in query:
            response['data']['items'] = qs.count()
        else:
            #replace normalized items/name sort with actual db value
            order_by = query['s'].split(":")
            if len(order_by) == 1:
                order_by.append('desc')
            if order_by[0] == 'name':
                order_by = "%s:%s" % (name, order_by[1])
            else:
                order_by = "%s:%s" % (items, order_by[1])
            qs = _order_query(qs, order_by, '')
            qs = qs[query['i']:query['o']]

            response['data']['items'] = [{'title': i[name], 'items': i[items]} for i in qs]

    else:
        #FIXME: also filter lists here
        movies = models.Movie.objects.filter(available=True)
        files = models.File.objects.all()
        response['data']['items'] = movies.count()
        response['data']['files'] = files.count()
        r = files.aggregate(Count('size'), Count('pixels'), Count('duration'))
        response['data']['pixels'] = r['pixels__count']
        response['data']['size'] = r['size__count']
        response['data']['duration'] = r['duration__count']
    return render_to_json_response(response)

def api_getItem(request):
    '''
        param data
            string id

		return item array
    '''
    response = {'status': {'code': 200, 'text': 'ok'}}
    itemId = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Movie, movieId=itemId)
	#FIXME: check permissions
	response['data'] = {'item': item.json}
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
    item = get_object_or_404_json(models.Movie, movieId=data['id'])
    if item.editable(request.user):
		response = {'status': {'code': 501, 'text': 'not implemented'}}
		item.edit(data)
	else:
		response = {'status': {'code': 403, 'text': 'permission denied'}}
    return render_to_json_response(response)

@login_required_json
def api_removeItem(request):
    '''
        param data
            string id

        return {'status': {'code': int, 'text': string}}
    '''
    response = {'status': {'code': 200, 'text': 'ok'}}
    itemId = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Movie, movieId=itemId)
	if item.editable(request.user):
		response = {'status': {'code': 501, 'text': 'not implemented'}}
	else:
		response = {'status': {'code': 403, 'text': 'permission denied'}}
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
    response = {'status': {'code': 200, 'text': 'ok'}}
    data = json.loads(request.POST['data'])
    layer = get_object_or_404_json(models.Layer, pk=data['id'])
	if layer.editable(request.user):
		response = {'status': {'code': 501, 'text': 'not implemented'}}
	else:
		response = {'status': {'code': 403, 'text': 'permission denied'}}
    return render_to_json_response(response)

    response = {'status': {'code': 501, 'text': 'not implemented'}}
    return render_to_json_response(response)

@login_required_json
def api_addListItem(request):
    '''
        param data
            {key: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    response = {'status': {'code': 501, 'text': 'not implemented'}}
    return render_to_json_response(response)

@login_required_json
def api_removeListItem(request):
    '''
        param data
            {key: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    response = {'status': {'code': 501, 'text': 'not implemented'}}
    return render_to_json_response(response)

@login_required_json
def api_addList(request):
    '''
        param data
            {key: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    response = {'status': {'code': 501, 'text': 'not implemented'}}
    return render_to_json_response(response)

@login_required_json
def api_editList(request):
    '''
        param data
            {key: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    response = {'status': {'code': 501, 'text': 'not implemented'}}
    return render_to_json_response(response)

def api_removeList(request):
    '''
        param data
            {key: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    response = {'status': {'code': 501, 'text': 'not implemented'}}
    return render_to_json_response(response)

@login_required_json
def api_addArchive(request):
    '''
        ARCHIVE API NEEDS CLEANUP
        param data
            {name: string}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    data = json.loads(request.POST['data'])
    try:
        archive = models.Archive.objects.get(name=data['name'])
        response = {'status': {'code': 401, 'text': 'archive with this name exists'}}
    except models.Archive.DoesNotExist:
        archive = models.Archive(name=data['name'])
        archive.save()
        archive.users.add(request.user)
        response = {'status': {'code': 200, 'text': 'archive created'}}
    return render_to_json_response(response)

@login_required_json
def api_editArchive(request):
    '''
        ARCHIVE API NEEDS CLEANUP
        param data
            {id: string, key: value,..}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    data = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Archive, name=data['name'])
    if item.editable(request.user):
		response = {'status': {'code': 501, 'text': 'not implemented'}}
		item.edit(data)
	else:
		response = {'status': {'code': 403, 'text': 'permission denied'}}
    return render_to_json_response(response)

@login_required_json
def api_removeArchive(request):
    '''
        ARCHIVE API NEEDS CLEANUP
        param data
            string id

        return {'status': {'code': int, 'text': string}}
    '''
    response = {'status': {'code': 200, 'text': 'ok'}}
    itemId = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Archive, movieId=itemId)
	if item.editable(request.user):
		response = {'status': {'code': 501, 'text': 'not implemented'}}
	else:
		response = {'status': {'code': 403, 'text': 'permission denied'}}
    return render_to_json_response(response)



#@login_required_json
def api_update(request):
    '''
        param data
            {archive: string, files: json}
        return {'status': {'code': int, 'text': string},
                'data': {info: object, rename: object}}
    '''
    data = json.loads(request.POST['data'])
    archive = data['archive']
    files = data['files']
    archive = get_object_or_404_json(models.Archive, name=archive)
    if archive.editable(request.user):
		needs_data = []
		rename = {}
		for oshash in files:
			data = files[oshash]
			q = models.ArchiveFile.objects.filter(archive=archive, file__oshash=oshash)
			if q.count() == 0:
				#print "adding file", oshash, data['path']
				f = models.ArchiveFile.get_or_create(archive, oshash)
				f.update(data)
				if not f.file.movie:
					send_bg_message({'findMovie': f.file.id})
				#FIXME: only add if it was not in File
			else:
				f = q[0]
				if data['path'] != f.path:
					f.path = data['path']
					f.save()
			if f.file.needs_data:
				needs_data.append(oshash)
			if f.path != f.file.path:
				rename[oshash] = f.file.path
		#print "processed files for", archive.name
		#remove all files not in files.keys() from ArchiveFile
		response = {'status': {'code': 200, 'text': 'ok'}, 'data': {}}
		response['data']['info'] = needs_data
		response['data']['rename'] = rename
	else:
        response = {'status': {'code': 403, 'text': 'permission denied'}}
    return render_to_json_response(response)

def api_encodingSettings(request):
    '''
        returns Firefogg encoding settings as specified by site
        return {'status': {'code': int, 'text': string},
                'data': {'options': {'videoQuality':...}}}
    '''
    response = {'status': {'code': 200, 'text': 'ok'}}
    response['data'] = {'options': {'preset': 'padma'}}
    return render_to_json_response(response)

class UploadForm(forms.Form):
    data = forms.TextInput()
    file = forms.FileField()

class VideoChunkForm(forms.Form):
    chunk = forms.FileField()
    done = forms.IntegerField(required=False)

@login_required_json
def api_upload(request): #video, timeline, frame
    '''
        upload video, timeline or frame
        param data
        param file
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    form = UploadForm(request.POST, request.FILES)
    if form.is_valid():
        data = json.loads(request.POST['data'])
        oshash = data['oshash']
        f = get_object_or_404(models.File, oshash=oshash)
        if data['item'] == 'frame':
            ff = form.cleaned_data['file']
            position = data['position']
            frame, created = models.Frame.objects.get_or_create(file=f, position=position)
            if not created and frame.frame:
                frame.frame.delete()
            frame.frame.save(ff.name, ff)
            frame.save()
            response = {'status': {'code': 200, 'text': 'ok'}}
            response['url'] = frame.frame.url
            return render_to_json_response(response)
        if data['item'] == 'timeline':
            pass
            #print "not implemented"

    response = {'status': {'code': 501, 'text': 'not implemented'}}
    return render_to_json_response(response)

@login_required_json
def firefogg_upload(request):
    #handle video upload
    if request.method == 'POST':
        #init upload
        if 'oshash' in request.POST:
            #FIXME: what to do if requested oshash is not in db?
            #FIXME: should existing data be reset here? or better, should this fail if an upload was there
            f = get_object_or_404(models.File, oshash=request.POST['oshash'])
            if f.stream96p:
                f.stream96p.delete()
            f.available = False
            f.save()
            response = {
                'uploadUrl': request.build_absolute_uri('/api/upload/?oshash=%s' % f.oshash),
                'result': 1
            }
            return render_to_json_response(response)
        #post next chunk
        if 'chunk' in request.FILES and 'oshash' in request.GET:
            print "all chunk now"
            f = get_object_or_404(models.File, oshash=request.GET['oshash'])
            form = VideoChunkForm(request.POST, request.FILES)
            #FIXME: 
            if form.is_valid() and f.editable(request.user):
                c = form.cleaned_data['chunk']
                response = {
                    'result': 1,
                    'resultUrl': request.build_absolute_uri('/')
                }
                if not f.save_chunk(c, c.name):
                    response['result'] = -1
                elif form.cleaned_data['done']:
                    #FIXME: send message to encode deamon to create derivates instead
                    f.available = True
                    f.save()
                    response['result'] = 1
                    response['done'] = 1
                return render_to_json_response(response)
    print request.GET, request.POST
    response = {'status': {'code': 400, 'text': 'this request requires POST'}}
    return render_to_json_response(response)

@login_required_json
def api_editFile(request): #FIXME: should this be file.files. or part of update
    '''
        change file / imdb link
    '''
    response = {'status': {'code': 501, 'text': 'not implemented'}}
    return render_to_json_response(response)

def api_parse(request): #parse path and return info
    '''
        param data
            {path: string}
        return {'status': {'code': int, 'text': string},
                data: {imdb: string}}
    '''
    path = json.loads(request.POST['data'])['path']
    response = utils.parsePath(path)
    response = {'status': {'code': 200, 'text': 'ok'}, data: response}
    return render_to_json_response(response)

def api_getImdbId(request):
    '''
        param data
            {title: string, director: string, year: string}
        return {'status': {'code': int, 'text': string},
                'data': {imdbId:string }}
    '''
    imdbId = oxweb.imdb.guess(search_title, r['director'], timeout=-1)
    if imdbId:
        response = {'status': {'code': 200, 'text': 'ok'},
                    'data': {'imdbId': imdbId}}
    else:
        response = {'status': {'code': 404, 'text': 'not found'}}
    return render_to_json_response(response)

def api_fileInfo(request):
    '''
        param data
            oshash string
        return {'status': {'code': int, 'text': string},
                'data': {imdbId:string }}
    '''
    if 'data' in request.POST:
		oshash = json.loads(request.POST['data'])
	elif 'oshash' in request.GET:
		oshash = request.GET['oshash']
    f = models.MovieFile.objects.get(oshash=oshash)
    response = {'data': f.json()}
    return render_to_json_response(response)

def api_subtitles(request):
	'''
	param data
		oshash string
		language string
		subtitle string
	return
		if no language is provided:
			{data: {languages: array}}
		if language is set:
			{data: {subtitle: string}}
		if subtitle is set:
			saves subtitle for given language
	'''
    if 'data' in request.POST:
		data = json.loads(request.POST['data'])
		oshash = data['oshash']
		language = data.get('language', None)
		srt = data.get('subtitle', None)
	if srt:
        user = request.user
        sub = models.Subtitles.objects.get_or_create(user, oshash, language)
        sub.srt = srt
        sub.save()
    else:
		response = {'status': {'code': 200, 'text': 'ok'}, 'data':{}}
        if language:
            q = models.Subtitles.objects.filter(movie_file__oshash=oshash, language=language)
            if q.count() > 0:
				response['data']['subtitle'] = q[0].srt
				return render_to_json_response(response)
        l = models.Subtitles.objects.filter(movie_file__oshash=oshash).values('language')
        response['data']['languages'] = [f['language'] for f in l]
        return render_to_json_response(response)

'''
GET list
    > {
      "files": {
        "a41cde31c581e11d": {"path": "E/Example, The/An Example.avi", "size":1646274},
      }
    }
'''
@login_required_json
def list_files(request):
    response = {}
    response['files'] = {}
    qs = models.UserFile.filter(user=request.user)
    p = Paginator(qs, 1000)
    for i in p.page_range:
        page = p.page(i)
        for f in page.object_list:
              response['files'][f.movie_file.oshash] = {'path': f.path, 'size': f.movie_file.size}
    return render_to_json_response(response)

def find_files(request):
    response = {}
    query = _parse_query(request)
    response['files'] = {}
    qs = models.UserFile.filter(user=request.user).filter(movie_file__movie__id__in=query['q'])
    p = Paginator(qs, 1000)
    for i in p.page_range:
        page = p.page(i)
        for f in page.object_list:
              response['files'][f.movie_file.oshash] = {'path': f.path, 'size': f.movie_file.size}
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
    context = RequestContext(request, {'api': api})
    return render_to_response('api.html', context)
