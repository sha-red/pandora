# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from django.db.models import Max, Min, Count
from django.conf import settings

import ox
from ox.utils import json

from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

from ox.django.api import actions
from item import utils
from changelog.models import add_changelog

import models

@login_required_json
def addPlace(request, data):
    '''
    Adds a new place to the map
    takes {
        name: string, // place name
        alternativeNames: [string], // list of alternative names
        geoname: string, // full geoname (like '23 Main St, Foo, Switzerland')
        countryCode: string, // two-letter country code (like 'ch')
        south: float, // southern edge of the bounding box in degrees
        west: float, // western edge of the bounding box in degrees
        north: float, // northern edge of the bounding box in degrees
        east: float, // eastern edge of the bounding box in degrees
        type: string // place type
    }
    returns {
        id: string
    }
    notes: Possible types are 'country', 'region', 'city', 'borough', 'street',
    'building' and 'feature'.
    see: editPlace, findPlaces, removePlace
    '''
    #FIXME: check permissions
    exists = False
    existing_names = []
    existing_geoname = ''
    name = data.pop('name')
    if name == '':
        _exists = True
        name = 'Untitled'
        n = 0
        while _exists:
            _exists = models.Place.objects.filter(defined=True,
                                name_find__icontains=u'|%s|'%name).count() > 0
            if _exists:
                name = 'Untitled [%s]' %n
            n += 1
    names = [name] + data.get('alternativeNames', [])
    data['alternativeNames'] = [ox.escape_html(n)
            for n in data.get('alternativeNames', [])]
    name = ox.escape_html(name)
    for n in names:
        n = ox.decode_html(name)
        if models.Place.objects.filter(defined=True,
                                       name_find__icontains=u'|%s|'%n).count() != 0:
            exists = True
            existing_names.append(n)
    '''
    if 'geoname' in data: 
        if models.Place.objects.filter(defined=True,
                                       geoname=data['geoname']).count() > 0:
            exists = True
            existing_geoname = data['geoname']
    '''
    if not exists:
        models.Place.objects.filter(defined=False, name__in=names).delete()
        place = models.Place()
        place.user = request.user
        place.name = name
        place.alternativeNames = tuple(data.pop('alternativeNames', []))
        for key in data:
            value = data[key]
            if isinstance(value, list):
                value = tuple(value)
            setattr(place, key, value)
        place.matches = 0
        place.save()
        place.update_matches()
        response = json_response(place.json())
        # add name/alternativeNames again for changelog
        data['name'] = place.name
        data['alternativeNames'] = place.alternativeNames
        add_changelog(request, data, place.get_id())
    else:
        response = json_response(status=409,
                                 text='%s exists'%(existing_names and 'Name' or 'Geoname'))
        response['data']['names'] = existing_names
        if existing_geoname:
            response['data']['geoname'] = existing_geoname
    return render_to_json_response(response)
actions.register(addPlace, cache=False)


