# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

import ox
from ox.utils import json
from ox.django.api import actions
from ox.django.decorators import login_required_json
from ox.django.http import HttpFileResponse
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response, HttpErrorJson

from django import forms
from django.conf import settings
from django.db.models import Sum

from item import utils
from item.models import Item
from itemlist.models import List

import models

def get_entity_or_404_json(id):
    try:
        return models.Entity.get(id)
    except models.Entity.DoesNotExist:
        response = {'status': {'code': 404,
                               'text': 'Entity not found'}}
        raise HttpErrorJson(response)

@login_required_json
def addEntity(request, data):
    '''
        add entity
        takes {
            type:
            name:
            alternativeNames
        }
        returns {
        }
    '''
    existing_names = []
    exists = False
    if 'name' in data:
        names = [data['name']] + data.get('alternativeNames', [])
        for name in names:
            name = ox.decode_html(name)
            if models.Entity.objects.filter(type=data['type'],
                    name_find__icontains=u'|%s|'%name).count() != 0:
                exists = True
                existing_names.append(name)
        if not exists:
            data['name'] = ox.escape_html(data['name'])
            entity = models.Entity(name=data['name'], type=data['type'])
            entity.user = request.user
            for key in ('type', 'alternativeNames'):
                if key in data and data[key]:
                    value = data[key]
                    if isinstance(value, basestring):
                        value = ox.escape_html(value)
                    if key == 'alternativeNames':
                        value = tuple([ox.escape_html(v) for v in value])
                    setattr(entity, key, value)
            entity.matches = 0
            entity.save()
            response = json_response(status=200, text='created')
            response['data'] = entity.json()
        else:
            response = json_response(status=409, text='name exists')
            response['data']['names'] = existing_names
    else:
        type = data['type']
        name = 'Unnamed'
        num = 1
        while models.Entity.objects.filter(name=name, type=type).count()>0:
            num += 1
            name = 'Unnamed [%d]' % num
        entity = models.Entity(name=name, type=type)
        entity.user = request.user
        entity.matches = 0
        entity.save()
        response = json_response(status=200, text='created')
        response['data'] = entity.json()
    return render_to_json_response(response)
actions.register(addEntity, cache=False)

def autocompleteEntities(request, data):
    '''
    takes {
        type: string,
        name: string,
        operator: string // '=', '==', '^', '$'
        range: [int, int]
    }
    returns {
        items: [{id, name,...}, ...] // array of matching entities
    }
    '''
    if not 'range' in data:
        data['range'] = [0, 10]
    op = data.get('operator', '=')

    entity = utils.get_by_id(settings.CONFIG['entities'], data['type'])
    order_by = entity.get('autocompleteSort', False)
    if order_by:
        for o in order_by:
            if o['operator'] != '-':
                o['operator'] = '' 
        order_by = ','.join(['%(operator)s%(key)s' % o for o in order_by])
    else:
        order_by = '-matches'

    qs = models.Entity.objects.filter(type=data['type'])
    if data['name']:
        if op == '=':
            qs = qs.filter(name_find__icontains=data['name'])
        elif op == '==':
            qs = qs.filter(name_find__icontains=u'|%s|'%data['name'])
        elif op == '^':
            qs = qs.filter(name_find__icontains=u'|%s'%data['name'])
        elif op == '$':
            qs = qs.filter(name_find__icontains=u'%s|'%data['name'])
    qs = qs.order_by(order_by)
    qs = qs[data['range'][0]:data['range'][1]]
    response = json_response({})
    response['data']['items'] = [e.json() for e in qs]
    return render_to_json_response(response)
actions.register(autocompleteEntities)

@login_required_json
def editEntity(request, data):
    '''
        takes {
            id: string
            name: string
            description: string
            item(optional): edit descriptoin per item
        }
        returns {
            id:
            ...
        }
    '''
    response = json_response()
    entity = get_entity_or_404_json(data['id'])
    if entity.editable(request.user):
        entity.edit(data)
        entity.save()
        response['data'] = entity.json(user=request.user)
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editEntity, cache=False)


def _order_query(qs, sort, item=None):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'name': 'name_sort',
        }.get(e['key'], e['key'])
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    qs = qs.distinct()
    return qs

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'name', 'operator':'+'}, {'key':'type', 'operator':'+'}]
    for key in ('keys', 'group', 'range', 'position', 'positions', 'sort'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Entity.objects.find(data, user).exclude(name='')
    return query


def findEntities(request, data):
    '''
        takes {
            query: {
                conditions: [
                    {
                        key: 'name',
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
            name, type

        possible keys:
            name, type, alternativeNames

        }
        returns {
            items: [object]
        }
    '''
    query = parse_query(data, request.user)

    #order
    qs = _order_query(query['qs'], query['sort'])
    response = json_response()
    if 'keys' in data:
        qs = qs[query['range'][0]:query['range'][1]]

        response['data']['items'] = [l.json(data['keys'], request.user) for l in qs]
    elif 'position' in data:
        #FIXME: actually implement position requests
        response['data']['position'] = 0
    elif 'positions' in data:
        ids = [i.get_id() for i in qs]
        response['data']['positions'] = utils.get_positions(ids, query['positions'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findEntities)

def getEntity(request, data):
    '''
        takes {
            id: string,
            keys: [string]
        }
        returns {
            key: value
        }
    '''
    response = json_response({})
    data['keys'] = data.get('keys', [])
    entity = get_entity_or_404_json(data['id'])
    response['data'] = entity.json(keys=data['keys'], user=request.user)
    return render_to_json_response(response)
actions.register(getEntity)

@login_required_json
def removeEntity(request, data):
    '''
        takes {
            id: string,
            or
            ids: [string]
        }
        returns {
        }
    '''
    response = json_response()

    if 'ids' in data:
        ids = data['ids']
    else:
        ids = [data['id']]
    for id in ids:
        entity = get_entity_or_404_json(id)
        if entity.editable(request.user):
            entity.delete()
        else:
            response = json_response(status=403, text='not allowed')
            break
    return render_to_json_response(response)
actions.register(removeEntity, cache=False)

