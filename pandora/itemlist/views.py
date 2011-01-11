# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

import models
from api.actions import actions


def _order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = e['key']
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by)
    return qs

def _parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'user', 'operator':'+'}, {'key':'name', 'operator':'+'}]
    for key in ('sort', 'keys', 'group', 'list', 'range', 'ids'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.List.objects.find(data, user)
    return query

def findLists(request):
    '''
        FIXME: support key: subscribed
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
            name, user, featured, subscribed

        possible keys:
            name, user, featured, subscribed, query

        }
        return {status: {code: int, text: string},
                data: {
                    lists: [
                        {name:, user:, featured:, public...}
                    ]
                }
        }
    '''
    data = json.loads(request.POST['data'])
    query = _parse_query(data, request.user)

    #order
    qs = _order_query(query['qs'], query['sort'])
    #range
    response = json_response()
    if 'keys' in data:
        qs = qs[query['range'][0]:query['range'][1]]

        response['data']['items'] = [l.json(data['keys'], request.user) for l in qs]
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findLists)

@login_required_json
def addListItem(request):
    '''
        param data
            {list: listId,
             item: itemId,
             quert: ...
           }
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    list = get_object_or_404_json(models.List, pk=data['list'])
    if 'item' in data:
        item = get_object_or_404_json(models.Item, pk=data['item'])
        if list.editable(request.user):
            list.add(item)
            response = json_response(status=200, text='item added')
        else:
            response = json_response(status=403, text='not allowed')
    elif 'query' in data:
        response = json_response(status=501, text='not implemented')

    else:
        response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)
actions.register(addListItem)


@login_required_json
def removeListItem(request):
    '''
        param data
            {list: listId,
             item: itemId,
             quert: ...
           }
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    list = get_object_or_404_json(models.List, pk=data['list'])
    if 'item' in data:
        item = get_object_or_404_json(models.Item, pk=data['item'])
        if list.editable(request.user):
            list.remove(item)
            response = json_response(status=200, text='item removed')
        else:
            response = json_response(status=403, text='not allowed')
    elif 'query' in data:
        response = json_response(status=501, text='not implemented')

    else:
        response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)
actions.register(removeListItem)


@login_required_json
def addList(request):
    '''
        param data
            {name: value}
        return {
            status: {'code': int, 'text': string},
            data: {
                list:
            }
        }
    '''
    data = json.loads(request.POST['data'])
    if models.List.filter(name=data['name'], user=request.user).count() == 0:
        list = models.List(name = data['name'], user=request.user)
        list.save()
        response = json_response(status=200, text='created')
        response['data']['list'] = list.json()
    else:
        response = json_response(status=200, text='list already exists')
        response['data']['errors'] = {'name': 'List already exists'}
    return render_to_json_response(response)
actions.register(addList)


@login_required_json
def editList(request):
    '''
        param data {
            key: value
        }
        keys: name, public, query, featured (if admin)
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    list = get_object_or_404_json(models.List, pk=data['list'])
    if list.editable(request.user):
        for key in data:
            if key in ('name', 'status', 'query'):
                if key in data:
                    if key == 'query' and not data['query']:
                        setattr(list, key, {"static":True})
                    elif key == 'status':
                        value = data[key]
                        if value not in list._status:
                            value = list._status[0]
                        setattr(list, key, value)
                    else:
                        setattr(list, key, data[key])
        if user.has_perm('Ox.admin') and 'featured' in data:
            list.featured = data['featured']
    else:
        response = json_response(status=403, text='not allowed')
    return render_to_json_response(response)
actions.register(editList)


@login_required_json
def removeList(request):
    '''
        param data {
            name: value,
            user: username(only admins)
        }
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    user = request.user.username
    if user.has_perm('Ox.admin') and 'user' in data:
        user = data.get('user')
    list = get_object_or_404_json(models.List, name=data['name'], user__username=user)
    if list.editable(request.user):
        list.delete()
    else:
        response = json_response(status=403, text='not allowed')
    return render_to_json_response(response)
actions.register(removeList)
