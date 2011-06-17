# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

import ox
from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response


from app.models import site_config
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
    query['qs'] = models.Annotation.objects.find(query, user)
    if 'itemQuery' in data:
        item_query = Item.objects.find({'query': data['itemQuery']}, user)
        query['qs'] = query['qs'].filter(item__in=item_query)
    return query

def order_query(qs, sort):
    qs = qs.order_by('start')
    return qs

def findAnnotations(request):
    '''
        param data {
            query: ...
            itemQuery: ...
        }

        return {
            'status': {'code': int, 'text': string}
            'data': {
                annotations = [{..}, {...}, ...]
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
        ids = [i.get_id() for i in qs]
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
        ids = [i.get_id() for i in qs]
        response['data']['positions'] = utils.get_positions(ids, data['positions'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findAnnotations)


@login_required_json
def addAnnotation(request):
    '''
        param data {
            item: itemId,
            layer: layerId,
            in: float,
            out: float,
            value: string
        }
        return {'status': {'code': int, 'text': string},
                'data': {
                    id: 123,
                    ...
                }
        }
    '''
    data = json.loads(request.POST['data'])
    for key in ('item', 'layer', 'in', 'out', 'value'):
        if key not in data:
            return render_to_json_response(json_response(status=400,
                                                         text='invalid data'))

    #FIXME: this should be only called starting up server
    models.load_layers(site_config()['layers'])

    item = get_object_or_404_json(Item, itemId=data['item'])
    layer = get_object_or_404_json(models.Layer, name=data['layer'])

    annotation = models.Annotation(
        item=item,
        layer=layer,
        user=request.user,
        start=float(data['in']), end=float(data['out']),
        value=data['value'])
    annotation.save()
    response = json_response(annotation.json())
    return render_to_json_response(response)

    response = {'status': {'code': 501, 'text': 'not implemented'}}
    return render_to_json_response(response)
actions.register(addAnnotation, cache=False)


@login_required_json
def removeAnnotations(request):
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
    ids = map(ox.from32, data['ids'])
    failed = []
    for a in models.Annotation.objects.filter(id__in=ids):
        if a.editable(request.user):
            a.delete()
        else:
            failed.append(a.get_id)
    if failed:
        response = json_response(status=403, text='permission denied')
        response['data']['ids'] = failed
    return render_to_json_response(response)
actions.register(removeAnnotations, cache=False)


@login_required_json
def editAnnotation(request):
    '''
        param data {
            id:,
            in: float,
            out: float,
            value: string,
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
    a = get_object_or_404_json(models.Annotation, pk=ox.from32(data['id']))
    if a.editable(request.user):
        a.value = data['value']
        a.start = data['in']
        a.end = data['out']
        a.save()
        response['data'] = a.json()
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editAnnotation, cache=False)
