# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

import ox
from ox.utils import json

from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

from api.actions import actions
from item import utils

import models


@login_required_json
def addPlace(request):
    #FIXME: require admin
    '''
        param data {
            name: "",
            geoname: "",
            south: float,
            west: float,
            north: float,
            east: float,
            lat: float,
            lng: float,
            size: float,
        }
    '''
    data = json.loads(request.POST['data'])
    exists = False
    names = data.pop('name')
    if isinstance(names, basestring):
        names = [names]
    for name in names:
        if models.Place.objects.filter(name_find__icontains=u'|%s|'%name).count() != 0:
            exists = True
    if not exists:
        place = models.Place()
        place.user = request.user
        place.name = tuple(names)
        for key in data:
            setattr(place, key, data[key])
        place.save()
        response = json_response(status=200, text='created')
    else:
        response = json_response(status=403, text='place name exists')
    return render_to_json_response(response)
actions.register(addPlace, cache=False)


@login_required_json
def editPlace(request):
    '''
        param data {
            'id': placeid,
            'name': ...
            'north': 0...
        }
        can contain any of the allowed keys for place 
    '''
    data = json.loads(request.POST['data'])
    place = get_object_or_404_json(models.Place, pk=ox.from32(data['id']))
    names = data.get('name', [])
    if isinstance(names, basestring):
        names = [names]
    if place.editable(request.user):
        conflict = False
        for name in names:
            if models.Place.objects.filter(name_find__icontains=u'|%s|'%name).exclude(id=place.id).count() != 0:
                conflict = True
        if not conflict:
            for key in data:
                if key != 'id':
                    setattr(place, key, data[key])
            place.save()
            response = json_response(status=200, text='updated')
        else:
            response = json_response(status=403, text='place name/alias conflict')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editPlace, cache=False)


@login_required_json
def removePlace(request):
    '''
        param data {
            'id': placeid,
        }
    '''
    data = json.loads(request.POST['data'])
    if isinstance(data, dict):
        data = data['id']
    place = get_object_or_404_json(models.Place, pk=ox.from32(data))
    if place.editable(request.user):
        place.delete()
        response = json_response(status=200, text='deleted')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(removePlace, cache=False)

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'user', 'operator':'+'}, {'key':'name', 'operator':'+'}]
    for key in ('keys', 'group', 'list', 'range', 'ids', 'sort'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Place.objects.all()
    return query

def findPlaces(request):
    '''
        param data {
            query: {
                conditions: [
                    {
                        key: 'user',
                        value: 'something',
                        operator: '='
                    }
                ]
                operator: ","
            },
            sort: [{key: 'name', operator: '+'}],
            range: [0, 100]
            keys: []
        }

        possible query keys:
            name, geoname, user

        possible keys:
            name, geoname, user
        
        return {
                status: {
                    code: int,
                    text: string
                },
                data: {
                    items: [
                        {name:, user:, featured:, public...}
                    ]
                }
        }
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
            area: [south, west, north, east] only return places in that square

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
    response = json_response()

    query = parse_query(data, request.user)
    qs = query['qs']
    if 'keys' in data:
        qs = qs[query['range'][0]:query['range'][1]]
        response['data']['items'] = [p.json(request.user) for p in qs]
    elif 'ids' in data:
        ids = [i.get_id() for i in qs]
        response['data']['positions'] = utils.get_positions(ids, query['ids'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findPlaces)
