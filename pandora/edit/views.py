# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

from ox.django.api import actions
import models


@login_required_json
def addClip(request):
    '''
        param data
            {timeline: timelineId,
             item: itemId,
             start: float,
             end: float,
           }
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    data = json.loads(request.POST['data'])
    list = get_object_or_404_json(models.Timeline, pk=data['list'])
    if 'item' in data:
        item = get_object_or_404_json(models.Item, pk=data['item'])
        if list.editable(request.user):
            list.add(item)
            response = json_response(status=200, text='item added')
        else:
            response = json_response(status=403, text='not allowed')
    elif 'query' in data:
        response = json_response(status=501, text='not implemented')

    else:
        response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)
actions.register(addClip, cache=False)


@login_required_json
def removeClip(request):
    '''
        param data
            {timeline: timelineId,
             clip: clipId,
           }
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    data = json.loads(request.POST['data'])
    list = get_object_or_404_json(models.Timeline, pk=data['list'])
    if 'item' in data:
        item = get_object_or_404_json(models.Item, pk=data['item'])
        if list.editable(request.user):
            list.remove(item)
            response = json_response(status=200, text='item removed')
        else:
            response = json_response(status=403, text='not allowed')
    elif 'query' in data:
        response = json_response(status=501, text='not implemented')

    else:
        response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)
actions.register(removeClip, cache=False)


def getTimeline(request):
    '''
        param data
            {name: value, user: user}
        return {
            'status': {'code': int, 'text': string},
            'data': {
                fixme
            }
        }

could be
        timeline: {
            0: {
                itemId:, start, end
            },
            123: {
                itemId:, start, end
            }
        }
or implicit timeline position
        timeline: [
            {
                itemId:, start, end
            },
            {
                itemId:, start, end
            }
        ]

    '''
    response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)
actions.register(getTimeline)


@login_required_json
def addTimeline(request):
    '''
        param data
            {name: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    data = json.loads(request.POST['data'])
    if models.Timeline.filter(name=data['name'], user=request.user).count() == 0:
        list = models.Timeline(name=data['name'], user=request.user)
        list.save()
        response = json_response(status=200, text='created')
    else:
        response = json_response(status=200, text='list already exists')
        response['data']['errors'] = {
            'name': 'List already exists'
        }
    return render_to_json_response(response)
actions.register(addTimeline, cache=False)


@login_required_json
def editTimeline(request):
    '''
        param data
            {key: value}
        keys: name, public
        return {'status': {'code': int, 'text': string},
                'data': {}
        }
    '''
    data = json.loads(request.POST['data'])
    list = get_object_or_404_json(models.Timeline, pk=data['list'])
    if list.editable(request.user):
        for key in data:
            if key in ('name', 'public'):
                setattr(list, key, data['key'])
    else:
        response = json_response(status=403, text='not allowed')
    return render_to_json_response(response)
actions.register(editTimeline, cache=False)


@login_required_json
def removeTimeline(request):
    '''
        param data
            {key: value}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    data = json.loads(request.POST['data'])
    list = get_object_or_404_json(models.Timeline, pk=data['list'])
    if list.editable(request.user):
        list.delete()
    else:
        response = json_response(status=403, text='not allowed')
    return render_to_json_response(response)
actions.register(removeTimeline, cache=False)
