    # -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import uuid
import hashlib

from django import forms
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404, redirect
from django.template import RequestContext, loader, Context
from django.utils import simplejson as json
from django.conf import settings
from django.core.mail import send_mail, BadHeaderError

from oxdjango.shortcuts import render_to_json_response, json_response
from oxdjango.decorators import login_required_json

import models

def json_errors(form):
    return {'status': {'code': 402, 'text': 'form error', 'data': form.errors}}

class LoginForm(forms.Form):
    username = forms.TextInput()
    password = forms.TextInput()

def api_login(request):
    '''
        param data
            {'username': username, 'password': password}
        
        return {'status': {'code': int, 'text': string}}
    '''
    response = json_response(status=403, text='login failed')
    data = json.loads(request.POST['data'])
    form = LoginForm(data, request.FILES)
    if form.is_valid():
        user = authenticate(username=data['username'], password=data['password'])
        if user is not None:
            if user.is_active:
                login(request, user)
                user_json = models.getUserJSON(user)
                response = json_response({'user': user_json},
                                         text='You are logged in.')
            else:
                response = json_response(status=401,
                    text='Your account is disabled.')
        else:
                errors = json_errors(form)
                response = json_response(errors,
                    status=401, text='Your username and password were incorrect.')
    else:
        response = json_response(status=400, text='invalid data')

    return render_to_json_response(response)

def api_logout(request):
    '''
        param data
            {}
        
        return {'status': {'code': int, 'text': string}}
    '''
    response = json_response(text='logged out')
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
            response = json_response(status=400, text='username or email exists')
        elif models.User.objects.filter(email=form.data['email']).count() > 0:
            response = json_response(status=400, text='username or email exists')
        else:
            user = models.User(username=form.data['username'], email=form.data['email'])
            user.set_password(form.data['password'])
            user.save()
            user = authenticate(username=form.data['username'],
                                password=form.data['password'])
            login(request, user)
            response = json_response(text='account created')
    else:
        response = json_response(status=400, text='username exists')
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
            key = hashlib.sha1(str(uuid.uuid4())).hexdigest()
            user_profile = user.get_profile()
            user_profile.recover_key = key
            user_profile.save()

            template = loader.get_template('recover_email.txt')
            context = RequestContext(request, {
                'recover_url': request.build_absolute_uri("/r/%s" % key),
                'sitename': settings.SITENAME,
            })
            message = template.render(context)
            subject = '%s account recovery' % settings.SITENAME
            user.email_user(subject, message)
            response = json_response(text='recover email sent')
        else:
            response = json_response(status=404, text='username or email not found')
    else:
        response = json_response(status=400, text='invalid data')
    return render_to_json_response(response)

def api_findUser(request):
    '''
        param data
            {key: "username", value: "foo", operator: "="}
        
        return {
            'status': {'code': int, 'text': string}
            'data': {
                users = ['user1', 'user2']
            }
        }
    '''
    #FIXME: support other operators and keys
    data = json.loads(request.POST['data'])
    response = json_response(status=200, text='ok')
    response['data']['users'] = [u.username for u in User.objects.filter(username__iexact=data['value'])]
    return render_to_json_response(response)

def recover(request, key):
    qs = models.UserProfile.objects.filter(recover_key=key)
    if qs.count() == 1:
        user = qs[0].user
        user.set_password(key)
        user.save()
        user_profile = user.get_profile()
        user_profile.recover_key = ''
        user_profile.save()
        user = authenticate(username=user.username, password=key)
        login(request, user)
        
        #FIXME: set message to notify user to update password
        return redirect('/#settings')
    return redirect('/')

class ContactForm(forms.Form):
    email = forms.EmailField()
    subject = forms.TextInput()
    message = forms.TextInput()

def api_contact(request):
    '''
        param data
            {'email': string, 'message': string}
        
        return {'status': {'code': int, 'text': string}}
    '''
    data = json.loads(request.POST['data'])
    form = ContactForm(data, request.FILES)
    if form.is_valid():
        email = data['email']
        template = loader.get_template('contact_email.txt')
        context = RequestContext(request, {
            'sitename': settings.SITENAME,
            'email': email,
            'message': data['message'],
        })
        message = template.render(context)
        subject = '%s contact: %s' % (settings.SITENAME, data['subject'])
        response = json_response(text='message sent')
        try:
            send_mail(subject, message, email, [settings.DEFAULT_FROM_EMAIL, ])
        except BadHeaderError:
            response = json_response(status=400, text='invalid data')
    else:
        response = json_response(status=400, text='invalid data')
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
    response = json_response()
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
