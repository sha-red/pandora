# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import random
random.seed()

from django import forms
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404, redirect
from django.template import RequestContext, loader, Context
from django.utils import simplejson as json
from django.conf import settings
from django.core.mail import send_mail, BadHeaderError

from ox.django.shortcuts import render_to_json_response, json_response
from ox.django.decorators import login_required_json
import ox

import models

from api.actions import actions


class LoginForm(forms.Form):
    username = forms.TextInput()
    password = forms.TextInput()

def api_login(request):
    '''
        param data {
            username: 'username',
            password: 'password'
        }
        
        return {
            status: {'code': int, 'text': string}
            data: {
                errors: {
                    username: 'Unknown Username',
                    password: 'Incorrect Password'
                }
                user: {
                    ...
                }
            }
        }
    '''
    data = json.loads(request.POST['data'])
    form = LoginForm(data, request.FILES)
    if form.is_valid():
        if models.User.objects.filter(username=form.data['username']).count() == 0:
            response = json_response({
                'errors': {
                    'username': 'Unknown Username'
                }
            })
        else:
            user = authenticate(username=data['username'], password=data['password'])
            if user is not None:
                if user.is_active:
                    login(request, user)
                    user_json = models.get_user_json(user)
                    response = json_response({
                        'user': user_json
                    })
                else:
                    response = json_response({
                        'errors': {
                            'username': 'User Disabled'
                        }
                    })
            else:
                response = json_response({
                    'errors': {
                        'password': 'Incorrect Password'
                    }
                })
    else:
        response = json_response(status=400, text='invalid data')
    return render_to_json_response(response)
actions.register(api_login, 'login')

def api_logout(request):
    '''
        param data {
        }
        
        return {
            status: {'code': int, 'text': string}
        }
    '''
    response = json_response(text='ok')
    if request.user.is_authenticated():
        response = json_response(text='logged out')
        logout(request)
    return render_to_json_response(response)
actions.register(api_logout, 'logout')

class RegisterForm(forms.Form):
    username = forms.TextInput()
    password = forms.TextInput()
    email = forms.TextInput()

def register(request):
    '''
        param data {
            username: 'username',
            password: 'password',
            email: 'emailaddress'
        }
        
        return {
            status: {'code': int, 'text': string}
            data: {
                errors: {
                    username: 'Unknown Username',
                    password: 'Incorrect Password'
                }
                user: {
                    ...
                }
            }
        }
    '''
    data = json.loads(request.POST['data'])
    form = RegisterForm(data, request.FILES)
    if form.is_valid():
        if models.User.objects.filter(username=form.data['username']).count() > 0:
            response = json_response({
                'errors': {
                    'username': 'Username already exists'
                }
            })
        elif models.User.objects.filter(email=form.data['email']).count() > 0:
            response = json_response({
                'errors': {
                    'email': 'Email address already exits'
                }
            })
        elif not form.data['password']:
            response = json_response({
                'errors': {
                    'password': 'Password can not be empty'
                }
            })
        else:
            first_user = models.User.objects.count() == 0
            user = models.User(username=form.data['username'], email=form.data['email'])
            user.set_password(form.data['password'])
            #make first user admin
            user.is_superuser = first_user
            user.is_staff = first_user
            user.save()
            user = authenticate(username=form.data['username'],
                                password=form.data['password'])
            login(request, user)
            user_json = models.get_user_json(user)
            response = json_response({
                'user': user_json
            }, text='account created')
    else:
        response = json_response(status=400, text='invalid data')
    return render_to_json_response(response)
actions.register(register)

def resetPassword(request):
    '''
        param data {
            token: reset token
            password: new password
        }
        
        return {
            status: {'code': int, 'text': string}
            data: {
                errors: {
                    token: 'Invalid token'
                }
                user {
                }
            }
        }
    '''
    data = json.loads(request.POST['data'])
    if 'token' in data and 'password' in data:
        if not data['password']:
            response = json_response({
                'errors': {
                    'password': 'Password can not be empty'
                }
            })
        else:
            qs = models.UserProfile.objects.filter(reset_token=data['token'])
            if qs.count() == 1:
                user = qs[0].user
                user.set_password(data['password'])
                user.save()
                user_profile = user.get_profile()
                user_profile.reset_token = None
                user_profile.save()
                user = authenticate(username=user.username, password=data['password'])
                login(request, user)

                user_json = models.get_user_json(user)
                response = json_response({
                    'user': user_json
                }, text='password reset')
            else:
                response = json_response({
                    'errors': {
                        'token': 'Invalid token'
                    }
                })

    else:
        response = json_response(status=400, text='invalid data')
    return render_to_json_response(response)
actions.register(resetPassword)

class RecoverForm(forms.Form):
    username_or_email = forms.TextInput()

def requestToken(request):
    '''
        param data {
            username_or_email: username
        }
        
        return {
            status: {'code': int, 'text': string}
            data: {
                errors: {
                    username_or_email: 'Username or email address not found'
                }
                username: user
            }
        }
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
            while True:
                token = ox.to32(random.randint(0, 1000000000))
                if models.UserProfile.objects.filter(reset_token=token).count() == 0:
                    break
            user_profile = user.get_profile()
            user_profile.reset_token = token
            user_profile.save()

            template = loader.get_template('password_reset_email.txt')
            context = RequestContext(request, {
                'url': request.build_absolute_uri("/"),
                'token': token,
                'sitename': settings.SITENAME,
            })
            message = template.render(context)
            subject = '%s password reset' % settings.SITENAME
            user.email_user(subject, message)
            response = json_response({
                'username': user.username
            }, text='recover email sent')
        else:
            response = json_response({
                'errors': {
                    'username_or_email': 'Username or email address not found'
                }
            })
    else:
        response = json_response(status=400, text='invalid data')
    return render_to_json_response(response)
actions.register(requestToken)

def findUser(request):
    '''
        param data {
            key: "username",
            value: "foo", operator: "="
        }
        
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
actions.register(findUser)

class ContactForm(forms.Form):
    email = forms.EmailField()
    subject = forms.TextInput()
    message = forms.TextInput()

def contact(request):
    '''
        param data {
            'email': string,
            'message': string
        }
        
        return {
            'status': {'code': int, 'text': string}
        }
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
actions.register(contact)

@login_required_json
def preferences(request):
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
        response['data']['preferences'] = models.get_preferences(request.user)
    else:
        data = json.loads(request.POST['data'])
        if isinstance(data, basestring):
            response['data']['preferences'] = {}
            response['data']['preferences'][data] = models.get_preference(request.user, data)
        elif isinstance(data, list):
            response['data']['preferences'] = {}
            for preference in data:
                response['preferences'][preference] = models.get_preference(request.user, preference)
        elif isinstance(data, dict):
            if not data:
                response['data']['preferences'] = models.get_preferences(request.user)
            else:
                del response['data']
                for key in data:
                    models.set_preference(request.user, key, data[key])
    return render_to_json_response(response)
actions.register(preferences)

