# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import os
import re

import ox
from ox.utils import json
from ox.django.api import actions
from ox.django.decorators import login_required_json
from ox.django.http import HttpFileResponse
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from django.db.models import Count, Q, Sum, Max

from item import utils
import models

def get_text_or_404_json(id):
    id = id.split(':')
    username = id[0]
    textname = ":".join(id[1:])
    return get_object_or_404_json(models.Text, user__username=username, name=textname)

@login_required_json
def addText(request):
    '''
        param data {
            name: value,
        }
        return {
            status: {'code': int, 'text': string},
            data: {
                id:
                name:
                ...
            }
        }
    '''
    data = json.loads(request.POST['data'])
    data['name'] = re.sub(' \[\d+\]$', '', data['name']).strip()
    name = data['name']
    if not name:
        name = "Untitled"
    num = 1
    created = False
    while not created:
        text, created = models.Text.objects.get_or_create(name=name, user=request.user)
        num += 1
        name = data['name'] + ' [%d]' % num
    text.save()

    if text.status == 'featured':
        pos, created = models.Position.objects.get_or_create(text=text,
                                         user=request.user, section='featured')
        qs = models.Position.objects.filter(section='featured')
    else:
        pos, created = models.Position.objects.get_or_create(text=text,
                                         user=request.user, section='personal')
        qs = models.Position.objects.filter(user=request.user, section='personal')
    pos.position = qs.aggregate(Max('position'))['position__max'] + 1
    pos.save()
    response = json_response(status=200, text='created')
    response['data'] = text.json()
    return render_to_json_response(response)
actions.register(addText, cache=False)

def getText(request):
    '''
        param data {
            id: textid
        }
        return {
            id:
            text:
            ...
        }
    '''
    response = json_response()
    data = json.loads(request.POST['data'])
    public_id = data['id']
    if public_id == '':
        qs = models.Text.objects.filter(name='')
        if qs.count() == 0:
            text = models.Text()
            text.name = ''
            text.text = ''
            text.status = 'public'
            text.user = request.user
        else:
            text = qs[0]
    else:
        text = get_text_or_404_json(data['id'])
    response['data'] = text.json()
    return render_to_json_response(response)
actions.register(getText)


@login_required_json
def editText(request):
    '''
        param data {
            id:
            text:
            public: boolean
        }
        return {
            id:
            text:
            ...
        }
    '''
    response = json_response()
    data = json.loads(request.POST['data'])
    if data['id']:
        public_id = data['id'].split(':')
        username = public_id[0]
        name = ":".join(public_id[1:])
        text, created = models.Text.objects.get_or_create(name=name, user=models.User.objects.get(username=username))
        if created:
            text.user = request.user
    else:
        qs = models.Text.objects.filter(name='')
        if qs.count() == 0:
            if request.user.get_profile().capability('canEditFeaturedTexts'):
                text = models.Text(name='', user=request.user)
                text.save()
            else:
                response = json_response(status=403, text='permission denied')
                return render_to_json_response(response)
        else:
            text = qs[0]
    if text.editable(request.user):
        for key in data:
            if key == 'status':
                value = data[key]
                if value not in text._status:
                    value = text._status[0]
                if value == 'private':
                    for user in text.subscribed_users.all():
                        text.subscribed_users.remove(user)
                    qs = models.Position.objects.filter(user=request.user,
                                                        section='section', text=text)
                    if qs.count() > 1:
                        pos = qs[0]
                        pos.section = 'personal'
                        pos.save()
                elif value == 'featured':
                    if request.user.get_profile().capability('canEditFeaturedTexts'):
                        pos, created = models.Position.objects.get_or_create(text=text, user=request.user,
                                                                             section='featured')
                        if created:
                            qs = models.Position.objects.filter(user=request.user, section='featured')
                            pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                            pos.save()
                        models.Position.objects.filter(text=text).exclude(id=pos.id).delete()
                    else:
                        value = text.status
                elif text.status == 'featured' and value == 'public':
                    models.Position.objects.filter(text=text).delete()
                    pos, created = models.Position.objects.get_or_create(text=text,
                                                  user=text.user,section='personal')
                    qs = models.Position.objects.filter(user=text.user,
                                                        section='personal')
                    pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                    pos.save()
                    for u in text.subscribed_users.all():
                        pos, created = models.Position.objects.get_or_create(text=text, user=u,
                                                                             section='public')
                        qs = models.Position.objects.filter(user=u, section='public')
                        pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                        pos.save()

                text.status = value
            elif key == 'name':
                data['name'] = re.sub(' \[\d+\]$', '', data['name']).strip()
                name = data['name']
                if not name:
                    name = "Untitled"
                num = 1
                while models.Text.objects.filter(name=name, user=text.user).exclude(id=text.id).count()>0:
                    num += 1
                    name = data['name'] + ' [%d]' % num
                text.name = name
            elif key == 'description':
                text.description = ox.sanitize_html(data['description'])
            elif key == 'text':
                text.text = ox.sanitize_html(data['text'])

        if 'position' in data:
            pos, created = models.Position.objects.get_or_create(text=text, user=request.user)
            pos.position = data['position']
            pos.section = 'featured'
            if text.status == 'private':
                pos.section = 'personal'
            pos.save()
        if 'type' in data:
            if data['type'] == 'pdf':
                text.type = 'pdf'
            else:
                text.type = 'html'
        if 'posterFrames' in data:
            text.poster_frames = tuple(data['posterFrames'])
            text.update_icon()
        text.save()
        response['data'] = text.json(user=request.user)
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editText, cache=False)


