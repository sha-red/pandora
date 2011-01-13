# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

import models
from api.actions import actions


def get_list_or_404_json(id):
    username, listname = id.split('.')
    return get_object_or_404_json(models.List, user__username=username, name=listname)

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
    #query['sort'] = [{'key':'position__position', 'operator':'+'}]
    query['sort'] = [{'key':'name', 'operator':'+'}]
    for key in ('keys', 'group', 'list', 'range', 'ids', 'sort'):
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
    is_section_request = query['sort'] == [{u'operator': u'+', u'key': u'position'}]
    is_featured = len(filter(lambda x: x['key'] == 'status' and x['value'] == 'featured' and x['operator'] == '=', data['query'].get('conditions', []))) > 0 

    if is_section_request:
        qs = query['qs']
        if not is_featured:
            qs = qs.filter(position__in=models.Position.objects.filter(user=request.user))
        qs = qs.order_by('position__position')
    else:
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
    list = get_list_or_404_json(data['list'])
    if 'item' in data:
        item = get_object_or_404_json(models.Item, itemId=data['item'])
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
actions.register(addListItem, cache=False)


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
    list = get_list_or_404_json(data['list'])
    if 'item' in data:
        item = get_object_or_404_json(models.Item, itemId=data['item'])
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
actions.register(removeListItem, cache=False)


@login_required_json
def addList(request):
    '''
        param data {
            name: value,
            position: int
        }
        return {
            status: {'code': int, 'text': string},
            data: {
                list:
            }
        }
    '''
    data = json.loads(request.POST['data'])
    if models.List.objects.filter(name=data['name'], user=request.user).count() == 0:
        list = models.List(name = data['name'], user=request.user)
        list.save()
        pos, created = models.Position.objects.get_or_create(list=list, user=request.user, section='my')
        pos.position = data['position']
        pos.save()
        response = json_response(status=200, text='created')
        response['data']['list'] = list.json()
    else:
        response = json_response(status=200, text='list already exists')
        response['data']['errors'] = {'name': 'List already exists'}
    return render_to_json_response(response)
actions.register(addList, cache=False)


@login_required_json
def editList(request):
    '''
        param data {
            id: listId,
            key: value,
        }
        keys: name, status, query, position
        if you change status you have to provide position of list

        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    list = get_list_or_404_json(data['id'])
    if list.editable(request.user):
        response = json_response()
        for key in data:
            if key in ('name', 'status', 'query', 'type'):
                if key in data:
                    if key == 'query' and not data['query']:
                        setattr(list, key, {"static":True})
                    elif key == 'type':
                        if data[key] == 'static':
                            list.query = {"static":True}
                            list.type = 'static'
                        else:
                            list.type = 'dynamic'
                            if list.query.get('static', False):
                                 list.query = {}
                    elif key == 'status':
                        value = data[key]
                        if value not in list._status:
                            value = list._status[0]
                        setattr(list, key, value)
                        if value == 'private':
                            for user in list.subscribed_users.all():
                                list.subscribed_users.remove(user)
                    elif key == 'name':
                        name = data['name']
                        num = 1
                        while models.List.objects.filter(name=name, user=list.user).exclude(id=list.id).count()>0:
                            num += 1
                            name = data['name'] + ' (%d)' % num
                        setattr(list, key, name)
                    else:
                        setattr(list, key, data[key])

        if 'position' in data:
            pos, created = models.Position.objects.get_or_create(list=list, user=request.user)
            pos.position = data['position']
            pos.section = 'featured'
            if list.status == 'private':
                pos.section = 'my'
            pos.save()
        list.save()
        response['data'] = list.json(user=request.user)
    else:
        response = json_response(status=403, text='not allowed')
    return render_to_json_response(response)
actions.register(editList, cache=False)


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
    if user.is_staff and 'user' in data:
        user = data.get('user')
    list = get_object_or_404_json(models.List, name=data['name'], user__username=user)
    if list.editable(request.user):
        list.delete()
    else:
        response = json_response(status=403, text='not allowed')
    return render_to_json_response(response)
actions.register(removeList, cache=False)


@login_required_json
def subscribeToList(request):
    '''
        param data {
            id: listId,
            user: username(only admins)
        }
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    list = get_list_or_404_json(data['id'])
    user = request.user
    if list.subscribed_users.filter(username=user.username).count() == 0:
        list.subscribed_users.add(user)
        pos, created = models.Position.objects.get_or_create(list=list, user=request.user, section='public')
        pos.position = data['position']
        pos.save()
    response = json_response()
    return render_to_json_response(response)
actions.register(subscribeToList, cache=False)

@login_required_json
def unsubscribeFromList(request):
    '''
        param data {
            id: listId,
            user: username(only admins)
        }
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    list = get_list_or_404_json(data['id'])
    user = request.user
    list.subscribed_users.remove(user)
    models.Position.objects.filter(list=list, user=request.user, section='public').delete()
    response = json_response()
    return render_to_json_response(response)
actions.register(unsubscribeFromList, cache=False)


@login_required_json
def sortLists(request):
    '''
        param data {
            section: 'my',
            ids: [1,2,4,3]
        }
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    position = 0
    section = data['section']
    if section == 'featured' and not request.user.is_staff:
        response = json_response(status=403, text='not allowed')
    else:
        user = request.user
        if section == 'featured':
            for i in data['ids']:
                list = get_list_or_404_json(i)
                qs = models.Position.objects.filter(section=section, list=list)
                if qs.count() > 0:
                    pos = qs[0]
                else:
                    pos = models.Position(list=list, user=user, section=section)
                pos.position = position
                pos.save()
                position += 1
                models.Position.objects.filter(section=section, list=list).exclude(id=pos.id).delete()
        else:
            for i in data['ids']:
                list = get_list_or_404_json(i)
                pos, created = models.Position.objects.get_or_create(list=list,
                                     user=request.user, section=section)
                pos.position = position
                pos.save()
                position += 1

        response = json_response()
    return render_to_json_response(response)
actions.register(sortLists, cache=False)

