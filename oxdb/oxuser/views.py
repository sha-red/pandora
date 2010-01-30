# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404
from django.template import RequestContext
from django.utils import simplejson as json
from django import forms

from oxdjango.shortcuts import render_to_json_response
from oxdjango.decorators import login_required_json

import models

class LoginForm(forms.Form):
    username = forms.TextInput()
    password = forms.TextInput()

def api_login(request):
    '''
        param data
            {'username': username, 'password': password}
        
        return {'status': {'code': int, 'text': string}}
    '''
    response = {'status': {'code': 403, 'text': 'login failed'}}
    data = json.loads(request.POST['data'])
    form = LoginForm(data, request.FILES)
    if form.is_valid():
        user = authenticate(username=data['username'], password=data['password'])
        if user is not None:
            if user.is_active:
                login(request, user)
                user_json = models.getUserJSON(user)
                response = {'status': {'code': 200, 'message': 'You are logged in.', 'user': user_json}}
            else:
                response = {'status': {'code': 403, 'text': 'Your account is disabled.'}}
        else:
            response = {'status': {'code': 403, 'text': 'Your username and password were incorrect.'}}
    else:
        response = {'status': {'code':422, 'text': 'invalid data'}}

    return render_to_json_response(response)

def api_logout(request):
    '''
        param data
            {}
        
        return {'status': {'code': int, 'text': string}}
    '''
    response = {'status': {'code': 200, 'text': 'logged out'}}
    if request.user.is_authenticated():
        logout(request)
    return render_to_json_response(response)

class RegisterForm(forms.Form):
    username = forms.TextInput()
    password = forms.TextInput()
    email = forms.TextInput()

def api_register(request):
    '''
        param data
            {'username': username, 'password': password, 'email': email}
        
        return {'status': {'code': int, 'text': string}}
    '''
    data = json.loads(request.POST['data'])
    form = RegisterForm(data, request.FILES)
    if form.is_valid():
        if models.User.objects.filter(username=form.data['username']).count() > 0:
            response = {'status': {'code':422, 'text': 'username or email exists'}}
        elif models.User.objects.filter(email=form.data['email']).count() > 0:
            response = {'status': {'code':422, 'text': 'username or email exists'}}
        else:
            user = models.User(username=form.data['username'], email=form.data['email'])
            user.set_password(form.data['password'])
            user.save()
            user = authenticate(username=form.data['username'],
                                password=form.data['password'])
            login(request, user)
            response = {'status': {'code':200, 'text': 'account created'}}
    else:
        response = {'status': {'code':422, 'text': 'username exists'}}
    return render_to_json_response(response)

class RecoverForm(forms.Form):
    username_or_email = forms.TextInput()

def api_recover(request):
    '''
        param data
            {'username_or_email': username}
        
        return {'status': {'code': int, 'text': string}}
    '''
    data = json.loads(request.POST['data'])
    form = RegisterForm(data, request.FILES)
    if form.is_valid():
        username = data['username_or_email']
        user = None
        q = models.User.objects.filter(username=username)
        if q.count() > 0:
            user = q[0]
        else:
            q = models.User.objects.filter(email=username)
            if q.count() > 0:
                user = q[0]
        if user:
            user.email_user('recovert','not yest, but soon you will be able to recover')
            #user.sendmail(...) #FIXME: send recovery mail
            response = {'status': {'code': 200, 'text': 'recover email sent.'}}
        else:
            response = {'status': {'code': 404, 'text': 'user or email not found.'}}
    else:
        response = {'status': {'code':422, 'text': 'username exists'}}
    return render_to_json_response(response)

@login_required_json
def api_preferences(request):
    '''
        param data
            string
            array
            object

        return
        if data is empy or {}
        if data is string:
            return preference with name
        if data is array:
            return preferences with names
        if data is object:
            set key values in dict as preferences
    '''
    response = {'status': {'code': 200, 'text': 'ok'}, 'data':{}}
    if 'data' not in request.POST:
        response['data']['preferences'] = models.getPreferences(request.user)
    else:
        data = json.loads(request.POST['data'])
        if isinstance(data, basestring):
            response['data']['preferences'] = {}
            response['data']['preferences'][data] = models.getPreference(request.user, data)
        elif isinstance(data, list):
            response['data']['preferences'] = {}
            for preference in data:
                response['preferences'][preference] = models.getPreference(request.user, preference)
        elif isinstance(data, dict):
            if not data:
                response['data']['preferences'] = models.getPreferences(request.user)
            else:
                del response['data']
                for key in data:
                    models.setPreference(request.user, key, data[key])
    return render_to_json_response(response)

