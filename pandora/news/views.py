# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from django.conf import settings

import ox
from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response


from item.models import Item
from api.actions import actions

from item import utils
from item.models import Item

import models


def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'in', 'operator':'+'}]
    for key in ('keys', 'group', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.News.objects.find(query, user)
    if 'itemQuery' in data:
        item_query = Item.objects.find({'query': data['itemQuery']}, user)
        query['qs'] = query['qs'].filter(item__in=item_query)
    return query

def news_sort_key(key):
    return {
        'text': 'value',
        'position': 'start',
    }.get(key, key)

def order_query(qs, sort):
    order_by = []
    print sort
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'duration': 'clip__duration',
            'in': 'start',
            'lightness': 'clip__lightness',
            'out': 'end',
            'saturation': 'clip__saturation',
            'volume': 'clip__volume',
        }.get(e['key'], e['key'])
        if key.startswith('clip:'):
            key = news_sort_key(e['key'][len('clip:'):])
        elif key not in ('start', 'end', 'value') and not key.startswith('clip__'):
            #key mgith need to be changed, see order_sort in item/views.py
            key = "item__sort__%s" % key
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    return qs

def findNews(request):
    '''
        param data {
            query: ...
            itemQuery: ...
        }

        return {
            'status': {'code': int, 'text': string}
            'data': {
                newss = [{..}, {...}, ...]
            }
        }
    '''
    data = json.loads(request.POST['data'])
    response = json_response()

    query = parse_query(data, request.user)
    qs = order_query(query['qs'], query['sort'])
    if 'keys' in data:
        qs = qs[query['range'][0]:query['range'][1]]
        response['data']['items'] = [p.json(keys=data['keys']) for p in qs]
    elif 'position' in query:
        ids = [ox.to26(i.id) for i in qs]
        data['conditions'] = data['conditions'] + {
            'value': data['position'],
            'key': query['sort'][0]['key'],
            'operator': '^'
        }
        query = parse_query(data, request.user)
        qs = order_query(query['qs'], query['sort'])
        if qs.count() > 0:
            response['data']['position'] = utils.get_positions(ids, [qs[0].itemId])[0]
    elif 'positions' in data:
        ids = [ox.to26(i.id) for i in qs]
        response['data']['positions'] = utils.get_positions(ids, data['positions'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findNews)


@login_required_json
def addNews(request):
    '''
        param data {
            title: string,
            content: text,
            public: boolean
        }
        return {'status': {'code': int, 'text': string},
                'data': {
                    id: 123,
                    ...
                }
        }
    '''
    data = json.loads(request.POST['data'])

    news = models.News(
        user=request.user,
        title=data['title'],
        content=data['content'],
        public=data['content'])
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
    ids = [ox.from26(i) for i in data['ids']]
    for a in models.News.objects.filter(id__in=ids):
        if a.editable(request.user):
            a.delete()
        else:
            failed.append(a.id)
    if failed:
        response = json_response(status=403, text='permission denied')
        response['data']['ids'] = [ox.to26(i) for i in failed]
    return render_to_json_response(response)
actions.register(removeNews, cache=False)


@login_required_json
def editNews(request):
    '''
        param data {
            id:,
            title:
            content:
            public:
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
    n = get_object_or_404_json(models.News, id=ox.from26(data['id']))
    if n.editable(request.user):
        for key in ('title', 'content', 'public'):
            if key in data:
                setattr(n, key, data[key])
        n.save()
        response['data'] = n.json()
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editNews, cache=False)
