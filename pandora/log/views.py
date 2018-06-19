# -*- coding: utf-8 -*-
from __future__ import division, print_function, absolute_import

import ox
from ox.utils import json

from oxdjango.decorators import admin_required_json
from oxdjango.shortcuts import render_to_json_response, json_response

from oxdjango.api import actions

from item import utils

from . import models


def logError(request, data):
    '''
    Logs an error
    takes {
        url: string, // URL
        line: string, // line number
        text: string // error text
    }
    returns {}
    see: findErrorLogs, removeErrorLogs
    '''
    if request.user.is_authenticated():
        user = request.user
    else:
        user = None
    url = data.get('url', '').split('/static/')[-1]
    if 'text' in data:
        if len(url) > 1000:
            url = url[:997] + '...'
        text = data.get('url', '') + '\n\n' + \
            data['text'] + '\n\n' + request.META.get('HTTP_USER_AGENT', '')[:4096]
        log = models.Log(
            text=text,
            line=int(data.get('line', 0)),
            url=url
        )
        if user:
            log.user = user
        log.save()
    response = json_response()
    return render_to_json_response(response)
actions.register(logError, cache=False)


@admin_required_json
def removeErrorLogs(request, data):
    '''
    Removes entries from the error log
    takes {
        ids: [string] // list of error ids
    }
    returns {}
    see: findErrorLogs, logError
    '''
    models.Log.objects.filter(id__in=[ox.fromAZ(i) for i in data['ids']]).delete()
    response = json_response()
    return render_to_json_response(response)
actions.register(removeErrorLogs, cache=False)

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'name', 'operator':'+'}]
    for key in ('keys', 'group', 'list', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Log.objects.find(query, user)
    return query

def order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
        }.get(e['key'], e['key'])
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    return qs

@admin_required_json
def findErrorLogs(request, data):
    '''
    Finds error logs for a given query
    takes {
        query: object, // query object, see `find`
        sort: [object], // list of sort objects, see `find`
        range: [int, int], // range of results to return
        keys: [string] // list of properties to return
    }
    returns {
        items: [object]
    }
    see: find, logError, removeErrorLogs
    '''
    response = json_response()

    query = parse_query(data, request.user)
    qs = order_query(query['qs'], query['sort'])
    qs = qs.distinct()
    if 'keys' in data:
        qs = qs.select_related()
        qs = qs[query['range'][0]:query['range'][1]]
        response['data']['items'] = [p.json(data['keys']) for p in qs]
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
actions.register(findErrorLogs)
