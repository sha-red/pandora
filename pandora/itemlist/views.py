# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import os

from django.db.models import Max, Sum
from django.db import transaction
from django.http import HttpResponseForbidden, Http404
from django.conf import settings
from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from ox.django.http import HttpFileResponse


import models
from ox.django.api import actions
from item import utils
from item.models import Item

def get_list_or_404_json(id):
    id = id.split(':')
    username = id[0]
    listname = ":".join(id[1:])
    return get_object_or_404_json(models.List, user__username=username, name=listname)

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
    for key in ('keys', 'group', 'list', 'range', 'position', 'positions', 'sort'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.List.objects.find(data, user)
    return query


def findLists(request):
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
               x['operator'] == '='
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
actions.register(findLists)

@login_required_json
def addListItems(request):
    '''
        param data {
            list: listId,
            items: [itemId],
            query: ...
        }
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    list = get_list_or_404_json(data['list'])
    if 'items' in data:
        if list.editable(request.user):
            with transaction.commit_on_success():
                for item in Item.objects.filter(itemId__in=data['items']):
                    list.add(item)
            response = json_response(status=200, text='items added')
        else:
            response = json_response(status=403, text='not allowed')
    elif 'query' in data:
        response = json_response(status=501, text='not implemented')
    else:
        response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)
actions.register(addListItems, cache=False)


@login_required_json
def removeListItems(request):
    '''
        param data {
             list: listId,
             items: [itemId],
             quert: ...
        }
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    list = get_list_or_404_json(data['list'])
    if 'items' in data:
        if list.editable(request.user):
            list.remove(items=data['items'])
            response = json_response(status=200, text='items removed')
        else:
            response = json_response(status=403, text='not allowed')
    elif 'query' in data:
        response = json_response(status=501, text='not implemented')

    else:
        response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)
actions.register(removeListItems, cache=False)


@login_required_json
def addList(request):
    '''
        param data {
            name: value,
        }
        possible keys to create list:
            name
            description
            type
            query
            items
            view
            sort

        return {
            status: {'code': int, 'text': string},
            data: {
                list:
            }
        }
    '''
    data = json.loads(request.POST['data'])
    name = data['name'].strip()
    if not name:
        name = "Untitled"
    num = 1
    created = False
    while not created:
        list, created = models.List.objects.get_or_create(name=name, user=request.user)
        num += 1
        name = data['name'] + ' [%d]' % num

    if 'query' in data and data['query']:
        setattr(list, 'query', data['query'])
    else:
        setattr(list, 'query', {"static":True})
    if 'type' in data:
        if data['type'] == 'static':
            list.query = {"static":True}
            list.type = 'static'
        else:
            list.type = 'dynamic'
            if list.query.get('static', False):
                 list.query = {}
    if 'status' in data:
        value = data['status']
        if value not in list._status:
            value = list._status[0]
        if value == 'featured' and request.user.get_profile().capability('canEditFeaturedLists'):
            value = list.status
        list.status = value
    if 'description' in data:
        list.description = data['description']
    if 'view' in data:
        list.view = data['view']
    if 'sort' in data:
        list.sort= tuple(data['sort'])
    if 'posterFrames' in data:
        list.poster_frames = tuple(data['posterFrames'])

    list.save()

    if 'items' in data:
        for item in Item.objects.filter(itemId__in=data['items']):
            list.add(item)

    if 'posterFrames' in data:
        list.update_icon()

    if list.status == 'featured':
        pos, created = models.Position.objects.get_or_create(list=list,
                                         user=request.user, section='featured')
        qs = models.Position.objects.filter(section='featured')
    else:
        pos, created = models.Position.objects.get_or_create(list=list,
                                         user=request.user, section='personal')
        qs = models.Position.objects.filter(user=request.user, section='personal')
    pos.position = qs.aggregate(Max('position'))['position__max'] + 1
    pos.save()
    response = json_response(status=200, text='created')
    response['data'] = list.json()
    return render_to_json_response(response)
actions.register(addList, cache=False)


