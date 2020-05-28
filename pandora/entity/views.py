# -*- coding: utf-8 -*-

from six import string_types
import ox
from ox.utils import json
from oxdjango.api import actions
from oxdjango.decorators import login_required_json
from oxdjango.http import HttpFileResponse
from oxdjango.shortcuts import render_to_json_response, get_object_or_404_json, json_response, HttpErrorJson

from django import forms
from django.conf import settings
from django.db.models import Sum

from item import utils
from item.models import Item
from itemlist.models import List
from changelog.models import add_changelog

from . import models
from .managers import namePredicate

def get_entity_or_404_json(id):
    try:
        return models.Entity.get(id)
    except models.Entity.DoesNotExist:
        response = {'status': {'code': 404,
                               'text': 'Entity not found'}}
        raise HttpErrorJson(response)

def get_type_or_400_json(type_):
    try:
        return models.Entity.get_entity(type_)
    except models.Entity.ValueError as e:
        raise HttpErrorJson(json_response(
            status=400,
            text=e.message))

@login_required_json
def addEntity(request, data):
    '''
    Adds an entity
    takes {
        type: string, // entity type, as defined in config
        name: string, // name
        alternativeNames: [string], // list of alternative names
        ... // more entity properties, as defined in config
    }
    returns {}
    see: editEntity, findEntities, getEntity, removeEntity
    '''
    existing_names = []
    exists = False

    get_type_or_400_json(data.get('type'))

    if 'name' in data:
        names = [data['name']] + data.get('alternativeNames', [])
        for name in names:
            name = ox.decode_html(name)
            if models.Entity.objects.filter(type=data['type'],
                    name_find__icontains='|%s|'%name).count() != 0:
                exists = True
                existing_names.append(name)
        if not exists:
            data['name'] = ox.escape_html(data['name'])
            entity = models.Entity(name=data['name'], type=data['type'])
            entity.user = request.user
            for key in ('type', 'alternativeNames'):
                if key in data and data[key]:
                    value = data[key]
                    if isinstance(value, string_types):
                        value = ox.escape_html(value)
                    if key == 'alternativeNames':
                        value = tuple([ox.escape_html(v) for v in value])
                    setattr(entity, key, value)
            entity.matches = 0
            entity.save()
            response = json_response(status=200, text='created')
            add_changelog(request, data, entity.get_id())
            response['data'] = entity.json()
        else:
            response = json_response(status=409, text='name exists')
            response['data']['names'] = existing_names
    else:
        type = data['type']
        name = 'Unnamed'
        num = 1
        while models.Entity.objects.filter(name_find__icontains='|%s|'%name).count() > 0:
            num += 1
            name = 'Unnamed [%d]' % num
        entity = models.Entity(name=name, type=type)
        entity.user = request.user
        entity.matches = 0
        entity.save()
        data['name'] = name
        add_changelog(request, data, entity.get_id())
        response = json_response(status=200, text='created')
        response['data'] = entity.json()
    return render_to_json_response(response)
actions.register(addEntity, cache=False)

def autocompleteEntities(request, data):
    '''
    Returns entities for a given entity type and search string
    takes {
        key: string, // entity type
        value: string, // search string
        operator: string // '=', '==', '^', '$'
        range: [int, int] // range of results to return
    }
    returns {
        items: [name, ...] // list of matching entities' names
    }
    see: autocomplete
    '''
    if not 'range' in data:
        data['range'] = [0, 10]
    op = data.get('operator', '=')

    entity = get_type_or_400_json(data['key'])
    order_by = entity.get('autocompleteSort', False)
    if order_by:
        for o in order_by:
            if o['operator'] != '-':
                o['operator'] = ''
        order_by = ['%(operator)s%(key)s' % o for o in order_by]
    else:
        order_by = ['name_sort']

    qs = models.Entity.objects.filter(type=data['key'])
    if data['value']:
        k, v = namePredicate(op, data['value'])
        qs = qs.filter(**{k: v})
    qs = qs.order_by(*order_by)
    if op != '$':
        value_lower = data['value'].lower()
        matches = []
        leading_matches = []
        leading_word_matches = []
        for v in [e.name for e in qs]:
            if v.lower().startswith(value_lower):
                leading_matches.append(v)
            elif [w for w in v.lower().split(' ') if w.strip().startswith(value_lower)]:
                leading_word_matches.append(v)
            else:
                matches.append(v)
        values = leading_matches + leading_word_matches + matches
    else:
        values = [e.name for e in qs]
    values = values[data['range'][0]:data['range'][1]]
    response = json_response({})
    response['data']['items'] = values
    return render_to_json_response(response)
actions.register(autocompleteEntities)

@login_required_json
def editEntity(request, data):
    '''
    Edits an entity
    takes {
        id: string, // entity id
        name: string, // entity name
        description: string, // entity description
        friends: [ // key with type "entity"
            {
                // either:
                id: string, // related entity ID

                // or:
                type: string, // related entity type, and
                name: string // related entity name
            }
            ... // more entities
        ]
        ... // more properties, as defined in config
    }
    returns {
        id: string // entity id
        ... // more entity properties
    }
    see: addEntity, findEntities, getEntity, removeEntity
    '''
    response = json_response()
    entity = get_entity_or_404_json(data['id'])
    if entity.editable(request.user):
        try:
            entity.edit(data)
            entity.save()
        except models.Entity.ValueError as e:
            raise HttpErrorJson(json_response(status=400, text=e.message))
        response['data'] = entity.json(user=request.user)
        add_changelog(request, data)
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
    query['sort'] = [{'key':'name', 'operator':'+'}]
    for key in ('keys', 'group', 'range', 'position', 'positions', 'sort'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Entity.objects.find(data, user).exclude(name='')
    return query


def findEntities(request, data):
    '''
    Finds entities for a given query
    takes {
        query: object, // query object, see `find`
        sort: [object], // list of sort objects, see `find`
        range: [int, int], // range of results
        keys: [string] // list of properties to return
    }
    returns {
        items: [object]
    }
    notes: Possible query keys are 'name' and 'type', possible keys are
    'alternativeNames', 'name' and 'type'.
    see: addEntity, editEntity, find, getEntity, removeEntity
    '''
    query = parse_query(data, request.user)

    #order
    qs = _order_query(query['qs'], query['sort'])
    response = json_response()
    if 'keys' in data:
        qs = qs[query['range'][0]:query['range'][1]]
        qs = qs.prefetch_related('links', 'links__target')
        qs = qs.prefetch_related('backlinks', 'backlinks__source')

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
actions.register(findEntities)

def getEntity(request, data):
    '''
    Gets an entity by id
    takes {
        id: string, // entity id
        keys: [string] // list of properties to return
    }
    returns {
        key: value, // property id and value
        ... // more key/value pairs
    }
    see: addEntity, editEntity, findEntities, removeEntity
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
    Removes one or more entities
    takes {
        id: string, // either entity id
        ids: [string] // or list of entity ids
    }
    returns {}
    see: addEntity, editEntity, findEntities, getEntity
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
    add_changelog(request, data, ids)
    return render_to_json_response(response)
actions.register(removeEntity, cache=False)

