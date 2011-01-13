# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

import models
from api.actions import actions


def findAnnotation(request):
    '''
        param data {
            fixme
        }

        return {
            'status': {'code': int, 'text': string}
            'data': {
                annotations = [{..}, {...}, ...]
            }
        }
    '''
    #FIXME: implement findItem like queries
    data = json.loads(request.POST['data'])
    response = json_response(status=200, text='ok')
    qs = models.Annotations.objects.filter(item__itemId=data['item'])
    response['data']['annotations'] = [a.json() for a in qs]
    return render_to_json_response(response)
actions.register(findAnnotation)


@login_required_json
def addAnnotation(request):
    '''
        param data {
            item: itemId,
            layer: layerId,
            start: float,
            end: float,
            value: string
        }
        return {'status': {'code': int, 'text': string},
                'data': {
                    'annotation': {}s
                }
        }
    '''
    data = json.loads(request.POST['data'])
    for key in ('item', 'layer', 'start', 'end', 'value'):
        if key not in data:
            return render_to_json_response(json_response(status=400,
                                                         text='invalid data'))

    item = get_object_or_404_json(models.Item, itemId=data['item'])
    layer = get_object_or_404_json(models.Layer, layerId=data['layer'])

    annotation = models.Annotation(
        item=item,
        layer=layer,
        user=request.user,
        start=float(data['start']), end=float(data['end']),
        value=data['value'])
    annotation.save()
    response = json_response()
    response['data']['annotation'] = annotation.json()
    return render_to_json_response(response)

    response = {'status': {'code': 501, 'text': 'not implemented'}}
    return render_to_json_response(response)
actions.register(addAnnotation, cache=False)


@login_required_json
def removeAnnotation(request):
    '''
        param data {
            id:
        }
        return {'status': {'code': int, 'text': string},
                'data': {
                }
        }
    '''
    response = {'status': {'code': 501, 'text': 'not implemented'}}
    return render_to_json_response(response)
actions.register(removeAnnotation, cache=False)


@login_required_json
def editAnnotation(request):
    '''
        param data {
            id:,
            start: float,
            end: float,
            value: string,
        }
        return {'status': {'code': int, 'text': string},
                'data': {
                }
        }
    '''
    response = json_response({})
    data = json.loads(request.POST['data'])
    layer = get_object_or_404_json(models.Layer, pk=data['id'])
    if layer.editable(request.user):
        response = json_response(status=501, text='not implemented')
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)

    response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)
actions.register(editAnnotation, cache=False)
