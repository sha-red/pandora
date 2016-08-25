# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, print_function, absolute_import

from django.db.models import Count
from django.conf import settings

from six import string_types
import ox
from ox.utils import json
from oxdjango.decorators import login_required_json
from oxdjango.shortcuts import render_to_json_response, get_object_or_404_json, json_response

from oxdjango.api import actions
from item import utils
from changelog.models import add_changelog

from . import models

@login_required_json
def addEvent(request, data):
    '''
    Adds a new event to the calendar
    takes {
        end: string, // 'YYYY-MM-DD HH:MM:SS', arbitrary precision
        name: string, // name
        start: string // 'YYYY-MM-DD HH:MM:SS', arbitrary precision
    }
    returns {
        id: string // event id
    }
    see: editEvent, findEvents, removeEvents
    '''
    existing_names = []
    exists = False
    names = [data['name']] + data.get('alternativeNames', [])
    for name in names:
        name = ox.decode_html(name)
        if models.Event.objects.filter(defined=True,
                name_find__icontains=u'|%s|'%name).count() != 0:
            exists = True
            existing_names.append(name)
    if not exists:
        models.Event.objects.filter(defined=False, name__in=names).delete()
        data['name'] = ox.escape_html(data['name'])
        event = models.Event(name=data['name'])
        for key in ('start', 'startTime', 'end', 'endTime', 'duration', 'durationTime',
                    'type', 'alternativeNames'):
            if key in data and data[key]:
                value = data[key]
                if isinstance(value, string_types):
                    value = ox.escape_html(value)
                if key == 'alternativeNames':
                    value = tuple([ox.escape_html(v) for v in value])
                setattr(event, key, value)
        if 'nameSort' in data:
            value = ox.escape_html(data['nameSort'])
            event.set_name_sort(value)
        event.matches = 0
        event.save()
        event.update_matches()
        response = json_response(status=200, text='created')
        response['data'] = event.json()
        add_changelog(request, data, event.get_id())
    else:
        response = json_response(status=409, text='name exists')
        response['data']['names'] = existing_names
    return render_to_json_response(response)
actions.register(addEvent, cache=False)


@login_required_json
def editEvent(request, data):
    '''
    Edits a calendar event
    takes {
        end: string, // 'YYYY-MM-DD HH:MM:SS', arbitrary precision
        id: string, // event id
        name: string, // event name
        start: string // 'YYYY-MM-DD HH:MM:SS', arbitrary precision
    }
    returns {
        id: string, // event id
        key: value, // property id and value
        ... // more key/value pairs
    }
    see: addEvent, findEvents, removeEvent
    '''
    event = get_object_or_404_json(models.Event, pk=ox.fromAZ(data['id']))
    if event.editable(request.user):
        conflict = False
        conflict_names = []
        names = [data.get('name', event.name)] + data.get('alternativeNames', [])
        for name in names:
            if models.Event.objects.filter(defined=True,
                    name_find__icontains=u'|%s|'%name).exclude(id=event.id).count() != 0:
                conflict = True
                conflict_names.append(name)
        if not conflict:
            models.Event.objects.filter(defined=False, name__in=names).delete()
            for key in ('name', 'start', 'startTime', 'end', 'endTime', 'duration', 'durationTime',
                        'type', 'alternativeNames'):
                if key in data:
                    value = data[key]
                    if isinstance(value, string_types):
                        value = ox.escape_html(value)
                    if key == 'alternativeNames':
                        value = tuple([ox.escape_html(v) for v in value])
                    setattr(event, key, value)
            if 'name' in data:
                event.set_name_sort(ox.escape_html(data['name']))
            if 'nameSort' in data:
                event.set_name_sort(ox.escape_html(data['nameSort']))
            event.save()
            if 'name' in data or 'alternativeNames' in data:
                event.update_matches()
            response = json_response(status=200, text='updated')
            response['data'] = event.json()
            add_changelog(request, data)
        else:
            response = json_response(status=409, text='Event name conflict')
            response['data']['names'] = conflict_names
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editEvent, cache=False)


@login_required_json
def removeEvent(request, data):
    '''
    Removes an event from the calendar
    takes {
        id: string // event id
    }
    returns {}
    see: addEvent, editEvent, findEvents
    '''
    event = get_object_or_404_json(models.Event, pk=ox.fromAZ(data['id']))
    if event.editable(request.user):
        add_changelog(request, data)
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
    if 'itemsQuery' in data:
        item_query = models.Item.objects.find({'query': data['itemsQuery']}, user)
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

def findEvents(request, data):
    '''
    Finds calendar events for a given query
    takes {
        query: object, // query object, see `find`
        sort: [object], // list of sort objects, see `find`
        range: [int, int] // range of results to return
    }
    returns {
        items: [object] // list of items
    }
    see: addEvent, editEvent, find, removeEvent
    '''
    response = json_response(status=200, text='ok')
    query = parse_query(data, request.user)
    qs = order_query(query['qs'], query['sort'])
    qs = qs.distinct()
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
            response['data']['position'] = utils.get_positions(ids, [qs[0].public_id])[0]
    elif 'positions' in data:
        ids = list(qs.values_list('id', flat=True))
        response['data']['positions'] = utils.get_positions(ids, data['positions'], decode_id=True)
    else:
        response['data']['items'] = qs.count()

    return render_to_json_response(response)
actions.register(findEvents)

def getEvents(request, data):
    '''
    Gets event names and matches
    takes {}
    returns {
        items: [
            {
                name: string, // event name
                matches: int // number of matches in annotations
            },
            ... // more events
        ]
    }
    see: getPlaces
    '''
    response = json_response({})
    layers = [l['id'] for l in filter(lambda l: l['type'] == 'event',
                                      settings.CONFIG['layers'])]
    items = models.Annotation.objects.filter(layer__in=layers,
                                             events__id=None).order_by('value')
    items = items.values('value').annotate(Count('value'))
    response['data']['items'] = [{
        'name': i['value'],
        'matches': i['value__count']
    } for i in items]
    return render_to_json_response(response)
actions.register(getEvents)
