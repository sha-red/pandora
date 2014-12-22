# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import unicodedata

import ox
from ox.utils import json

from ox.django.decorators import admin_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

from ox.django.api import actions
from item import utils
from user.decorators import capability_required_json
from changelog.models import add_changelog

import models


@capability_required_json('canManageTitlesAndNames')
def editTitle(request, data):
    '''
    Edits the sort title for a given title
    takes {
        id: string, // name id
        sorttitle: string // sort title
    }
    returns {
        id: string, // title id
        ... // more properties
    }
    see: findTitles
    '''
    title = get_object_or_404_json(models.Title, pk=ox.fromAZ(data['id']))
    response = json_response()
    if 'sorttitle' in data:
        title.sorttitle = data['sorttitle']
        title.sorttitle = unicodedata.normalize('NFKD', title.sorttitle)
        title.edited = True
    title.save()
    add_changelog(request, data, title.get_id())
    response['data'] = title.json()
    return render_to_json_response(response)
actions.register(editTitle, cache=False)

def getSortTitle(request, data):
    '''
    Gets the sort title for one or more titles
    takes {
        title: string, // either title
        titles: [string] // or list of titles
    }
    returns {
        title: sortTitle, // sort title for this title
        ... // more results
    }
    see: editTitle, findTitles
    '''
    titles = data.get('titles', [])
    if 'title' in data:
        titles.append(data['title'])
    response = json_response()
    response['data'] = {}
    for title in titles:
        response['data'][title] = models.get_title_sort(title)
    return render_to_json_response(response)
actions.register(getSortTitle, cache=False)

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'title', 'operator':'+'}]
    for key in ('keys', 'group', 'list', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Title.objects.find(query, user)
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
            'sorttitle': 'sortsorttitle'
        }.get(e['key'], e['key'])
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    return qs

def findTitles(request, data):
    '''
    Finds titles for a given query
    takes {
        query: object, // query object, see `find`
        itemsQuery: object, // limit to matched items, query object, see `find`
        sort: [object], // list of sort objects, see `find`
        range: [int, int], // range of results to return
        keys: [string] // list of properties to return
    }
    returns {
        items: [object] // list of title objects
    }
    notes: Possible query keys are 'numberoftitles' and 'title', possible keys
    are 'numberoftitles', 'sorttitle' and 'title'.
    see: editTitle, find
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
actions.register(findTitles)
