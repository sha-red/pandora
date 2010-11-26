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

import models

@login_required_json
def api_addDate(request):
    data = json.loads(request.POST['data'])
    if models.Date.filter(name=data['name']).count() == 0:
        place = models.Date(name = data['name'])
        place.save()
        response = json_response(status=200, text='created')
    else:
        response = json_response(status=403, text='place name exists')
    return render_to_json_response(response)

@login_required_json
def api_editDate(request):
    '''
        param data
            {
                'id': dateid,
                'date': dict
            }
            date contains key/value pairs with place propterties
    '''
    data = json.loads(request.POST['data'])
    Date = get_object_or_404_json(models.Date, pk=data['id'])
    if Date.editable(request.user):
        conflict = False
        names = [data['date']['name']] + data['date']['aliases']
        for name in names: #FIXME: also check aliases!
            if models.Date.filter(name=data['name']).exclude(id=Date.id).count() != 0:
                conflict = True
        if not conflict:
            for key in data['date']:
                setattr(Date, key, data['date'][key])
            Date.save()
            response = json_response(status=200, text='updated')
        else:
            response = json_response(status=403, text='Date name/alias conflict')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)

@login_required_json
def api_removeDate(request):
    response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)

def api_findDate(request):
    '''
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

Positions
        param data
            {'query': query, 'ids': []}
        
            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
            ids:  ids of dates for which positions are required
    '''
    data = json.loads(request.POST['data'])
    response = json_response(status=200, text='ok')
    response['data']['places'] = []
    #FIXME: add coordinates to limit search
    for p in  Dates.objects.find(data['query']):
        response['data']['dates'].append(p.json())
    return render_to_json_response(response)

