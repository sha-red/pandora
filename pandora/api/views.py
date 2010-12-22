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

from pandora.user.models import get_user_json

from pandora.archive.models import File
from pandora.archive import extract


from actions import actions

def api(request):
    if request.META['REQUEST_METHOD'] == "OPTIONS":
        response = HttpResponse('')
        response = render_to_json_response({'status': {'code': 200, 'text': 'use POST'}})
        response['Access-Control-Allow-Origin'] = '*'
        return response
    if not 'action' in request.POST:
        methods = actions.keys()
        api = []
        for f in sorted(methods):
            api.append({
                'name': f,
                'doc': actions.doc(f).replace('\n', '<br>\n')
            })
        context = RequestContext(request, {'api': api,
                                           'sitename': settings.SITENAME,})
        return render_to_response('api.html', context)
    function = request.POST['action']
    #FIXME: possible to do this in f
    #data = json.loads(request.POST['data'])

    f = actions.get(function, None)
    if f:
        response = f(request)
    else:
        response = render_to_json_response(json_response(status=400,
                                text='Unknown function %s' % function))
    response['Access-Control-Allow-Origin'] = '*'
    return response

def hello(request):
    '''
        return {'status': {'code': int, 'text': string},
                'data': {user: object}}
    '''
    #data = json.loads(request.POST['data'])
    response = json_response({})
    if request.user.is_authenticated():
        response['data']['user'] = get_user_json(request.user)
    else:
        response['data']['user'] = {'name': 'Guest', 'group': 'guest', 'preferences': {}}
    return render_to_json_response(response)
actions.register(hello)

def error(request):
    '''
        this action is used to test api error codes, it should return a 503 error
    '''
    success = error_is_success
    return render_to_json_response({})
actions.register(error)

