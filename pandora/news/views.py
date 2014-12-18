# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

import ox
from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response


from ox.django.api import actions
from changelog.models import add_changelog

import models

def getNews(request, data):
    '''
    Gets one or all news items
    takes {
        id: string // news item id (optional)
    }
    returns { // if `id` is present
        id: string, // news item id
        key: value, // property id and value
        ... // more key/value pairs
    } or { // if `id` is missing
        items: [
            {
                id: string, // news item id
                key: value, // property id and value
                ... // more key/value pairs
            },
            ... // more news items
        ]
    }
    see: addNews, editNews, removeNews
    '''
    response = json_response()
    if 'id' in data:
        news = get_object_or_404_json(models.News, id=ox.fromAZ(data['id']))
        response['data'] = news.json()
    else:
        qs = models.News.objects.all().order_by('-date')
        response['data']['items'] = [p.json() for p in qs]
    return render_to_json_response(response)
actions.register(getNews)

@login_required_json
def addNews(request, data):
    '''
    Adds a new news item
    takes {
        date: string, // date (format undocumented)
        text: text, // text
        title: string // title
    }
    returns {
        id: string, // news item id
        ... // more key/value pairs
    }
    see: editNews, getNews, removeNews
    '''
    news = models.News()
    for key in ('title', 'text', 'date'):
        if key in data:
            setattr(news, key, data[key])
    news.save()
    response = json_response(news.json())
    add_changelog(request, data, news.get_id())
    return render_to_json_response(response)
actions.register(addNews, cache=False)

@login_required_json
def removeNews(request, data):
    '''
    Removes a news item
    takes {
        id: string // news item id
    }
    returns {}
    see: addNews, editNews, getNews
    '''
    response = json_response({})
    news = get_object_or_404_json(models.News, id=ox.fromAZ(data['id']))
    if news.editable(request.user):
        add_changelog(request, data)
        news.delete()
        response = json_response(status=200, text='news removed')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(removeNews, cache=False)

@login_required_json
def editNews(request, data):
    '''
    Edits a news item
    takes {
        date: string, // date (format undocumented)
        id: string, // news item id
        text: string, // text
        title: string // title
    }
    returns {
        id: string
        ...
    }
    see: addNews, getNews, removeNews
    '''
    response = json_response({})
    n = get_object_or_404_json(models.News, id=ox.fromAZ(data['id']))
    if n.editable(request.user):
        for key in ('title', 'text', 'date'):
            if key in data:
                setattr(n, key, data[key])
        n.save()
        response['data'] = n.json()
        add_changelog(request, data)
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editNews, cache=False)
