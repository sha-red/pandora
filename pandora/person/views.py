# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

import ox
from ox.utils import json

from ox.django.decorators import admin_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

from ox.django.api import actions
from item import utils

import models
import tasks
from user.decorators import capability_required_json
from changelog.models import add_changelog

@capability_required_json('canManageTitlesAndNames')
def editName(request, data):
    '''
    Edits the sort name for a given name
    takes {
        id: string, // name id
        sortname: string // sort name
    }
    returns {
        id: string, // name id
        name: string // name
        ... // more properties
    }
    see: findNames, sortName
    '''
    person = get_object_or_404_json(models.Person, pk=ox.fromAZ(data['id']))
    response = json_response()
    if 'sortname' in data:
        person.sortname = data['sortname']
        person.edited = True
    person.save()
    tasks.update_file_paths.delay(person.id)
    add_changelog(request, data)
    response['data'] = person.json()
    return render_to_json_response(response)
actions.register(editName, cache=False)

def sortName(request, data):
    '''
    Gets the sort name for one or more names
    takes {
        name: string, // either name
        names: [string] // or list of names
    }
    returns {
        name: sortName, // sort name for this name
        ... // more results
    }
    see editName, findNames
    '''
    names = data.get('names', [])
    if 'name' in data:
        names.append(data['name'])
    response = json_response()
    response['data'] = {}
    for name in names:
        response['data'][name] = models.get_name_sort(name)
    return render_to_json_response(response)
actions.register(sortName, cache=False)

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'name', 'operator':'+'}]
    for key in ('keys', 'group', 'list', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Person.objects.find(query, user)
    #if 'itemsQuery' in data:
    #    item_query = models.Item.objects.find({'query': data['itemsQuery']}, user)
    #    query['qs'] = query['qs'].filter(items__in=item_query)
    return query

def order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'sortname': 'sortsortname'
        }.get(e['key'], e['key'])
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    return qs

def findNames(request, data):
    '''
    Finds names for a given query
    takes {
        query: object, // query object, see `find`
        itemsQuery: object, // limit to matched items, query object, see `find`
        sort: [object], // list of sort objects, see `find`
        range: [int, int], // range of results to return
        keys: [string] // list of properties to return
    }
    returns {
        items: [object] // list of name objects
    }
    notes: Possible query keys are 'name' and 'numberofnames', possible keys
    are 'name', 'numberofnames' and 'sortname'.
    see: editName, find, sortName
    '''
    response = json_response()

    query = parse_query(data, request.user)
    qs = order_query(query['qs'], query['sort'])
    qs = qs.distinct()
    if 'keys' in data:
        qs = qs.select_related()
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
    return render_to_json_response(response)
actions.register(findNames)
