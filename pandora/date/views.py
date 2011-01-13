# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

import models
from api.actions import actions


@login_required_json
def addDate(request):
    data = json.loads(request.POST['data'])
    if models.Date.filter(name=data['name']).count() == 0:
        place = models.Date(name = data['name'])
        place.save()
        response = json_response(status=200, text='created')
    else:
        response = json_response(status=403, text='place name exists')
    return render_to_json_response(response)
actions.register(addDate, cache=False)


@login_required_json
def editDate(request):
    '''
        param data
            {
                'id': dateid,
                'date': dict
            }
            date contains key/value pairs with place propterties
    '''
    data = json.loads(request.POST['data'])
    Date = get_object_or_404_json(models.Date, pk=data['id'])
    if Date.editable(request.user):
        conflict = False
        names = [data['date']['name']] + data['date']['aliases']
        for name in names: #FIXME: also check aliases!
            if models.Date.filter(name=data['name']).exclude(id=Date.id).count() != 0:
                conflict = True
        if not conflict:
            for key in data['date']:
                setattr(Date, key, data['date'][key])
            Date.save()
            response = json_response(status=200, text='updated')
        else:
            response = json_response(status=403, text='Date name/alias conflict')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editDate, cache=False)


@login_required_json
def removeDate(request):
    response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)
actions.register(removeDate, cache=False)


def findDate(request):
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
            ids:  ids of dates for which positions are required
    '''
    data = json.loads(request.POST['data'])
    response = json_response(status=200, text='ok')
    response['data']['places'] = []
    #FIXME: add coordinates to limit search
    for p in models.Date.objects.find(data['query']):
        response['data']['dates'].append(p.json())
    return render_to_json_response(response)
actions.register(findDate)
