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
    data = json.loads(request.POST['data'])
    if models.Event.filter(name=data['name']).count() == 0:
        place = models.Event(name = data['name'])
        place.save()
        response = json_response(status=200, text='created')
    else:
        response = json_response(status=403, text='place name exists')
    return render_to_json_response(response)
actions.register(addEvent, cache=False)


@login_required_json
def editEvent(request):
    '''
        param data
            {
                'id': dateid,
                'date': dict
            }
            date contains key/value pairs with place propterties
    '''
    data = json.loads(request.POST['data'])
    Event = get_object_or_404_json(models.Event, pk=data['id'])
    if Event.editable(request.user):
        conflict = False
        names = [data['date']['name']] + data['date']['aliases']
        for name in names: #FIXME: also check aliases!
            if models.Event.filter(name=data['name']).exclude(id=Event.id).count() != 0:
                conflict = True
        if not conflict:
            for key in data['date']:
                setattr(Event, key, data['date'][key])
            Event.save()
            response = json_response(status=200, text='updated')
        else:
            response = json_response(status=403, text='Event name/alias conflict')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editEvent, cache=False)


@login_required_json
def removeEvent(request):
    response = json_response(status=501, text='not implemented')
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
