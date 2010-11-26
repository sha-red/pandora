# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import os.path
import re
from datetime import datetime
from urllib2 import unquote
import mimetypes

from django import forms
from django.core.paginator import Paginator
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Q, Avg, Count, Sum
from django.http import HttpResponse, Http404
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404, redirect
from django.template import RequestContext
from django.conf import settings

from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from ox.django.http import HttpFileResponse
import ox


'''
    List API
'''
@login_required_json
def api_addListItem(request):
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
            response = json_response(status=200, text='item removed')
        else:
            response = json_response(status=403, text='not allowed')
    elif 'query' in data:
        response = json_response(status=501, text='not implemented')
        
    else:
        response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)

@login_required_json
def api_removeListItem(request):
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

@login_required_json
def api_addList(request):
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
        response = json_response(status=403, text='list name exists')
    return render_to_json_response(response)

@login_required_json
def api_editList(request):
    '''
        param data
            {key: value}
        keys: name, public
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    data = json.loads(request.POST['data'])
    list = get_object_or_404_json(models.List, pk=data['list'])
    if list.editable(request.user):
        for key in data:
            if key in ('name', 'public'):
                setattr(list, key, data['key'])
    else:
        response = json_response(status=403, text='not allowed')
    return render_to_json_response(response)

def api_removeList(request):
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