@login_required_json
def editPlace(request, data):
    '''
    Edits a place
    takes {
        id: string, // place id
        name: string, // place name
        ... // more place properties
    }
    returns {
        names: [] // list of names, in case of collision with existing data
    }
    see: addPlace, findPlaces, removePlace
    '''
    place = get_object_or_404_json(models.Place, pk=ox.fromAZ(data['id']))
    names = data.get('name', [])
    if isinstance(names, basestring):
        names = [names]
    names = [ox.escape_html(n) for n in names]
    alternative_names = [ox.escape_html(n) for n in data.get('alternativeNames', [])]
    alternative_names = filter(lambda n: n.strip(), alternative_names)
    if place.editable(request.user):
        conflict = False
        conflict_names = []
        conflict_geoname = ''
        if alternative_names:
            data['alternativeNames'] = alternative_names
        for name in names + alternative_names:
            name = ox.decode_html(name)
            if models.Place.objects.filter(defined=True,
                    name_find__icontains=u'|%s|'%name).exclude(id=place.id).count() != 0:
                conflict = True
                conflict_names.append(name)
        '''
        if 'geoname' in data:
            if models.Place.objects.filter(defined=True,
                        geoname=data['geoname']).exclude(id=place.id).count() != 0:
                conflict = True
                conflict_geoname = data['geoname']
        '''
        if not conflict:
            models.Place.objects.filter(defined=False, name__in=names+alternative_names).delete()
            for key in data:
                if key != 'id':
                    value = data[key]
                    if isinstance(value, basestring):
                        value = ox.escape_html(value)
                    if isinstance(value, list):
                        value = tuple(value)
                    setattr(place, key, value)
            place.save()
            if 'name' in data or 'alternativeNames' in data:
                place.update_matches()
            response = json_response(place.json())
            add_changelog(request, data)
        else:
            response = json_response(status=409,
                                     text='%s exists'%(conflict_names and 'Name' or 'Geoname'))
            response['data']['names'] = conflict_names 
            if conflict_geoname:
                response['data']['geoname'] = conflict_geoname
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editPlace, cache=False)


@login_required_json
def removePlace(request, data):
    '''
    Removes a place from the map
    takes {
        id: string // place id
    }
    returns {}
    see: addPlace, editPlace, findPlaces
    '''
    if isinstance(data, dict):
        data = data['id']
    place = get_object_or_404_json(models.Place, pk=ox.fromAZ(data))
    if place.editable(request.user):
        add_changelog(request, data)
        place.delete()
        response = json_response(status=200, text='deleted')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(removePlace, cache=False)

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'name', 'operator':'+'}]
    for key in ('keys', 'group', 'list', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Place.objects.find(query, user)
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
            'geoname': 'geoname_sort',
        }.get(e['key'], e['key'])
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    return qs

def findPlaces(request, data):
    '''
    Finds places for a given query
    takes {
        query: object, // query object to find places, see `find`
        itemsQuery: object // query object to limit results to items, see `find`
        sort: [object], // list of sort objects, see `find`
        range: [int, int], // range of results to return
        keys: [string] // list of properties to return
    }
    returns {
        items: [object] // list of place objects
    }
    notes: Possible query keys are 'geoname', 'name' and 'user'. Possible
    itemsQuery keys are all item keys, as defined in the config.
    see: addPlace, editPlace, find, removePlace
    '''
    response = json_response()

    query = parse_query(data, request.user)
    qs = order_query(query['qs'], query['sort'])
    qs = qs.distinct()
    if 'keys' in data:
        qs = qs.select_related('user__profile')
        qs = qs[query['range'][0]:query['range'][1]]
        response['data']['items'] = [p.json(data['keys'], request.user) for p in qs]
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
        ids = [i.get_id() for i in qs]
        response['data']['positions'] = utils.get_positions(ids, data['positions'])
    else:
        response['data']['items'] = qs.count()
        response['data']['area'] = qs.aggregate(
            south=Min('south'),
            west=Min('west'),
            north=Max('north'),
            east=Max('east'),
        )
    return render_to_json_response(response)
actions.register(findPlaces)

def getPlaceNames(request, data):
    '''
    Gets place names and matches
    takes {}
    returns {
        items: [
            {
                name: string, // place name
                matches: int // number of matches in annotations
            },
            ... // more places
        ]
    }
    see: getEventNames
    '''
    response = json_response({})
    layers = [l['id'] for l in filter(lambda l: l['type'] == 'place',
                                      settings.CONFIG['layers'])]
    items = models.Annotation.objects.filter(layer__in=layers,
                                             places__id=None).order_by('value')
    items = items.values('value').annotate(Count('value'))
    response['data']['items'] = [{
        'name': i['value'],
        'matches': i['value__count']
    } for i in items]
    return render_to_json_response(response)
actions.register(getPlaceNames)
