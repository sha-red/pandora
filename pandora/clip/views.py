# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from ox.utils import json
from ox.django.shortcuts import render_to_json_response, json_response

from api.actions import actions
from item.models import Item
from item import utils

import models


def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'in', 'operator':'+'}]
    for key in ('keys', 'group', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Clip.objects.find(query, user)
    if 'itemQuery' in data and data['itemQuery'].get('conditions'):
        item_query = Item.objects.find({'query': data['itemQuery']}, user)
        query['qs'] = query['qs'].filter(item__in=item_query)
    return query

def order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        clip_keys = ('public_id', 'start', 'end', 'hue', 'saturation', 'lightness', 'volume',
                     'annotations__value',
                     'director', 'title')
        key = {
            'id': 'public_id',
            'in': 'start',
            'out': 'end',
            'position': 'start',
            'text': 'annotations__value',
        }.get(e['key'], e['key'])
        if key.startswith('clip:'):
            key = e['key'][len('clip:'):]
            key = {
                'text': 'annotations__value',
                'position': 'start',
            }.get(key, key)
        elif key not in clip_keys:
            #key mgith need to be changed, see order_sort in item/views.py
            key = "item__sort__%s" % key
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    return qs

def findClips(request):
    '''
        param data {
            query: ...
            itemQuery: ...
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

    query = parse_query(data, request.user)
    qs = order_query(query['qs'], query['sort'])
    if 'keys' in data:
        qs = qs.select_related()
        qs = qs[query['range'][0]:query['range'][1]]
        response['data']['items'] = [p.json(keys=data['keys']) for p in qs]
    elif 'position' in query:
        ids = [i.public_id for i in qs]
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
        ids = [i.public_id for i in qs]
        response['data']['positions'] = utils.get_positions(ids, data['positions'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findClips)
