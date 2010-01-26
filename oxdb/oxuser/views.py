# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.contrib.auth.models import User
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404
from django.template import RequestContext
from django.utils import simplejson as json

from oxdjango.shortcuts import render_to_json_response
from oxdjango.decorators import login_required_json

import models


def api_login(request):
    '''
        data: {'username': username, 'password': password}
        
        username/password to login
    '''
    response = {'status': 403, 'statusText': 'login failed'}
    data = json.loads(request.POST['data'])

    from django.contrib.auth import authenticate, login
    user = authenticate(username=data['username'], password=data['password'])
    if user is not None:
        if user.is_active:
            user_json = {} #FIXME: preferences etc should be in here
            login(request, user)
            response = {'status': 200, 'message': 'You are logged in.', 'user': user_json}
        else:
            response = {'status': 403, 'statusText': 'Your account is disabled.'}
            print "Your account has been disabled!"
    else:
        response = {'status': 403, 'statusText': 'Your username and password were incorrect.'}
    return render_to_json_response(response)

def api_logout(request):
    '''
		loggs out currenly logged in user
    '''
    response = {'status': 200, 'statusText': 'logged out'}
    if request.user.is_authenticated():
        request.user.logout()
    return render_to_json_response(response)

def api_register(request):
    '''
        data: {'username': username, 'password': password, 'email': email}
        
        username
        password
        email
    '''
    data = json.loads(request.POST['data'])
    response = {'status': 422, 'statusText': 'username exists'}
    return render_to_json_response(response)

def api_recover(request):
    data = json.loads(request.POST['data'])

    username = data['username']
    user = None
    q = models.User.objects.filter(username=username)
    if q.count() > 0:
        user = q[0]
    else:
        q = models.User.objects.filter(email=username)
        if q.count() > 0:
            user = q[0]
    if user:
        #user.sendmail(...) #FIXME: send recovery mail
        response = {'status': 200, 'statusText': 'recover email sent.'}
    else:
        response = {'status': 404, 'statusText': 'user or email not found.'}
    return render_to_json_response(response)

@login_required_json
def api_preferences(request):
    '''
        function: preferences

        api('preferences')
            return all preferences
        api('preferences', 'key1')
            return preference key1
        api('preferences', [key1, key2])
            return preference key1, key2
        api('preferences', {key: value})
            set preference key to value
    '''
    response = {'status': 200, 'statusText': 'ok'}
    if 'data' not in request.POST:
        response['preferences'] = request.user.preferences
    else:
        data = json.loads(request.POST['data'])
        if isinstance(data, basestring):
            response = {'status': 500, 'statusText': 'fixme: get preferences not implemented'}
            response['preferences'][data] = models.getPreference(user, data)
        elif isinstance(data, list):
            response = {'status': 500, 'statusText': 'fixme: get preferences not implemented'}
            response['preferences'] = {}
            for preference in data:
                response['preferences'][preference] = models.getPreference(user, preference)
        elif isinstance(data, dict):
            response = {'status': 500, 'statusText': 'fixme: set preferences not implemented'}
            for key in data:
                models.setPreference(user, key, data[key])
    return render_to_json_response(response)

