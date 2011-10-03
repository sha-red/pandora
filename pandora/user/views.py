# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import random
random.seed()
import re

from django import forms
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.template import RequestContext, loader
from django.utils import simplejson as json
from django.conf import settings
from django.core.mail import send_mail, BadHeaderError
from django.db.models import Sum

from ox.django.shortcuts import render_to_json_response, json_response, get_object_or_404_json
from ox.django.decorators import admin_required_json, login_required_json
import ox


from api.actions import actions
from item.models import Access, Item
from item import utils 

import models
import managers


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
                    user_json = models.init_user(user, request)
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

    response['data']['user'] = settings.CONFIG['user']
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
            token = ox.to26(random.randint(32768, 1048575))
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


@admin_required_json
def editUser(request):
    '''
        param data {
            key: value
        }
        required key: id 
        optional keys: username, email, level, note

        return {
            'status': {'code': int, 'text': string}
            'data': {
            }
        }
    '''
    response = json_response()
    data = json.loads(request.POST['data'])
    user = get_object_or_404_json(models.User, username=data['id'])
    profile = user.get_profile()
    if 'email' in data:
        user.email = data['email']
    if 'level' in data:
        profile.set_level(data['level'])
    if 'note' in data:
        profile.note = data['note']
    if 'username' in data:
        user.username = data['username']
    user.save()
    profile.save()
    return render_to_json_response(response)
actions.register(editUser, cache=False)

@admin_required_json
def removeUser(request):
    '''
        param data {
            username: username
        }
        return {
            'status': {'code': int, 'text': string}
            'data': {
            }
        }
    '''
    response = json_response()
    data = json.load(request.POST['data'])
    user = get_object_or_404_json(models.User, username=data['username'])
    user.delete()
    return render_to_json_response(response)
actions.register(removeUser, cache=False)

def findUser(request):
    '''
        param data {
            key: "username",
            value: "foo", operator: "="
            keys: []
        }

        return {
            'status': {'code': int, 'text': string}
            'data': {
                users = [{username: 'user1', level: ...}, {username: 'user2', ..}]
            }
        }
    '''
    data = json.loads(request.POST['data'])
    response = json_response(status=200, text='ok')
    #keys = data.get('keys')
    #if not keys:
    #    keys = ['username', 'level']
    keys = ['username', 'level']

    if data['key'] == 'email':
        response['data']['users'] = [models.user_json(u, keys)
                                     for u in User.objects.filter(email__iexact=data['value'])]
    else:
        response['data']['users'] = [models.user_json(u, keys)
                                     for u in User.objects.filter(username__iexact=data['value'])]
    return render_to_json_response(response)
actions.register(findUser)


def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'name', 'operator':'+'}]
    for key in ('keys', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = managers.find_user(query, user)
    return query

def order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'email': 'email',
            'firstseen': 'date_joined',
            'lastseen': 'last_login',
            'username': 'username',
        }.get(e['key'], 'profile__%s'%e['key'])
        if key == 'profile__numberoflists':
            qs = qs.annotate(numberoflists=Sum('lists'))
            key = 'numberoflists'
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        print order_by
        #user table does not support this
        #qs = qs.order_by(*order_by, nulls_last=True)
        qs = qs.order_by(*order_by)
    return qs

@admin_required_json
def findUsers(request):
    '''
        param data {
            query: {
                conditions: [
                    {
                        key: 'user',
                        value: 'something',
                        operator: '='
                    }
                ]
                operator: ","
            },
            sort: [{key: 'username', operator: '+'}],
            range: [0, 100]
            keys: []
        }

        possible query keys:
            username, email, lastLogin, browser
        
        return {
                status: {
                    code: int,
                    text: string
                },
                data: {
                    items: [
                        {name:, user:, featured:, public...}
                    ]
                }
        }
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
            {'query': query, 'positions': []}

            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
            positions:  ids of places for which positions are required
    '''
    response = json_response(status=200, text='ok')
    data = json.loads(request.POST['data'])
    query = parse_query(data, request.user)
    qs = order_query(query['qs'], query['sort'])
    if 'keys' in data:
        qs = qs[query['range'][0]:query['range'][1]]
        response['data']['items'] = [models.user_json(p, data['keys'], request.user) for p in qs]
    elif 'position' in query:
        ids = [i.get_id() for i in qs]
        data['conditions'] = data['conditions'] + {
            'value': data['position'],
            'key': query['sort'][0]['key'],
            'operator': '^'
        }
        query = parse_query(data, request.user)
        qs = order_query(query['qs'], query['sort'])
        if qs.count() > 0:
            response['data']['position'] = utils.get_positions(ids, [qs[0].itemId])[0]
    elif 'positions' in data:
        ids = [i.username for i in qs]
        response['data']['positions'] = utils.get_positions(ids, data['positions'])
    else:
        response['data']['items'] = qs.count()

    return render_to_json_response(response)
actions.register(findUsers)


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
    keys = re.sub('([^\\\\])\.', '\\1\n', data.keys()[0]).split('\n')
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
            keys = re.sub('([^\\\\])\.', '\\1\n', key).split('\n')
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
            if value == None and keys[0] in p:
                del p[keys[0]]
            else:
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

