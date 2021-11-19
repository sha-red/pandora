# -*- coding: utf-8 -*-

import os
import re
from glob import glob
import unicodedata

import ox
from ox.utils import json
from oxdjango.api import actions
from oxdjango.decorators import login_required_json
from oxdjango.http import HttpFileResponse
from oxdjango.shortcuts import render_to_json_response, get_object_or_404_json, json_response, HttpErrorJson
from django import forms
from django.db.models import Count, Sum
from django.conf import settings

from item import utils
from item.models import Item
from itemlist.models import List
from entity.models import Entity
from archive.chunk import process_chunk
from changelog.models import add_changelog

from . import models
from . import tasks

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key': 'page', 'operator': '+'}, {'key': 'title', 'operator': '+'}]
    for key in ('keys', 'group', 'file', 'range', 'position', 'positions', 'sort'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Page.objects.find(data, user)
    return query

def _order_query(qs, sort):
    prefix = 'document__sort__'
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'index': 'document__items__itemproperties__index',
            'position': 'id',
            'name': 'title',
        }.get(e['key'], e['key'])
        if key == 'resolution':
            order_by.append('%swidth' % operator)
            order_by.append('%sheight' % operator)
        else:
            if '__' not in key and key not in ('created', 'modified', 'page'):
                key = "%s%s" % (prefix, key)
            order = '%s%s' % (operator, key)
            order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    qs = qs.distinct()
    return qs


def findPages(request, data):
    '''
    Finds documents pages for a given query
    takes {
        query: object, // query object, see `find`
        sort: [object], // list of sort objects, see `find`
        range: [int, int], // range of results, per current sort order
        keys: [string] // list of keys to return
    }
    returns {
        items: [{ // list of pages
            id: string
            page: int
        }]
    }
    '''
    query = parse_query(data, request.user)
    #order
    qs = _order_query(query['qs'], query['sort'])

    response = json_response()
    if 'group' in query:
        response['data']['items'] = []
        items = 'items'
        document_qs = query['qs']
        order_by = _order_by_group(query)
        qs = models.Facet.objects.filter(key=query['group']).filter(document__id__in=document_qs)
        qs = qs.values('value').annotate(items=Count('id')).order_by(*order_by)

        if 'positions' in query:
            response['data']['positions'] = {}
            ids = [j['value'] for j in qs]
            response['data']['positions'] = utils.get_positions(ids, query['positions'])
        elif 'range' in data:
            qs = qs[query['range'][0]:query['range'][1]]
            response['data']['items'] = [{'name': i['value'], 'items': i[items]} for i in qs]
        else:
            response['data']['items'] = qs.count()
    elif 'keys' in data:
        qs = qs[query['range'][0]:query['range'][1]]

        response['data']['items'] = [l.json(data['keys'], request.user) for l in qs]
    elif 'position' in data:
        #FIXME: actually implement position requests
        response['data']['position'] = 0
    elif 'positions' in data:
        ids = list(qs.values_list('id', flat=True))
        response['data']['positions'] = utils.get_positions(ids, query['positions'], decode_id=True)
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findPages)

