# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os.path
import re
from datetime import datetime
from urllib2 import unquote

from django.db import models
from django.db.models import Q, Avg, Count
from django.contrib.auth.models import User
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404
from django.template import RequestContext
from django.core.paginator import Paginator
from django.contrib.auth.decorators import login_required

from oxdb.utils.shortcuts import render_to_json_response

import models

    
'''

field.length -> movie.sort.all()[0].field
o=0&n=100


a & b  | c & d

query


l=user:name or l=name
q=year:1980,hello,country:usa
q=year:1980,hello,country:!usa
q=title:^the$
q=title:^100%24$
q=year:<1970,year:>1960
q=year:<1960,year:>1950,title:sex

!1960-1970
2009.08.02.22.26.35-2009.08.02.22.26.35

!^the

 (dddd.dd.dd)-(dddd.dd.dd)

5-8
10000-20000

<2009-08-02-22-26-35

>2009-08-02-22-26-35
2009-08-02-22-26-35<

^the the*
*foo foo$
*foo* foo

s=director:asc,year:desc               default: director:asc,year:desc
r=0:100 or r=100 or r=100:             default: 0:100
k=id,title,director,date,cast.length   default: title,director,year,country


id=0133093

/json/find?l=all&s=date&f=all&q=&a=desc&p=id,title,director,date,cast.length

/json/find?o=0&n=100&l=all&s=date&f=all&q=&a=desc&p=id,title,director,date,cast.length
    {
        movies=[
            {
                "id":
                "title": "fsdf",
                "director":
            },
        ]
    }

#get sort order for all ids
/json/find?o=0&n=1000&l=all&s=date&f=all&q=&a=desc&p=id
    {
        movies=[
            {
                "id": id
            },
        ]
    }

/json/find?l=all&s=date&f=all&q=&a=desc
    {
        movies: 1234,
        files: 2345,
        pixels: 1242345345,
        size: 1235,
        duration: 1235,

    }

/json/find?o=0&n=100&l=all&s=[name, items]&f=all&q=&a=desc&g=country
    {
        groups = [ {name:"USA", movies: 123}, {name:"UK", movies: 1234} ]
    }

#find as you type: in table, by sort string

#auto compleat in find box

'''

def order_query(qs, s, prefix='sort__'):
    order_by = []
    for e in s.split(','):
        o = e.split(':')
        if len(o) == 1: o.append('asc')
        order = '%s%s' % (prefix, o[0])
        if o[1] == 'desc':
           order = '-%s' % order
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by)
    return qs

def parse_query(request):
    get = request.GET
    query = {}
    query['i'] = 0
    query['o'] = 100
    query['s'] = 'title:asc'
    def parse_dict(s):
        d = s.split(",")
        return [i.strip() for i in d]
    _dicts = ['k', ]
    _ints = ['o', 'n']
    for key in ('s', 'k', 'g', 'l'):
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
    return query

def find(request):
    query = parse_query(request)
    response = {}
    if 'k' in query:
        response['movies'] = []
        qs = order_query(query['q'], query['s'])
        qs = qs[query['i']:query['o']]
        p = Paginator(qs, 100)
        for i in p.page_range:
            page = p.page(i)
            for m in page.object_list:
                  response['movies'].append(m.json(query['k']))
    elif 'g' in query:
        #FIXME: also filter lists here
        response['groups'] = []
        name = 'name'
        movies = 'movies'
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
            qs = movie_qs.values('year').annotate(movies=Count('id'))
            name='year'
        qs = order_query(qs, query['s'], '')
        qs = qs[query['i']:query['o']]
        for i in qs:
            group = {'name': i[name], 'movies': i[movies]}
            response['groups'].append(group)
    else:
        #FIXME: also filter lists here
        movies = models.Movie.objects.all()
        files = models.MovieFile.objects.all()
        response['movies'] = movies.count()
        response['files'] = files.count()
        r = files.aggregate(Count('size'), Count('pixels'), Count('duration'))
        response['pixels'] = r['pixels__count']
        response['size'] = r['size__count']
        response['duration'] = r['duration__count']
    return render_to_json_response(response)

