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
import utils
import tasks

from pandora.user.models import getUserJSON
from pandora.user.views import api_login, api_logout, api_register, api_contact, api_recover, api_preferences, api_findUser

from pandora.archive.views import api_update, api_upload, api_editFile, api_encodingProfile

from pandora.archive.models import File
from pandora.archive import extract

from pandora.item.views import *
from pandora.itemlist.views import *
from pandora.place.views import *
from pandora.date.views import *

def api(request):
    if request.META['REQUEST_METHOD'] == "OPTIONS":
        response = HttpResponse('')
        response = render_to_json_response({'status': {'code': 200, 'text': 'use POST'}})
        response['Access-Control-Allow-Origin'] = '*'
        return response
    if not 'action' in request.POST:
        return apidoc(request)
    function = request.POST['action']
    #FIXME: possible to do this in f
    #data = json.loads(request.POST['data'])

    f = globals().get('api_'+function, None)
    if f:
        response = f(request)
    else:
        response = render_to_json_response(json_response(status=400,
                                text='Unknown function %s' % function))
    response['Access-Control-Allow-Origin'] = '*'
    return response

def api_api(request):
    '''
        returns list of all known api action
        return {'status': {'code': int, 'text': string},
                'data': {actions: ['api', 'hello', ...]}}
    '''
    actions = globals().keys()
    actions = map(lambda a: a[4:], filter(lambda a: a.startswith('api_'), actions))
    actions.sort()
    return render_to_json_response(json_response({'actions': actions}))

def api_apidoc(request):
    '''
        returns array of actions with documentation
    '''
    actions = globals().keys()
    actions = map(lambda a: a[4:], filter(lambda a: a.startswith('api_'), actions))
    actions.sort()
    docs = {}
    for f in actions:
        docs[f] = get_api_doc(f)
    return render_to_json_response(json_response({'actions': docs}))

def api_hello(request):
    '''
        return {'status': {'code': int, 'text': string},
                'data': {user: object}}
    '''
    #data = json.loads(request.POST['data'])
    response = json_response({})
    if request.user.is_authenticated():
        response['data']['user'] = getUserJSON(request.user)
    else:
        response['data']['user'] = {'name': 'Guest', 'group': 'guest', 'preferences': {}}
    return render_to_json_response(response)

def api_error(request):
    '''
        trows 503 error
    '''
    success = error_is_success
    return render_to_json_response({})

def get_api_doc(f):
    f = 'api_' + f

    import sys
    def trim(docstring):
        if not docstring:
            return ''
        # Convert tabs to spaces (following the normal Python rules)
        # and split into a list of lines:
        lines = docstring.expandtabs().splitlines()
        # Determine minimum indentation (first line doesn't count):
        indent = sys.maxint
        for line in lines[1:]:
            stripped = line.lstrip()
            if stripped:
                indent = min(indent, len(line) - len(stripped))
        # Remove indentation (first line is special):
        trimmed = [lines[0].strip()]
        if indent < sys.maxint:
            for line in lines[1:]:
                trimmed.append(line[indent:].rstrip())
        # Strip off trailing and leading blank lines:
        while trimmed and not trimmed[-1]:
            trimmed.pop()
        while trimmed and not trimmed[0]:
            trimmed.pop(0)
        # Return a single string:
        return '\n'.join(trimmed)

    return trim(globals()[f].__doc__)

def apidoc(request):
    '''
        this is used for online documentation at http://127.0.0.1:8000/api/
    '''

    functions = filter(lambda x: x.startswith('api_'), globals().keys())
    api = []
    for f in sorted(functions):
        api.append({
            'name': f[4:],
            'doc': get_api_doc(f[4:]).replace('\n', '<br>\n')
        })
    context = RequestContext(request, {'api': api,
                                       'sitename': settings.SITENAME,})
    return render_to_response('api.html', context)



'''
    ajax html snapshots
    http://code.google.com/web/ajaxcrawling/docs/html-snapshot.html    
'''
def html_snapshot(request):
    fragment = unquote(request.GET['_escaped_fragment_'])
    url = request.build_absolute_uri('/ra')
    url = 'http://'+settings.URL
    response = HttpResponse('sorry, server side rendering for %s!#%s not yet implemented'%(url, fragment))
    return response
