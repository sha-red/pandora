# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from ox.utils import json

from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

import models
from api.actions import actions


@login_required_json
def addPlace(request):
    #FIXME: require admin
    '''
        param data
            {
                'place': dict
            }
            place contains key/value pairs with place propterties
    '''
    data = json.loads(request.POST['data'])
    exists = False
    names = [data['place']['name']] + data['place']['aliases']
    for name in names:
        if models.Place.objects.filter(name_find__icontains=u'|%s|'%data['name']).count() != 0:
            exists = True
    if not exists:
        place = models.Place()
        for key in data['place']:
            setattr(place, key, data['place'][key])
        place.save()
        response = json_response(status=200, text='created')
    else:
        response = json_response(status=403, text='place name exists')
    return render_to_json_response(response)
actions.register(addPlace)


@login_required_json
def editPlace(request):
    '''
        param data
            {
                'id': placeid,
                'place': dict
            }
            place contains key/value pairs with place propterties
    '''
    data = json.loads(request.POST['data'])
    place = get_object_or_404_json(models.Place, pk=data['id'])
    if place.editable(request.user):
        conflict = False
        names = [data['place']['name']] + data['place']['aliases']
        for name in names:
            if models.Place.objects.filter(name_find__icontains=u'|%s|'%data['name']).exclude(id=place.id).count() != 0:
                conflict = True
        if not conflict:
            for key in data['place']:
                setattr(place, key, data['place'][key])
            place.save()
            response = json_response(status=200, text='updated')
        else:
            response = json_response(status=403, text='place name/alias conflict')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editPlace)


@login_required_json
def removePlace(request):
    response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)
actions.register(removePlace)


def findPlace(request):
    '''
        param data
            {'query': query, 'sort': array, 'range': array, 'area': array}

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
            area: [sw_lat, sw_lng, ne_lat, ne_lng] only return places in that square

        with keys, items is list of dicts with requested properties:
          return {'status': {'code': int, 'text': string},
                'data': {items: array}}

Positions
        param data
            {'query': query, 'ids': []}

            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
            ids:  ids of places for which positions are required
    '''
    data = json.loads(request.POST['data'])
    response = json_response(status=200, text='ok')
    response['data']['places'] = []
    #FIXME: add coordinates to limit search
    for p in models.Place.objects.find(data['query']):
        response['data']['places'].append(p.json())
    return render_to_json_response(response)
actions.register(findPlace)
