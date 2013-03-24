# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from ox.utils import json
from ox.django.api import actions
from ox.django.decorators import login_required_json
from ox.django.http import HttpFileResponse
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from django import forms

from item import utils
import models

def get_file_or_404_json(id):
    username, name, extension = models.File.parse_id(id)
    return get_object_or_404_json(models.File, user__username=username, name=name, extension=extension)

@login_required_json
def editFile(request):
    '''
        takes {
            id: string
            name: string
            description: string
        }
        returns {
            id:
            ...
        }
    '''
    response = json_response()
    data = json.loads(request.POST['data'])
    if data['id']:
        file = models.File.get(data['id'])
        if file.editable(request.user):
            file.edit(data, request.user)
            file.save()
            response['data'] = file.json(user=request.user)
        else:
            response = json_response(status=403, file='permission denied')
    else:
        response = json_response(status=500, file='invalid request')
    return render_to_json_response(response)
actions.register(editFile, cache=False)


def _order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'name': 'name_sort',
            'description': 'description_sort',
        }.get(e['key'], e['key'])
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by)
    qs = qs.distinct()
    return qs

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'user', 'operator':'+'}, {'key':'name', 'operator':'+'}]
    for key in ('keys', 'group', 'file', 'range', 'position', 'positions', 'sort'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.File.objects.find(data, user).exclude(name='')
    return query


def findFiles(request):
    '''
        takes {
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
            name, user, extension, size

        possible keys:
            name, user, extension, size

        }
        returns {
            items: [object]
        }
    '''
    data = json.loads(request.POST['data'])
    query = parse_query(data, request.user)

    #order
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
actions.register(findFiles)

@login_required_json
def removeFile(request):
    '''
        takes {
            id: string,
        }
        returns {
        }
    '''
    data = json.loads(request.POST['data'])
    response = json_response()
    file = models.File.get(data['id'])
    if file.editable(request.user):
        file.delete()
    else:
        response = json_response(status=403, file='not allowed')
    return render_to_json_response(response)
actions.register(removeFile, cache=False)


def file(request, id):
    file = models.File.get(id)
    return HttpFileResponse(file.file.path)

def thumbnail(request, id):
    file = models.File.get(id)
    return HttpFileResponse(file.thumbnail())

class ChunkForm(forms.Form):
    chunk = forms.FileField()
    chunkId = forms.IntegerField(required=False)
    done = forms.IntegerField(required=False)

@login_required_json
def upload(request):
    if 'id' in request.GET:
        file = models.File.get(request.GET['id'])
    else:
        extension = request.POST['filename'].split('.')
        name = '.'.join(extension[:-1])
        extension = extension[-1].lower()
    response = json_response(status=400, text='this request requires POST')
    if 'chunk' in request.FILES:
        form = ChunkForm(request.POST, request.FILES)
        if form.is_valid() and file.editable(request.user):
            c = form.cleaned_data['chunk']
            chunk_id = form.cleaned_data['chunkId']
            response = {
                'result': 1,
                'resultUrl': request.build_absolute_uri(file.get_absolute_url())
            }
            if not file.save_chunk(c, chunk_id, form.cleaned_data['done']):
                response['result'] = -1
            if form.cleaned_data['done']:
                response['done'] = 1
            return render_to_json_response(response)
    #init upload
    else:
        created = False
        num = 1
        _name = name
        while not created:
            file, created = models.File.objects.get_or_create(
                user=request.user, name=name, extension=extension)
            if not created:
                num += 1
                name = _name + ' [%d]' % num
        file.name = name
        file.extension = extension
        file.uploading = True
        file.save()
        upload_url = request.build_absolute_uri('/api/upload/file?id=%s' % file.get_id())
        return render_to_json_response({
            'uploadUrl': upload_url,
            'url': request.build_absolute_uri(file.get_absolute_url()),
            'result': 1
        })
    return render_to_json_response(response)
