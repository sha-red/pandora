# -*- coding: utf-8 -*-
import json

from django.shortcuts import render
from django.conf import settings

from ..shortcuts import render_to_json_response, json_response, HttpErrorJson

from .actions import actions

def api(request):
    if request.META['REQUEST_METHOD'] == "OPTIONS":
        response = render_to_json_response({'status': {'code': 200,
                                                       'text': 'use POST'}})
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    if request.META['REQUEST_METHOD'] != "POST" or (
        not 'action' in request.POST and request.META.get('CONTENT_TYPE') != 'application/json'
    ):
        methods = list(actions)
        api = []
        for f in sorted(methods):
            api.append({'name': f,
                        'doc': actions.doc(f).replace('\n', '<br>\n')})
        context = {
            'api': api,
            'settings': settings,
            'sitename': settings.SITENAME
        }
        response = render(request, 'api.html', context)
        response['Access-Control-Allow-Origin'] = '*'
        return response
    if request.META.get('CONTENT_TYPE') == 'application/json':
        r = json.loads(request.body.decode('utf-8'))
        action = r['action']
        data = r.get('data', {})
    else:
        action = request.POST['action']
        data = json.loads(request.POST.get('data', '{}'))
    version = getattr(request, 'version', None)
    if version:
        f = actions.versions.get(version, {}).get(action, actions.get(action))
    else:
        f = actions.get(action)
    if f:
        try:
            response = f(request, data)
        except HttpErrorJson as e:
            response = render_to_json_response(e.response)
    else:
        response = render_to_json_response(json_response(status=400,
                                text='Unknown action %s' % action))
    response['Access-Control-Allow-Origin'] = '*'
    return response

