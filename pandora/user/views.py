# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import random
random.seed()

from django import forms
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.template import RequestContext, loader
from django.utils import simplejson as json
from django.conf import settings
from django.core.mail import send_mail, BadHeaderError

from ox.django.shortcuts import render_to_json_response, json_response, get_object_or_404_json
from ox.django.decorators import login_required_json
import ox

import models

from api.actions import actions
from app.models import site_config
from item.models import Access, Item

class SigninForm(forms.Form):
    username = forms.TextInput()
    password = forms.TextInput()


def signin(request):
    '''
        param data {
            username: 'username',
            password: 'password'
        }

        return {
            status: {'code': 200, 'text': 'ok'}
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
    form = SigninForm(data, request.FILES)
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
actions.register(signin, cache=False)


def signout(request):
    '''
        param data {
        }

        return {
            status: {'code': int, 'text': string}
            data: {
                user: {
                    default user
                }
            }
        }
    '''
    response = json_response(text='ok')
    if request.user.is_authenticated():
        response = json_response(text='logged out')
        logout(request)

    response['data']['user'] = site_config()['user']
    return render_to_json_response(response)
actions.register(signout, cache=False)


class SignupForm(forms.Form):
    username = forms.TextInput()
    password = forms.TextInput()
    email = forms.TextInput()


def signup(request):
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
    form = SignupForm(data, request.FILES)
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
            #create default user lists:
            for l in settings.DEFAULT_LISTS:
                list = models.List(name=l['name'], user=user)
                for key in ('query', 'public', 'featured'):
                    if key in l:
                        setattr(list, key, l[key])
                list.save()

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
actions.register(signup, cache=False)


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
actions.register(resetPassword, cache=False)


def requestToken(request):
    '''
        param data {
            username: username,
            email: email
        }

        return {
            status: {'code': int, 'text': string}
            data: {
                errors: {
                    username: 'Unknown Username'
                    email: 'Unknown Email'
                }
                username: user
            }
        }
    '''
    data = json.loads(request.POST['data'])
    user = None
    if 'username' in data:
        try:
            user = models.User.objects.get(username=data['username'])
        except models.User.DoesNotExist:
            user = None
    elif 'email' in data:
        try:
            user = models.User.objects.get(email=data['email'])
        except models.User.DoesNotExist:
            user = None
    if user:
        while True:
            token = ox.to32(random.randint(32768, 1048575))
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
        subject = '%s - Reset Password' % settings.SITENAME
        user.email_user(subject, message)
        response = json_response({
            'username': user.username
        }, text='password reset email sent')
    else:
        response = json_response({
            'errors': {
            }
        })
        if 'username' in data:
            response['data']['errors']['username'] = 'Unknown Username'
        elif 'email' in data:
            response['data']['errors']['email'] = 'Unknown Email'
        else:
            response = json_response(status=400, text='invalid data')
    return render_to_json_response(response)
actions.register(requestToken, cache=False)


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
    if data['key'] == 'email':
        response['data']['users'] = [u.username for u in User.objects.filter(email__iexact=data['value'])]
    else:
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
actions.register(contact, cache=False)


def getPositionById(list, key):
    for i in range(0, len(list)):
        if list[i]['id'] == key:
            return i
    return -1


@login_required_json
def setPreferences(request):
    '''
        param data {
            key.subkey: value
        }
        return
    '''
    data = json.loads(request.POST['data'])
    keys = data.keys()[0].split('.')
    value = data.values()[0]
    profile = request.user.get_profile()
    p = profile.preferences
    while len(keys)>1:
        key = keys.pop(0)
        if isinstance(p, list):
            p = p[getPositionById(p, key)]
        else:
            p = p[key]
    p[keys[0]] = value
    profile.save()
    response = json_response()
    return render_to_json_response(response)
actions.register(setPreferences, cache=False)


@login_required_json
def resetUI(request):
    '''
        reset user ui settings to defaults
        param data {
        }

        return {
            'status': {'code': int, 'text': string}
        }
    '''
    profile = request.user.get_profile()
    profile.ui = {}
    profile.save()
    response = json_response()
    return render_to_json_response(response)
actions.register(resetUI, cache=False)

def setUI(request):
    '''
        param data {
            key.subkey: value
        }
        you can set nested keys
            api.setUI({"lists|my|ListView": "icons"})

        return {
            'status': {'code': int, 'text': string}
        }
    '''
    data = json.loads(request.POST['data'])
    if request.user.is_authenticated():
        profile = request.user.get_profile()
        for key in data:
            keys = key.split('|')
            value = data[key]
            p = profile.ui
            while len(keys)>1:
                key = keys.pop(0)
                if isinstance(p, list):
                    p = p[getPositionById(p, key)]
                else:
                    if key not in p:
                        p[key] = {}
                    p = p[key]
            p[keys[0]] = value
        profile.save()

    if data.get('item', False):
        item = get_object_or_404_json(Item, itemId=data['item'])
        if request.user.is_authenticated():
            access, created = Access.objects.get_or_create(item=item, user=request.user)
        else:
            access, created = Access.objects.get_or_create(item=item, user=None)
        access.save()

    response = json_response()
    return render_to_json_response(response)
actions.register(setUI, cache=False)

