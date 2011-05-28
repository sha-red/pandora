# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

import models
from api.actions import actions


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
    #FIXME: check for alternativeNames too!
    if models.Event.filter(name=data['name']).count() == 0:
        event = models.Event(name = data['name'])
        for key in ('start', 'end', 'alternativeNames'):
            if key in data and data[key]:
                setattr(event, key, data[key])
        event.save()
        response = json_response(status=200, text='created')
    else:
        response = json_response(status=403, text='event name exists')
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
        names = [data.get('name', event.name)] + data.get('alternativeNames', [])
        for name in names: #FIXME: also check aliases!
            if models.Event.filter(name=data['name']).exclude(id=event.id).count() != 0:
                conflict = True
        if not conflict:
            for key in ('start', 'end', 'alternativeNames'):
                if key in data:
                    setattr(event, key, data[key])
            event.save()
            response = json_response(status=200, text='updated')
        else:
            response = json_response(status=403, text='Event name conflict')
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


def findEvent(request):
    '''
        param data
            {'query': query, 'sort': array, 'range': array}

            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
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
    data = json.loads(request.POST['data'])
    response = json_response(status=200, text='ok')
    response['data']['events'] = []
    #FIXME: add coordinates to limit search
    for p in models.Event.objects.find(data['query']):
        response['data']['events'].append(p.json())
    return render_to_json_response(response)
actions.register(findEvent)
