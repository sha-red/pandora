# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import random
random.seed()
import re

from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.template import RequestContext, loader
from django.utils import simplejson as json
from django.conf import settings
from django.core.mail import send_mail, BadHeaderError
from django.db.models import Sum
from django.shortcuts import redirect

from ox.django.shortcuts import render_to_json_response, json_response, get_object_or_404_json
from ox.django.decorators import admin_required_json, login_required_json
import ox


from api.actions import actions
from item.models import Access, Item
from item import utils 

import models
import managers


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
    if 'username' in data and 'password' in data:
        data['username'] = data['username'].strip()
        data['password'] = data['password'].strip()
        if models.User.objects.filter(username=data['username']).count() == 0:
            response = json_response({
                'errors': {
                    'username': 'Unknown Username'
                }
            })
        else:
            user = authenticate(username=data['username'], password=data['password'])
            if user is not None:
                if user.is_active:
                    request.session['ui'] = '{}'
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
    if 'username' in data and 'password' in data:
        data['username'] = data['username'].strip()
        data['password'] = data['password'].strip()
        if models.User.objects.filter(username=data['username']).count() > 0:
            response = json_response({
                'errors': {
                    'username': 'Username already exists'
                }
            })
        elif models.User.objects.filter(email=data['email']).count() > 0:
            response = json_response({
                'errors': {
                    'email': 'Email address already exits'
                }
            })
        elif not data['password']:
            response = json_response({
                'errors': {
                    'password': 'Password can not be empty'
                }
            })
        else:
            first_user = models.User.objects.count() == 0
            user = models.User(username=data['username'], email=data['email'])
            user.set_password(data['password'])
            #make first user admin
            user.is_superuser = first_user
            user.is_staff = first_user
            user.save()
            #create default user lists:
            for l in settings.CONFIG['personalLists']:
                list = models.List(name=l['title'], user=user)
                for key in ('query', 'public', 'featured'):
                    if key in l:
                        setattr(list, key, l[key])
                list.save()

            user = authenticate(username=data['username'],
                                password=data['password'])
            login(request, user)
            user_json = models.init_user(user, request)
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
            username: username,
            password: new password
            code: reset code 
        }

        return {
            status: {'code': int, 'text': string}
            data: {
                errors: {
                    code: 'Incorrect Code'
                }
                user {
                }
            }
        }
    '''
    data = json.loads(request.POST['data'])
    if 'code' in data and 'password' in data:
        if not data['password']:
            response = json_response({
                'errors': {
                    'password': 'Password can not be empty'
                }
            })
        else:
            qs = models.UserProfile.objects.filter(reset_code=data['code'])
            if qs.count() == 1:
                user = qs[0].user
                user.set_password(data['password'])
                user.save()
                user_profile = user.get_profile()
                user_profile.reset_code = None
                user_profile.save()
                user = authenticate(username=user.username, password=data['password'])
                login(request, user)

                user_json = models.init_user(user, request)
                response = json_response({
                    'user': user_json
                }, text='password reset')
            else:
                response = json_response({
                    'errors': {
                        'code': 'Incorrect code'
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
            code = ox.to26(random.randint(ox.from26('BAAAAAAAAAAAAAAA'),
                                          ox.from26('BAAAAAAAAAAAAAAAA')))
            if models.UserProfile.objects.filter(reset_code=code).count() == 0:
                break
        user_profile = user.get_profile()
        user_profile.reset_code = code 
        user_profile.save()

        template = loader.get_template('password_reset_email.txt')
        context = RequestContext(request, {
            'code': code,
            'sitename': settings.SITENAME,
            'url': request.build_absolute_uri('/'),
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
        optional keys: username, email, level, notes

        return {
            'status': {'code': int, 'text': string}
            'data': {
            }
        }
    '''
    response = json_response()
    data = json.loads(request.POST['data'])
    user = get_object_or_404_json(models.User, pk=ox.from26(data['id']))
    profile = user.get_profile()
    if 'disabled' in data:
        user.is_active = not data['disabled']
    if 'email' in data:
        if models.User.objects.filter(email=data['email']).exclude(id=user.id).count()>0:
            response = json_response(status=403, text='email already in use')
            return render_to_json_response(response)
        user.email = data['email']
    if 'level' in data:
        profile.set_level(data['level'])
    if 'notes' in data:
        profile.notes = data['notes']
    if 'username' in data:
        if models.User.objects.filter(username=data['username']).exclude(id=user.id).count()>0:
            response = json_response(status=403, text='username already in use')
            return render_to_json_response(response)
        user.username = data['username']
    user.save()
    profile.save()
    response['data'] = user.data.get().json()
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
            value: "foo",
            operator: "=="
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
    query['qs'] = models.SessionData.objects.find(query, user)
    return query