'''
GET info?oshash=a41cde31c581e11d
    > {
        "movie_id": 0123456,
        "duration": 5.266667,
        "video_codec": "mpeg1",
        "pixel_format": "yuv420p",
        "width": 352,
        "height": 240,
        "pixel_aspect_ratio": "1:1",
        "display_aspect_ratio": "22:15",
        "framerate": "30:1",
        "audio_codec": "mp2",
        "samplerate": 44100,
        "channels": 1,
        "path": "E/Example, The/An Example.avi",
        "size": 1646274
        "oshash": "a41cde31c581e11d",
        "sha1":..,
        "md5":..
      }
'''
def file_info(request):
    oshash = request.GET['oshash']
    f = models.MovieFile.objects.get(oshash=oshash)
    response = f.json()
    return render_to_json_response(response)


'''
GET subtitles?oshash=a41cde31c581e11d
  > {
    "languages": ['en', 'fr', 'de']
  }
GET subtitles?oshash=a41cde31c581e11d&language=en
    > srt file
POST subtitle?oshash=a41cde31c581e11d&language=en
srt =
'''
def subtitles(request):
    oshash = request.GET['oshash']
    language = request.GET.get('language', None)
    if requeset.method == 'POST':
        user = request.user
        sub = models.Subtitles.get_or_create(user, oshash, language)
        sub.srt = request.POST['srt']
        sub.save()
    else:
        if language:
            q = models.Subtitles.objects.filter(movie_file__oshash=oshash, language=language)
            if q.count() > 0:
                return HttpResponse(q[0].srt, content_type='text/x-srt')
        response = {}
        l = models.Subtitles.objects.filter(movie_file__oshash=oshash).values('language')
        response['languages'] = [f['language'] for f in l]
        return render_to_json_response(response)

'''
GET list
    > {
      "files": {
        "a41cde31c581e11d": {"path": "E/Example, The/An Example.avi", "size":1646274},
      }
    }
'''
@login_required
def list_files(request):
    response['files'] = {}
    qs = models.UserFile.filter(user=request.user)
    p = Paginator(qs, 1000)
    for i in p.page_range:
        page = p.page(i)
        for f in page.object_list:
              response['files'][f.movie_file.oshash] = {'path': f.path, 'size': f.movie_file.size}
    return render_to_json_response(response)

def find_files(request):
    query = parse_query(request)
    response['files'] = {}
    qs = models.UserFile.filter(user=request.user).filter(movie_file__movie__id__in=quert['q'])
    p = Paginator(qs, 1000)
    for i in p.page_range:
        page = p.page(i)
        for f in page.object_list:
              response['files'][f.movie_file.oshash] = {'path': f.path, 'size': f.movie_file.size}
    return render_to_json_response(response)

'''
POST add
    > {
        "duration": 5.266667,
        "video_codec": "mpeg1",
        "pixel_format": "yuv420p",
        "width": 352,
        "height": 240,
        "pixel_aspect_ratio": "1:1",
        "display_aspect_ratio": "22:15",
        "framerate": "30:1",
        "audio_codec": "mp2",
        "samplerate": 44100,
        "channels": 1,
        "path": "E/Example, The/An Example.avi",
        "size": 1646274
        "oshash": "a41cde31c581e11d",
        "sha1":..,
        "md5":..
      }
'''
@login_required
def add_file(request, archive):
    oshash = request.POST['oshash']
    archive = models.Archive.objects.get(name=archive)
    if archive.users.filter(user=request.user).count() == 1:
        user_file = models.ArchiveFiles.get_or_create(request.user, oshash)
        user_file.update(request.POST)
        response = {'status': 200}
    else:
        response = {'status': 404}
    return render_to_json_response(response)

'''
POST remove?oshash=
'''
@login_required
def remove_file(request, archive):
    oshash = request.POST['oshash']
    archive = models.Archive.objects.get(name=archive)
    models.UserFiles.objects.filter(movie_file__oshash=oshash, user=request.user).delete()
    response = {'status': 200}
    return render_to_json_response(response)

'''
POST preferences/get?key=
POST preferences/set?key=&value
'''
@login_required
def preferences(request):
    oshash = request.POST['oshash']
    return ''


