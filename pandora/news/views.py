# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from django.conf import settings

import ox
from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response


from item.models import Item
from ox.django.api import actions

from item import utils
from item.models import Item

import models

def getNews(request):
    '''
        param data {
        }

        return {
            'status': {'code': int, 'text': string}
            'data': {
                items = [{..}, {...}, ...]
            }
        }
    '''
    data = json.loads(request.POST['data'])
    response = json_response()
    qs = models.News.objects.all().order_by('-date')
    response['data']['items'] = [p.json() for p in qs]
actions.register(getNews)

@login_required_json
def addNews(request):
    '''
        param data {
            title: string,
            date: string,
            text: text,
        }
        return {'status': {'code': int, 'text': string},
                'data': {
                    id: 123,
                    ...
                }
        }
    '''
    data = json.loads(request.POST['data'])

    news = models.News()
    for key in ('title', 'text', 'date'):
        if key in data:
            setattr(news, key, data[key])
    news.save()
    response = json_response(news.json())
    return render_to_json_response(response)
actions.register(addNews, cache=False)


@login_required_json
def removeNews(request):
    '''
        param data {
            ids: []
        }
        return {'status': {'code': int, 'text': string},
                'data': {
                }
        }
    '''
    response = json_response({})
    data = json.loads(request.POST['data'])
    failed = []
    ids = [ox.fromAZ(i) for i in data['ids']]
    for a in models.News.objects.filter(id__in=ids):
        if a.editable(request.user):
            a.delete()
        else:
            failed.append(a.id)
    if failed:
        response = json_response(status=403, text='permission denied')
        response['data']['ids'] = [ox.toAZ(i) for i in failed]
    return render_to_json_response(response)
actions.register(removeNews, cache=False)

@login_required_json
def editNews(request):
    '''
        param data {
            id:,
            title:
            text:
            date:
        }
        return {'status': {'code': int, 'text': string},
                'data': {
                    id:
                    ...
                }
        }
    '''
    response = json_response({})
    data = json.loads(request.POST['data'])
    n = get_object_or_404_json(models.News, id=ox.fromAZ(data['id']))
    if n.editable(request.user):
        for key in ('title', 'text', 'date'):
            if key in data:
                setattr(n, key, data[key])
        n.save()
        response['data'] = n.json()
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editNews, cache=False)
