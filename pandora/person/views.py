# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from django.db.models import Max, Min

import ox
from ox.utils import json

from ox.django.decorators import login_required_json, admin_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

from api.actions import actions
from item import utils

import models

@admin_required_json
def editName(request):
    '''
        param data {
            'id': nameid,
            'sortname': ...
        }
        can contain any of the allowed keys for name 
    '''
    data = json.loads(request.POST['data'])
    person = get_object_or_404_json(models.Person, pk=ox.from26(data['id']))
    response = json_response()
    if 'sortname' in data:
        person.sortname = utils.sort_string(data['sortname'])
        person.edited = True
    person.save()
    response['data'] = person.json()
    return render_to_json_response(response)
actions.register(editName, cache=False)

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'name', 'operator':'+'}]
    for key in ('keys', 'group', 'list', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Person.objects.find(query, user)
    #if 'itemQuery' in data:
    #    item_query = models.Item.objects.find({'query': data['itemQuery']}, user)
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

def findNames(request):
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
            itemQuery: {
                //see find request
            },
            sort: [{key: 'name', operator: '+'}],
            range: [0, 100]
            keys: []
        }

        possible query keys:
            name, numberofnames

        possible keys:
            name, sortname, numberofnames
        
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

    '''
    data = json.loads(request.POST['data'])
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
            response['data']['position'] = utils.get_positions(ids, [qs[0].itemId])[0]
    elif 'positions' in data:
        ids = [i.get_id() for i in qs]
        response['data']['positions'] = utils.get_positions(ids, data['positions'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findNames)
