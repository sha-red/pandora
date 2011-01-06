# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

import models
from api.actions import actions


@login_required_json
def addListItem(request):
    '''
        param data
            {list: listId,
             item: itemId,
             quert: ...
           }
        return {'status': {'code': int, 'text': string},
                'data': {}}
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
        return {'status': {'code': int, 'text': string},
                'data': {}}
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
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    data = json.loads(request.POST['data'])
    if models.List.filter(name=data['name'], user=request.user).count() == 0:
        list = models.List(name = data['name'], user=request.user)
        list.save()
        response = json_response(status=200, text='created')
    else:
        response = json_response(status=200, text='list already exists')
        response['data']['errors'] = {'name': 'List already exists'}
    return render_to_json_response(response)
actions.register(addList)


@login_required_json
def editList(request):
    '''
        param data
            {key: value}
        keys: name, public
        return {'status': {'code': int, 'text': string},
                'data': {}
        }
    '''
    data = json.loads(request.POST['data'])
    list = get_object_or_404_json(models.List, pk=data['list'])
    if list.editable(request.user):
        for key in data:
            if key in ('name', 'public', 'query'):
                if key in data:
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
        param data
            {key: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    data = json.loads(request.POST['data'])
    list = get_object_or_404_json(models.List, pk=data['list'])
    if list.editable(request.user):
        list.delete()
    else:
        response = json_response(status=403, text='not allowed')
    return render_to_json_response(response)
actions.register(removeList)