def order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'email': 'user__email',
            'firstseen': 'firstseen',
            'ip': 'ip',
            'lastseen': 'lastseen',
            'screensize': 'screensize',
            'timesseen': 'timesseen',
            'useragent': 'useragent',
            'username': 'username',
            'windowsize': 'windowsize',
            'level': 'level',
        }.get(e['key'], 'user__profile__%s'%e['key'])
        if key == 'user__profile__numberoflists':
            qs = qs.annotate(numberoflists=Sum('user__lists'))
            key = 'numberoflists'
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
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
        response['data']['items'] = [p.json(data['keys'], request.user) for p in qs]
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
        ids = [i.get_id() for i in qs]
        response['data']['positions'] = utils.get_positions(ids, data['positions'])
    else:
        response['data']['items'] = qs.count()
        response['data']['users'] = qs.exclude(user=None).count()
        response['data']['guests'] = response['data']['items'] - response['data']['users']
    return render_to_json_response(response)
actions.register(findUsers)


def contact(request):
    '''
        param data {
            'email': string,
            'subject': string,
            'message': string
        }

        return {
            'status': {'code': int, 'text': string}
        }
    '''
    data = json.loads(request.POST['data'])
    name = data.get('name', '')
    email = data.get('email', '')
    if request.user.is_authenticated():
        if not name:
            name = request.user.username
        if not email:
            email = request.user.email
    if 'message' in data and data['message'].strip():
        email_from = settings.CONFIG['site']['email']['system']
        email_to = [settings.CONFIG['site']['email']['contact'], ]
        subject = data.get('subject', '').strip()
        template = loader.get_template('contact_email.txt')
        context = RequestContext(request, {
            'name': name,
            'email': email,
            'subject': subject,
            'message': data['message'].strip(),
            'sitename': settings.SITENAME,
            'url': request.build_absolute_uri('/'),
        })
        message = template.render(context)
        response = json_response(text='message sent')
        try:
            send_mail(u'[%s Contact] %s' % (settings.SITENAME, subject), message, email_from, email_to)
        except BadHeaderError:
            response = json_response(status=400, text='invalid data')
        if request.user.is_authenticated() \
            and 'receipt' in data \
            and data['receipt']:
            template = loader.get_template('contact_receipt.txt')
            context = RequestContext(request, {
                'name': name,
                'from': email,
                'sitename': settings.SITENAME,
                'to': email_to[0],
                'subject': subject,
                'message': data['message'].strip(),
                'url': request.build_absolute_uri('/'),
            })
            message = template.render(context)
            try:
                send_mail('Fwd: %s' % subject, message, email_from, [email])
            except:
                pass
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
def editPreferences(request):
    '''
        param data {
            key: value
        }
        keys: email, password
        return
    '''
    data = json.loads(request.POST['data'])
    errors = {}
    change = False
    response = json_response()
    if 'email' in data:
        if models.User.objects.filter(
                email=data['email']).exclude(username=request.user.username).count()>0:
            errors['email'] = 'Email address already in use'
        else:
            change = True
            request.user.email = data['email']
    if 'password' in data:
        change = True
        request.user.set_password(data['password'])
    if change:
        request.user.save()
    if errors:
        response = json_response({ 'errors': errors})
    return render_to_json_response(response)
actions.register(editPreferences, cache=False)


def reset_ui(request):
    response = json_response()
    if request.user.is_authenticated():
        profile = request.user.get_profile()
        profile.ui = {}
        profile.save()
    else:
        request.session['ui'] = '{}'
    return redirect('/')

def resetUI(request):
    '''
        reset user ui settings to defaults
        param data {
        }

        return {
            'status': {'code': int, 'text': string}
        }
    '''
    response = json_response()
    if request.user.is_authenticated():
        profile = request.user.get_profile()
        profile.ui = {}
        profile.save()
    else:
        request.session['ui'] = '{}'
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
        ui = profile.ui
    else:
        ui = json.loads(request.session.get('ui', '{}'))
    for key in data:
        keys = re.sub('([^\\\\])\.', '\\1\n', key).split('\n')
        value = data[key]
        p = ui
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
    if request.user.is_authenticated():
        profile.save()
    else:
        request.session['ui'] = json.dumps(ui)

    if data.get('item'):
        item = get_object_or_404_json(Item, itemId=data['item'])
        if request.user.is_authenticated():
            access, created = Access.objects.get_or_create(item=item, user=request.user)
        else:
            access, created = Access.objects.get_or_create(item=item, user=None)
        if not created:
            access.save()

    response = json_response()
    return render_to_json_response(response)
actions.register(setUI, cache=False)