def _order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'subscribed': 'subscribed_users',
            'items': 'numberofitems'
        }.get(e['key'], e['key'])
        order = '%s%s' % (operator, key)
        order_by.append(order)
        if key == 'subscribers':
            qs = qs.annotate(subscribers=Sum('subscribed_users'))
    if order_by:
        qs = qs.order_by(*order_by)
    qs = qs.distinct()
    return qs

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'user', 'operator':'+'}, {'key':'name', 'operator':'+'}]
    for key in ('keys', 'group', 'text', 'range', 'position', 'positions', 'sort'):
        if key in data:
            query[key] = data[key]
    print data
    query['qs'] = models.Text.objects.find(data, user).exclude(name='')
    print query 
    return query


def findTexts(request):
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
            sort: [{key: 'name', operator: '+'}],
            range: [0, 100]
            keys: []
        }

        possible query keys:
            name, user, featured, subscribed

        possible keys:
            name, user, featured, subscribed, query

        }
        return {status: {code: int, text: string},
                data: {
                    items: [
                        {name:, user:, featured:, public...}
                    ]
                }
        }
    '''
    data = json.loads(request.POST['data'])
    query = parse_query(data, request.user)

    #order
    is_section_request = query['sort'] == [{u'operator': u'+', u'key': u'position'}]
    def is_featured_condition(x):
        return x['key'] == 'status' and \
               x['value'] == 'featured' and \
               x['operator'] in ('=', '==')
    is_featured = len(filter(is_featured_condition, data['query'].get('conditions', []))) > 0 

    if is_section_request:
        qs = query['qs']
        if not is_featured and not request.user.is_anonymous():
            qs = qs.filter(position__in=models.Position.objects.filter(user=request.user))
        qs = qs.order_by('position__position')
    else:
        qs = _order_query(query['qs'], query['sort'])

    response = json_response()
    if 'keys' in data:
        qs = qs[query['range'][0]:query['range'][1]]

        response['data']['items'] = [l.json(data['keys'], request.user) for l in qs]
    elif 'position' in data:
        #FIXME: actually implement position requests
        response['data']['position'] = 0
    elif 'positions' in data:
        ids = [i.get_id() for i in qs]
        response['data']['positions'] = utils.get_positions(ids, query['positions'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findTexts)


@login_required_json
def removeText(request):
    '''
        param data {
            id: testId,
        }
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    text = get_text_or_404_json(data['id'])
    response = json_response()
    if text.editable(request.user):
        text.delete()
    else:
        response = json_response(status=403, text='not allowed')
    return render_to_json_response(response)
actions.register(removeText, cache=False)


@login_required_json
def subscribeToText(request):
    '''
        param data {
            id: testId,
        }
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    text = get_text_or_404_json(data['id'])
    user = request.user
    if text.status == 'public' and \
       text.subscribed_users.filter(username=user.username).count() == 0:
        text.subscribed_users.add(user)
        pos, created = models.Position.objects.get_or_create(text=text, user=user, section='public')
        if created:
            qs = models.Position.objects.filter(user=user, section='public')
            pos.position = qs.aggregate(Max('position'))['position__max'] + 1
            pos.save()
    response = json_response()
    return render_to_json_response(response)
actions.register(subscribeToText, cache=False)


@login_required_json
def unsubscribeFromText(request):
    '''
        param data {
            id: testId,
            user: username(only admins)
        }
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    text = get_text_or_404_json(data['id'])
    user = request.user
    text.subscribed_users.remove(user)
    models.Position.objects.filter(text=text, user=user, section='public').delete()
    response = json_response()
    return render_to_json_response(response)
actions.register(unsubscribeFromText, cache=False)


@login_required_json
def sortTexts(request):
    '''
        param data {
            section: 'personal',
            ids: [1,2,4,3]
        }
        known sections: 'personal', 'public', 'featured'
        featured can only be edited by admins
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    position = 0
    section = data['section']
    #ids = list(set(data['ids']))
    ids = data['ids']
    if section == 'featured' and not request.user.get_profile().capability('canEditFeaturedTexts'):
        response = json_response(status=403, text='not allowed')
    else:
        user = request.user
        if section == 'featured':
            for i in ids:
                l = get_text_or_404_json(i)
                qs = models.Position.objects.filter(section=section, text=l)
                if qs.count() > 0:
                    pos = qs[0]
                else:
                    pos = models.Position(text=l, user=user, section=section)
                if pos.position != position:
                    pos.position = position
                    pos.save()
                position += 1
                models.Position.objects.filter(section=section, text=l).exclude(id=pos.id).delete()
        else:
            for i in ids:
                l = get_text_or_404_json(i)
                pos, created = models.Position.objects.get_or_create(text=l,
                                            user=request.user, section=section)
                if pos.position != position:
                    pos.position = position
                    pos.save()
                position += 1

        response = json_response()
    return render_to_json_response(response)
actions.register(sortTexts, cache=False)


def icon(request, id, size=16):
    if not size:
        size = 16

    id = id.split(':')
    username = id[0]
    textname = ":".join(id[1:])
    qs = models.Text.objects.filter(user__username=username, name=textname)
    if qs.count() == 1 and qs[0].accessible(request.user):
        text = qs[0]
        icon = text.get_icon(int(size))
    else:
        icon = os.path.join(settings.STATIC_ROOT, 'jpg/list256.jpg')
    return HttpFileResponse(icon, content_type='image/jpeg')
