# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

from api.actions import actions
from item import utils

import models


@login_required_json
def addEvent(request):
    '''
        param data
            {
                'name': '',
                'start': ''
                'end': ''
            }
            required keys: name, start, end
    '''
    data = json.loads(request.POST['data'])
    existing_names = []
    exists = False
    for name in [data['name']] + data.get('alternativeNames', []):
        if models.Event.objects.filter(name_find__icontains=u'|%s|'%name).count() != 0:
            exists = True
            existing_names.append(name)
    if not exists:
        event = models.Event(name = data['name'])
        for key in ('start', 'startTime', 'end', 'endTime', 'duration', 'durationTime',
                    'alternativeNames'):
            if key in data and data[key]:
                setattr(event, key, data[key])
        event.save()
        response = json_response(status=200, text='created')
    else:
        response = json_response(status=403, text='name exists')
        response['data']['names'] = existing_names
    return render_to_json_response(response)
actions.register(addEvent, cache=False)


@login_required_json
def editEvent(request):
    '''
        param data
            {
                'id': event id,
                'name': ''
                ...
            }
            update provides keys of event with id
    '''
    data = json.loads(request.POST['data'])
    event = get_object_or_404_json(models.Event, pk=data['id'])
    if event.editable(request.user):
        conflict = False
        conflict_names = []
        names = [data.get('name', event.name)] + data.get('alternativeNames', [])
        for name in names:
            if models.Event.objects.filter(name_find__icontains=u'|%s|'%name).exclude(id=event.id).count() != 0:
                conflict = True
                conflict_names.append(name)
        if not conflict:
            for key in ('start', 'startTime', 'end', 'endTime', 'duration', 'durationTime',
                        'alternativeNames'):
                if key in data:
                    setattr(event, key, data[key])
            event.save()
            response = json_response(status=200, text='updated')
        else:
            response = json_response(status=403, text='Event name conflict')
            response['data']['names'] = conflict_names
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editEvent, cache=False)


@login_required_json
def removeEvent(request):
    '''
        param data {
            id: event id
        }
        remove Event with given id

    '''
    data = json.loads(request.POST['data'])
    event = get_object_or_404_json(models.Event, pk=data['id'])
    if event.editable(request.user):
        event.delete()
        response = json_response(status=200, text='removed')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(removeEvent, cache=False)

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'name', 'operator':'+'}]
    for key in ('keys', 'group', 'list', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Event.objects.find(query, user)
    if 'itemQuery' in data:
        item_query = models.Item.objects.find({'query': data['itemQuery']}, user)
        query['qs'] = query['qs'].filter(items__in=item_query)
    return query

def order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'name': 'name_sort',
        }.get(e['key'], e['key'])
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    return qs

def findEvents(request):
    '''
        param data
            {'query': query, 'sort': array, 'range': array}

            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
            itemQuery: {
                //see find request
            },
            sort: array of key, operator dics
                [
                    {
                        key: "year",
                        operator: "-"
                    },
                    {
                        key: "director",
                        operator: ""
                    }
                ]
            range:       result range, array [from, to]

        itemQuery can be used to limit the resuts to matches in those items.
        
        with keys, items is list of dicts with requested properties:
          return {'status': {'code': int, 'text': string},
                'data': {items: array}}

Positions
        param data
            {'query': query, 'ids': []}

            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
            ids:  ids of events for which positions are required
    '''
    response = json_response(status=200, text='ok')

    data = json.loads(request.POST['data'])
    query = parse_query(data, request.user)
    qs = query['qs'].distinct()
    if 'keys' in data:
        qs = qs[query['range'][0]:query['range'][1]]
        qs = qs.select_related()
        response['data']['items'] = [p.json(request.user) for p in qs]
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
actions.register(findEvents)
