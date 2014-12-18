# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from django.conf import settings

from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response, HttpErrorJson


from ox.django.api import actions

from item import utils
from item.models import Item
from item.utils import get_by_id
from entity.models import Entity
from changelog.models import add_changelog

import models
from tasks import update_item, add_annotations

def get_annotation_or_404_json(id):
    try:
        return models.Annotation.get(id)
    except models.Annotation.DoesNotExist:
        response = {'status': {'code': 404,
                               'text': 'Annotation not found'}}
        raise HttpErrorJson(response)

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'in', 'operator':'+'}]
    for key in ('keys', 'group', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Annotation.objects.find(query, user)
    if 'itemsQuery' in data:
        item_query = Item.objects.find({'query': data['itemsQuery']}, user)
        query['qs'] = query['qs'].filter(item__in=item_query)
    return query

def annotation_sort_key(key):
    return {
        'text': 'value',
        'position': 'start',
    }.get(key, key)

def order_query(qs, sort):
    order_by = []
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
            key = annotation_sort_key(e['key'][len('clip:'):])
        elif key not in ('start', 'end', 'value') and not key.startswith('clip__'):
            #key mgith need to be changed, see order_sort in item/views.py
            key = "item__sort__%s" % key
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True).exclude(value='')
    return qs

def findAnnotations(request, data):
    '''
    Finds annotations for a given query
    takes {
        query: object, // annotation query object, see `find`
        itemsQuery: object, // item query object, see `find`
        keys: [string, string, ...], // list of keys to return, see `find`
        position: int,
        positions: [string, string], // list of item ids, see `find`
        range: [int, int], // items to return, per current sort order, see `find`
        sort: [] // list of sort object, see `find`
    }
    returns {
        annotations: [{
            id: string, // annotation id
            ... // more annotation properties
        }]
    }
    see: addAnnotation, addAnnotations, editAnnotation, getAnnotation,
    removeAnnotation
    '''
    response = json_response()

    query = parse_query(data, request.user)
    qs = order_query(query['qs'], query['sort'])
    if 'keys' in data:
        qs = qs.select_related()[query['range'][0]:query['range'][1]]
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
            response['data']['position'] = utils.get_positions(ids, [qs[0].public_id])[0]
    elif 'positions' in data:
        ids = [i.public_id for i in qs]
        response['data']['positions'] = utils.get_positions(ids, data['positions'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findAnnotations)

def getAnnotation(request, data):
    '''
    Gets data for an annotation
    takes {
        id: string, // annotation id
        keys: [string] // list of keys to return
    }
    returns {
        key: value, // property id and value
        ... // more key/value pairs
    }
    '''
    response = json_response({})
    data['keys'] = data.get('keys', [])
    annotation = get_annotation_or_404_json(data['id'])
    response['data'] = annotation.json(keys=data['keys'], user=request.user)
    return render_to_json_response(response)
actions.register(getAnnotation)

@login_required_json
def addAnnotation(request, data):
    '''
    Adds a single annotation
    takes {
        item: string, // item id
        layer: string, // annotation layer id
        in: float, // in point in seconds
        out: float, // out point in seconds
        value: string // annotation value
    }
    returns {
        id: string, // annotation id
        ... // more annotation properties
    }
    see: addAnnotations, editAnnotation, findAnnotations, getAnnotation,
    getTaskStatus, removeAnnotation
    '''
    for key in ('item', 'layer', 'in', 'out', 'value'):
        if key not in data:
            return render_to_json_response(json_response(status=400,
                                                         text='invalid data'))

    item = get_object_or_404_json(Item, public_id=data['item'])
    
    layer_id = data['layer']
    layer = get_by_id(settings.CONFIG['layers'], layer_id)
    if layer['canAddAnnotations'].get(request.user.get_profile().get_level()):
        if layer['type'] == 'entity':
            try:
                value = Entity.get_by_name(data['value']).get_id()
            except Entity.DoesNotExist:
                response = json_response({})
                response['status']['text'] = 'unkown entity'
                return render_to_json_response(response)
        else:
            value = data['value']
        annotation = models.Annotation(
            item=item,
            layer=layer_id,
            user=request.user,
            start=float(data['in']), end=float(data['out']),
            value=value)
        annotation.save()
        update_item.delay(annotation.id)
        add_changelog(request, data, annotation.public_id)
        response = json_response(annotation.json())
        response['data']['editable'] = True
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(addAnnotation, cache=False)

@login_required_json
def addAnnotations(request, data):
    '''
    Adds multiple annotations
    takes {
        item: string, // item id
        layer: string, // annotation layer id
        annotations: [
            {
                in: float, // in point in seconds
                out: float, // out point in seconds
                value: string // annotation value
            },
            ... // more annotations
        ]
    }
    returns {
        taskId: string // task id, use `getTaskStatus` to poll
    }
    see: addAnnotation, editAnnotation, findAnnotations, getAnnotation,
    getTaskStatus, removeAnnotation
    '''
    for key in ('item', 'layer', 'annotations'):
        if key not in data:
            return render_to_json_response(json_response(status=400,
                                                         text='invalid data'))

    item = get_object_or_404_json(Item, public_id=data['item'])
    
    layer_id = data['layer']
    layer = get_by_id(settings.CONFIG['layers'], layer_id)
    if item.editable(request.user) \
        and layer['canAddAnnotations'].get(request.user.get_profile().get_level()):
        response = json_response()
        data['user'] = request.user.username
        t = add_annotations.delay(data)
        add_changelog(request, data, item.public_id)
        response['data']['taskId'] = t.task_id
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(addAnnotations, cache=False)

@login_required_json
def removeAnnotation(request, data):
    '''
    Removes an annotation
    takes {
        id: string // annotation id
    }
    returns {}
    see: addAnnotation, addAnnotations, editAnnotation, findAnnotations,
    getAnnotation
    '''
    response = json_response({})
    a = get_object_or_404_json(models.Annotation, public_id=data['id'])
    if a.editable(request.user):
        add_changelog(request, data, a.public_id)
        a.delete()
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(removeAnnotation, cache=False)


@login_required_json
def editAnnotation(request, data):
    '''
    Edits an annotation
    takes {
        id: string, // annotation id
        in: float, // in point in seconds, optional
        out: float, // out point in seconds, optional
        value: string // annotation value, optional
    }
    returns {
        id: string, // annotation id
        ... // more annotation properties
    }
    see: addAnnotation, addAnnotations, findAnnotations, getAnnotation,
    removeAnnotation
    '''
    response = json_response({})
    a = get_object_or_404_json(models.Annotation, public_id=data['id'])
    if a.editable(request.user):
        layer = get_by_id(settings.CONFIG['layers'], a.layer)
        for key in ('value', 'in', 'out'):
            if key == 'value' and layer['type'] == 'entity':
                try:
                    value = Entity.get_by_name(data['value']).get_id()
                except Entity.DoesNotExist:
                    response['data'] = a.json()
                    response['data']['editable'] = True
                    response['status']['text'] = 'unkown entity'
                    return render_to_json_response(response)
            else:
                value = data[key]
            if key in data:
                setattr(a, {
                    'in': 'start',
                    'out': 'end'
                }.get(key,key), value)
        add_changelog(request, data)
        a.save()
        #update sort/find tables async
        update_item.delay(a.id)
        response['data'] = a.json()
        response['data']['editable'] = True
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editAnnotation, cache=False)