@login_required_json
def editList(request):
    '''
        param data {
            id: listId,
            key: value,
        }
        keys: name, status, query, position, posterFrames
        if you change status you have to provide position of list

        posterFrames:
            array with objects that have item/position
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    list = get_list_or_404_json(data['id'])
    if list.editable(request.user):
        response = json_response()
        for key in data:
            if key == 'query' and not data['query']:
                setattr(list, key, {"static":True})
            elif key == 'query':
                setattr(list, key, data[key])
            elif key == 'type':
                if data[key] == 'static':
                    list.query = {"static":True}
                    list.type = 'static'
                else:
                    list.type = 'dynamic'
                    if list.query.get('static', False):
                         list.query = {}
            elif key == 'status':
                value = data[key]
                if value not in list._status:
                    value = list._status[0]
                if value == 'private':
                    for user in list.subscribed_users.all():
                        list.subscribed_users.remove(user)
                    qs = models.Position.objects.filter(user=request.user,
                                                        section='section', list=list)
                    if qs.count() > 1:
                        pos = qs[0]
                        pos.section = 'personal'
                        pos.save()
                elif value == 'featured':
                    if request.user.get_profile().capability('canEditFeaturedLists'):
                        pos, created = models.Position.objects.get_or_create(list=list, user=request.user,
                                                                             section='featured')
                        if created:
                            qs = models.Position.objects.filter(user=request.user, section='featured')
                            pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                            pos.save()
                        models.Position.objects.filter(list=list).exclude(id=pos.id).delete()
                    else:
                        value = list.status
                elif list.status == 'featured' and value == 'public':
                    models.Position.objects.filter(list=list).delete()
                    pos, created = models.Position.objects.get_or_create(list=list,
                                                  user=list.user,section='personal')
                    qs = models.Position.objects.filter(user=list.user,
                                                        section='personal')
                    pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                    pos.save()
                    for u in list.subscribed_users.all():
                        pos, created = models.Position.objects.get_or_create(list=list, user=u,
                                                                             section='public')
                        qs = models.Position.objects.filter(user=u, section='public')
                        pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                        pos.save()

                list.status = value
            elif key == 'name':
                name = data['name'].strip()
                if not name:
                    name = "Untitled"
                num = 1
                while models.List.objects.filter(name=name, user=list.user).exclude(id=list.id).count()>0:
                    num += 1
                    name = data['name'] + ' (%d)' % num
                list.name = name
            elif key == 'description':
                list.description = data['description']

        if 'position' in data:
            pos, created = models.Position.objects.get_or_create(list=list, user=request.user)
            pos.position = data['position']
            pos.section = 'featured'
            if list.status == 'private':
                pos.section = 'personal'
            pos.save()
        if 'posterFrames' in data:
            list.poster_frames = tuple(data['posterFrames'])
            list.update_icon()
        if 'view' in data:
            list.view = data['view']
        if 'sort' in data:
            list.sort= tuple(data['sort'])
        list.save()
        response['data'] = list.json(user=request.user)
    else:
        response = json_response(status=403, text='not allowed')
    return render_to_json_response(response)
actions.register(editList, cache=False)

@login_required_json
def removeList(request):
    '''
        param data {
            id: listId,
        }
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    list = get_list_or_404_json(data['id'])
    response = json_response()
    if list.editable(request.user):
        list.delete()
    else:
        response = json_response(status=403, text='not allowed')
    return render_to_json_response(response)
actions.register(removeList, cache=False)


@login_required_json
def subscribeToList(request):
    '''
        param data {
            id: listId,
        }
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    list = get_list_or_404_json(data['id'])
    user = request.user
    if list.status == 'public' and \
       list.subscribed_users.filter(username=user.username).count() == 0:
        list.subscribed_users.add(user)
        pos, created = models.Position.objects.get_or_create(list=list, user=user, section='public')
        if created:
            qs = models.Position.objects.filter(user=user, section='public')
            pos.position = qs.aggregate(Max('position'))['position__max'] + 1
            pos.save()
    response = json_response()
    return render_to_json_response(response)
actions.register(subscribeToList, cache=False)


@login_required_json
def unsubscribeFromList(request):
    '''
        param data {
            id: listId,
            user: username(only admins)
        }
        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    list = get_list_or_404_json(data['id'])
    user = request.user
    list.subscribed_users.remove(user)
    models.Position.objects.filter(list=list, user=user, section='public').delete()
    response = json_response()
    return render_to_json_response(response)
actions.register(unsubscribeFromList, cache=False)


@login_required_json
def sortLists(request):
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
    if section == 'featured' and not request.user.get_profile().capability('canEditFeaturedLists'):
        response = json_response(status=403, text='not allowed')
    else:
        user = request.user
        if section == 'featured':
            for i in ids:
                l = get_list_or_404_json(i)
                qs = models.Position.objects.filter(section=section, list=l)
                if qs.count() > 0:
                    pos = qs[0]
                else:
                    pos = models.Position(list=l, user=user, section=section)
                if pos.position != position:
                    pos.position = position
                    pos.save()
                position += 1
                models.Position.objects.filter(section=section, list=l).exclude(id=pos.id).delete()
        else:
            for i in ids:
                l = get_list_or_404_json(i)
                pos, created = models.Position.objects.get_or_create(list=l,
                                            user=request.user, section=section)
                if pos.position != position:
                    pos.position = position
                    pos.save()
                position += 1

        response = json_response()
    return render_to_json_response(response)
actions.register(sortLists, cache=False)


def icon(request, id, size=16):
    if not size:
        size = 16

    id = id.split(':')
    username = id[0]
    listname = ":".join(id[1:])
    qs = models.List.objects.filter(user__username=username, name=listname)
    if qs.count() == 1 and qs[0].accessible(request.user):
        list = qs[0]
        icon = list.get_icon(int(size))
    else:
        icon = os.path.join(settings.STATIC_ROOT, 'jpg/list256.jpg')
    return HttpFileResponse(icon, content_type='image/jpeg')
