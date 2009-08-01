# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os.path
from django.db import models
from django.db.models import Q, Avg, Count
from django.contrib.auth.models import User
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404
from django.template import RequestContext
from django.core.paginator import Paginator

from oxdb.utils.shortcuts import render_to_json_response

import models

'''
.length -> _sort

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
def parse_query(get):
    query = {}
    query["o"] = 0
    query["n"] = 100
    query["q"] = "The"
    query["f"] = "all"
    query["s"] = "title"
    query["a"] = "desc"
    def parse_dict(s):
        d = s.split(",")
        return [i.strip() for i in d]
    _dicts = ['p', ]
    _ints = ['o', 'n']
    for key in ('q', 'f', 's', 'a', 'p', 'g', 'o', 'n'):
        if key in get:
            if key in _ints:
                query[key] = int(get[key])
            elif key in _dicts:
                query[key] = parse_dict(get[key])
            else:
                query[key] = get[key]
    print query
    return query

def find(request):
    query = parse_query(request.GET)
    response = {}
    if "p" in query:
        response['movies'] = []

        qs = models.Movie.objects.find(**query)
        p = Paginator(qs, 100)
        for i in p.page_range:
            page = p.page(i)
            for m in page.object_list:
                  response['movies'].append(m.json(query['p']))
    elif "g" in query:
        response['groups'] = []
        name = "name"
        movies = "movies"
        if query["g"] == "country":
            qs = models.Country.objects.values("name").annotate(movies=Count('movies'))
        if query["g"] == "genre":
            qs = models.Genre.objects.values("name").annotate(movies=Count('movies'))
        if query["g"] == "language":
            qs = models.Language.objects.values("name").annotate(movies=Count('movies'))
        if query["g"] == "director":
            qs = models.Person.objects.filter(cast__role="directors").values("name").annotate(movies=Count('movies'))
        if query["g"] == "year":
            qs = models.Movie.objects.values('year').annotate(movies=Count('id'))
            name="year"
        qs = qs[query['o']:query['n']]
        for i in qs:
            group = {"name": i[name], "movies": i[movies]}
            response['groups'].append(group)
    else:
        response['movies'] = models.Movie.objects.all().count()
        response['files'] = models.MovieFile.objects.all().count()
        r = models.MovieFile.objects.all().aggregate(Count('size'), Count('pixels'), Count('duration'))
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
    if language:
        return srt
    return movie.subtitle_languages()

'''
GET list
    > {
      "files": {
        "a41cde31c581e11d": {"path": "E/Example, The/An Example.avi", "size":1646274},
      }
    }
'''
def list_files(request):
    files = {}
    return dict(files=files)

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
def add_file(request):
    oshash = request.POST['oshash']

'''
POST remove?oshash=
'''
def remove_file(request):
    oshash = request.POST['oshash']


