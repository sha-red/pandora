# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from django.conf import settings
from ox.utils import json
from ox.django.shortcuts import render_to_json_response, json_response

from api.actions import actions

from annotation.models import Annotation
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
    if 'itemsQuery' in data and data['itemsQuery'].get('conditions'):
        item_query = Item.objects.find({'query': data['itemsQuery']}, user)
        query['qs'] = query['qs'].filter(item__in=item_query)
    return query

def order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        clip_keys = ('public_id', 'start', 'end', 'hue', 'saturation', 'lightness', 'volume',
                     'annotations__value', 'videoRatio',
                     'director', 'title')
        key = {
            'id': 'public_id',
            'in': 'start',
            'out': 'end',
            'position': 'start',
            'text': 'annotations__value',
            'videoRatio': 'aspect_ratio',
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
            itemsQuery: ...
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
    qs = query['qs']
    if 'keys' in data:
        qs = order_query(qs, query['sort'])
        qs = qs[query['range'][0]:query['range'][1]]
        #qs = qs.select_related('item__sort')
        ids = []
        keys = filter(lambda k: k not in models.Clip.layers, data['keys'])
        def add(p):
            ids.append(p.id)
            return p.json(keys=keys)
        response['data']['items'] = [add(p) for p in qs]

        keys = data['keys']

        def add_annotations(layer, qs):
            for a in qs.values('public_id', 'value', 'clip__public_id'):
                for i in response['data']['items']:
                    if i['id'] == a['clip__public_id']:
                        if not layer in i:
                            i[layer] = []
                        i[layer].append({
                            'id': a['public_id'],
                            'value': a['value'],
                        })
        if response['data']['items']:
            if 'annotations' in keys:
                add_annotations('annotations',
                    Annotation.objects.filter(layer__in=models.Clip.layers, clip__in=ids))
            for layer in filter(lambda l: l in keys, models.Clip.layers):
                add_annotations(layer,
                    Annotation.objects.filter(layer=layer, clip__in=ids))
    elif 'position' in query:
        qs = order_query(qs, query['sort'])
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
        qs = order_query(qs, query['sort'])
        ids = [i.public_id for i in qs]
        response['data']['positions'] = utils.get_positions(ids, data['positions'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findClips)
