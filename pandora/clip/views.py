# -*- coding: utf-8 -*-
from __future__ import division, print_function, absolute_import

from django.conf import settings
import ox
from oxdjango.shortcuts import render_to_json_response, json_response

from oxdjango.api import actions

from annotation.models import Annotation
from entity.models import Entity
from item.models import Item
from item import utils
from changelog.models import add_changelog

from . import models


def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'in', 'operator':'+'}]
    for key in ('keys', 'group', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Clip.objects.find(query, user)
    query['filter'] = models.Clip.objects.filter_annotations(query, user)
    if 'itemsQuery' in data and data['itemsQuery'].get('conditions'):
        item_query = Item.objects.find({'query': data['itemsQuery']}, user)
        query['qs'] = query['qs'].filter(item__in=item_query)
    return query

def order_query(qs, sort):
    order_by = []
    sort += [
        {'key': 'position', 'operator': '+'},
        {'key': 'text', 'operator': '-'}
    ]
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        clip_keys = ('public_id', 'start', 'end', 'hue', 'saturation', 'lightness', 'volume',
                     'duration', 'sortvalue', 'videoRatio',
                     'random__random')
        key = {
            'id': 'public_id',
            'in': 'start',
            'out': 'end',
            'position': 'start',
            'text': 'sortvalue',
            'videoRatio': 'aspect_ratio',
            'random': 'random__random',
        }.get(e['key'], e['key'])
        if key.startswith('clip:'):
            key = e['key'][len('clip:'):]
            key = {
                'text': 'sortvalue',
                'position': 'start',
            }.get(key, key)
        elif key not in clip_keys:
            #key mgith need to be changed, see order_sort in item/views.py
            key = "sort__%s" % key
        if key == 'public_id':
            order_by.append('%s%s' % (operator, 'sort__public_id'))
            order_by.append('%s%s' % (operator, 'start'))
            order_by.append('end')
        else:
            order = '%s%s' % (operator, key)
            order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    return qs

def findClips(request, data):
    '''
    Finds clips for a given query
    takes {
        query: object, // find clips, query object, see `find`
        itemsQuery: object, // limit to matching items, query object, see `find`
        keys: [string], // list of properties to return, include 'annotations' to get all annotations for a clip
        positions: [int], // list of positions
        range: [int, int], // range of results to return
        sort: [object] // list of sort objects, see `find`
    }
    returns {
        items: [object] // list of clip objects
    }
    see: find
    '''
    response = json_response()

    query = parse_query(data, request.user)
    qs = query['qs']
    if 'keys' in data:
        qs = order_query(qs, query['sort'])
        qs = qs[query['range'][0]:query['range'][1]]
        #qs = qs.select_related('item')

        layers = settings.CONFIG['layers']
        entity_layer_ids = [k['id'] for k in layers if k['type'] == 'entity']
        subtitles = utils.get_by_key(layers, 'isSubtitles', True)
        layer_ids = [k['id'] for k in layers]
        keys = list(filter(lambda k: k not in layer_ids + ['annotations'], data['keys']))

        clips = {}
        response['data']['items'] = clip_jsons = []
        for p in qs:
            j = p.json(keys=keys)
            clips[p.id] = j
            clip_jsons.append(j)

        keys = data['keys']

        def add_annotations(key, qs, add_layer=False):
            values = ['public_id', 'layer', 'value', 'clip_id']
            if query['filter']:
                for limit in query['filter']:
                    qs = qs.filter(limit)
            for i in response['data']['items']:
                if not key in i:
                    i[key] = []
            entity_annotations = {}

            for a in qs.values(*values):
                i = clips[a['clip_id']]
                l = {
                    'id': a['public_id'],
                    'value': a['value'],
                }
                if subtitles and a['layer'] == subtitles['id'] and not a['value']:
                    del l['id']
                if add_layer:
                    l['layer'] = a['layer']
                i[key].append(l)

                if a['layer'] in entity_layer_ids:
                    entity_annotations.setdefault(l['value'], []).append(l)

            if entity_annotations:
                ids = map(ox.fromAZ, entity_annotations)
                for e in Entity.objects.filter(id__in=ids).only('name'):
                    for l in entity_annotations[e.get_id()]:
                        l['value'] = e.annotation_value()

        if response['data']['items']:
            if 'annotations' in keys:
                aqs = Annotation.objects.filter(layer__in=settings.CONFIG['clipLayers'],
                                                clip__in=clips)
                add_annotations('annotations', aqs, True)

            for layer in list(filter(lambda l: l in keys, layer_ids)):
                aqs = Annotation.objects.filter(layer=layer, clip__in=clips)
                add_annotations(layer, aqs)
    elif 'position' in query:
        qs = order_query(qs, query['sort'])
        ids = [u'%s/%0.03f-%0.03f' % (c['item__public_id'], c['start'], c['end'])
            for c in qs.values('item__public_id', 'start', 'end')]
        data['conditions'] = data['conditions'] + {
            'value': data['position'],
            'key': query['sort'][0]['key'],
            'operator': '^'
        }
        query = parse_query(data, request.user)
        qs = order_query(query['qs'], query['sort'])
        if qs.count() > 0:
            response['data']['position'] = utils.get_positions(ids, [qs[0].public_id])[0]
    elif 'positions' in data:
        qs = order_query(qs, query['sort'])
        ids = [u'%s/%0.03f-%0.03f' % (c['item__public_id'], c['start'], c['end'])
            for c in qs.values('item__public_id', 'start', 'end')]
        response['data']['positions'] = utils.get_positions(ids, data['positions'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findClips)
