# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import os.path
from datetime import datetime

from django import forms
from django.shortcuts import get_object_or_404, redirect
from django.conf import settings
from django.db.models import Count, Sum

from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from ox.django.views import task_status

from item import utils
from item.models import get_item
from item.views import parse_query
import item.tasks
from api.actions import actions

import models
import tasks


@login_required_json
def removeVolume(request):
    data = json.loads(request.POST['data'])
    user = request.user
    try:
        volume = models.Volume.objects.get(user=user, name=data['volume'])
        volume.files.delete()
        volume.delete()
        response = json_response()
    except models.Volume.DoesNotExist:
        response = json_response(status=404, text='volume not found')
    return render_to_json_response(response)
actions.register(removeVolume, cache=False)


@login_required_json
def update(request):
    '''
        2 calls possible:
            volume/files
            info
        call volume/files first and fill in requested info after that

        param data {
            volume: '',
            files: [
                {oshash:, path:, mtime:, },
                ...
            ],
            info: {oshash: object}
        }
        return {
            status: {'code': int, 'text': string},
            data: {
                info: list,
                data: list,
                file: list
            }
        }
    '''
    data = json.loads(request.POST['data'])
    user = request.user
    upload_only = data.get('upload', False)

    response = json_response({'info': [], 'data': [], 'file': []})
    volume = None
    if 'files' in data:
        #update files info async, this takes to long otherwise
        #FIXME: how can client know if update is done? possibly with taksStatus?
        t = tasks.update_files.delay(user.username, data['volume'], data['files'])
        response['data']['taskId'] = t.task_id

        user_profile = user.get_profile()
        user_profile.files_updated = datetime.now()
        user_profile.save()

    if 'info' in data:
        for oshash in data['info']:
            info = data['info'][oshash]
            instance = models.Instance.objects.filter(file__oshash=oshash, volume__user=user)
            if instance.count()>0:
                instance = instance[0]
                if not instance.file.info:
                    for key in ('atime', 'mtime', 'ctime'):
                        if key in info:
                            del info[key]
                    instance.file.info = info
                    instance.file.save()
    if not upload_only:
        files = models.Instance.objects.filter(volume__user=user, file__available=False)
        if volume:
            files = files.filter(volume=volume)
        response['data']['info'] = [f.file.oshash for f in files.filter(file__info='{}')]
        #needs some flag to find those that are actually used main is to generic
        response['data']['data'] = [f.file.oshash for f in files.filter(file__is_video=True,
                                                                        file__is_main=True)]
        response['data']['data'] += [f.file.oshash for f in files.filter(file__is_audio=True,
                                                                         file__is_main=True)]
        response['data']['file'] = [f.file.oshash for f in files.filter(file__is_subtitle=True,
                                                                        name__endswith='.srt')]

    return render_to_json_response(response)
actions.register(update, cache=False)


@login_required_json
def encodingProfile(request):
    response = json_response({'profile': settings.VIDEO_PROFILE})
    return render_to_json_response(response)
actions.register(encodingProfile)


@login_required_json
def upload(request):
    '''
        id: string
        frame: [] //multipart frames
        file: [] //multipart file

        return {
            status: {'code': int, 'text': string},
            data: {
                info: object,
                rename: object
             }
        }
    '''
    response = json_response({})
    f = get_object_or_404_json(models.File, oshash=request.POST['id'])
    if 'frame' in request.FILES:
        if f.frames.count() == 0:
            for frame in request.FILES.getlist('frame'):
                name = frame.name
                #float required?
                position = float(os.path.splitext(name)[0])
                fr, created = models.Frame.objects.get_or_create(file=f, position=position)
                fr.frame.save(name, frame)
        else:
            response = json_response(status=403, text='permissino denied')
    if 'file' in request.FILES:
        if not f.available:
            f.data.save('data.raw', request.FILES['file'])
            f.available = True
            f.save()
            response = json_response(text='file saved')
        else:
            response = json_response(status=403, text='permissino denied')
    return render_to_json_response(response)
actions.register(upload, cache=False)


class VideoChunkForm(forms.Form):
    chunk = forms.FileField()
    chunkId = forms.IntegerField(required=False)
    done = forms.IntegerField(required=False)


@login_required_json
def firefogg_upload(request):
    profile = request.GET['profile']
    oshash = request.GET['id']
    #handle video upload
    if request.method == 'POST':
        #post next chunk
        if 'chunk' in request.FILES and oshash:
            f = get_object_or_404(models.File, oshash=oshash)
            form = VideoChunkForm(request.POST, request.FILES)
            if form.is_valid() and profile == settings.VIDEO_PROFILE and f.editable(request.user):
                c = form.cleaned_data['chunk']
                chunk_id = form.cleaned_data['chunkId']
                response = {
                    'result': 1,
                    'resultUrl': request.build_absolute_uri('/')
                }
                if not f.save_chunk(c, chunk_id):
                    response['result'] = -1
                elif form.cleaned_data['done']:
                    f.available = True
                    f.save()
                    #FIXME: this fails badly if rabbitmq goes down
                    try:
                        t = item.tasks.update_streams.delay(f.item.itemId)
                        response['resultUrl'] = t.task_id
                    except:
                        pass
                    response['result'] = 1
                    response['done'] = 1
                return render_to_json_response(response)
        #init upload
        elif oshash and profile == settings.VIDEO_PROFILE:
            #404 if oshash is not know, files must be registered via update api first
            f = get_object_or_404(models.File, oshash=oshash)
            if f.editable(request.user):
                if f.video:
                    f.video.delete()
                f.available = False
                f.save()
                response = {
                    #is it possible to no hardcode url here?
                    'uploadUrl': request.build_absolute_uri('/api/upload/?id=%s&profile=%s' % (f.oshash, profile)),
                    'result': 1
                }
                return render_to_json_response(response)
    response = json_response(status=400, text='this request requires POST')
    return render_to_json_response(response)


@login_required_json
def taskStatus(request):
    #FIXME: should check if user has permissions to get status
    data = json.loads(request.POST['data'])
    user = request.user
    task_id = data['task_id']
    response = task_status(request, task_id)
    return render_to_json_response(response)
actions.register(taskStatus, cache=False)


@login_required_json
def moveFiles(request):
    '''
        change file / item link
        param data {
            ids: ids of files
            itemId: new itemId
        }

        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    if models.Item.objects.filter(itemId=data['itemId']).count() == 1:
        i = models.Item.objects.get(itemId=data['itemId'])
    else:
        if len(data['itemId']) != 7:
            del data['itemId']
            i = get_item(data)
        else:
            i = get_item({'imdbId': data['itemId']})
    changed = [i.itemId]
    for f in models.File.objects.filter(oshash__in=data['ids']):
        if f.item.id != i.itemId and f.editable(request.user):
            if f.item.itemId not in changed:
                changed.append(f.item.itemId)
            f.item = i 
            f.save()
    for itemId in changed:
        c = models.Item.objects.get(itemId=itemId)
        if c.files.count() == 0:
            c.delete()
        else:
            c.rendered = False
            c.save()
            item.tasks.update_streams.delay(itemId)
    response = json_response(text='updated')
    response['data']['itemId'] = i.itemId
    return render_to_json_response(response)
actions.register(moveFiles, cache=False)


@login_required_json
def editFile(request):
    '''
        change file / item link
        param data {
            id: hash of file
            part:
            id_extra: boolean
        }

        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    #FIXME: permissions, need to be checked
    data = json.loads(request.POST['data'])
    f = get_object_or_404_json(models.File, oshash=data['id'])
    response = json_response()
    if data.keys() != ('id', ):
        for key in data:
            if key in ('is_extra', 'is_subtitle', 'is_video', 'is_version',
                       'part', 'language'):
                setattr(f, key, data[key])
        f.auto = False
        f.save()
    return render_to_json_response(response)
actions.register(editFile, cache=False)


def lookup_file(request, oshash):
    f = get_object_or_404(models.File, oshash=oshash)
    return redirect(f.item.get_absolute_url())


def _order_query(qs, sort, prefix=''):
    order_by = []
    if len(sort) == 1:
        sort.append({'operator': '+', 'key': 'sort_name'})
        sort.append({'operator': '-', 'key': 'created'})
    '''
        if sort[0]['key'] == 'title':
            sort.append({'operator': '-', 'key': 'year'})
            sort.append({'operator': '+', 'key': 'director'})
        elif sort[0]['key'] == 'director':
            sort.append({'operator': '-', 'key': 'year'})
            sort.append({'operator': '+', 'key': 'title'})
        elif sort[0]['key'] == 'year':
            sort.append({'operator': '+', 'key': 'director'})
            sort.append({'operator': '+', 'key': 'title'})
        elif not sort[0]['key'] in ('value', 'value_sort'):
            sort.append({'operator': '+', 'key': 'director'})
            sort.append({'operator': '-', 'key': 'year'})
            sort.append({'operator': '+', 'key': 'title'})

    '''

    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'id': 'item__itemId',
            'users': 'instances__volume__user__username',
            'resolution': 'width',
            'name': 'sort_name'
        }.get(e['key'], e['key'])
        #if operator=='-' and '%s_desc'%key in models.ItemSort.descending_fields:
        #    key = '%s_desc' % key
        order = '%s%s%s' % (operator, prefix, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by)
    return qs


def findFiles(request):
    '''
        param data {
            'query': query,
            'sort': array,
            'range': array
        }

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
            keys:  array of keys to return
            group:    group elements by, country, genre, director...

        with keys, items is list of dicts with requested properties:
          return {'status': {'code': int, 'text': string},
                'data': {items: array}}

Groups
        param data {
            'query': query,
            'key': string,
            'group': string,
            'range': array
        }

            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
            range:       result range, array [from, to]
            keys:  array of keys to return
            group:    group elements by, country, genre, director...

        possible values for keys: name, items

        with keys
        items contains list of {'name': string, 'items': int}:
        return {'status': {'code': int, 'text': string},
            'data': {items: array}}

        without keys: return number of items in given query
          return {'status': {'code': int, 'text': string},
                'data': {items: int}}

Positions
        param data {
            'query': query,
            'positions': []
        }

            query: query object, more on query syntax at
                   https://wiki.0x2620.org/wiki/pandora/QuerySyntax
            positions:  ids of items for which positions are required
        return {
            status: {...},
            data: {
                positions: {
                    id: position
                }
            }
        }
    '''
    data = json.loads(request.POST['data'])
    if settings.JSON_DEBUG:
        print json.dumps(data, indent=2)
    query = parse_query(data, request.user)

    response = json_response({})
    if 'group' in query:
        if 'sort' in query:
            if len(query['sort']) == 1 and query['sort'][0]['key'] == 'items':
                if query['group'] == "year":
                    order_by = query['sort'][0]['operator'] == '-' and 'items' or '-items'
                else:
                    order_by = query['sort'][0]['operator'] == '-' and '-items' or 'items'
                if query['group'] != "keyword":
                    order_by = (order_by, 'value_sort')
                else:
                    order_by = (order_by,)
            else:
                order_by = query['sort'][0]['operator'] == '-' and '-value_sort' or 'value_sort'
                order_by = (order_by, 'items')
        else:
            order_by = ('-value_sort', 'items')
        response['data']['items'] = []
        items = 'items'
        item_qs = query['qs']
        qs = models.Facet.objects.filter(key=query['group']).filter(item__id__in=item_qs)
        qs = qs.values('value').annotate(items=Count('id')).order_by(*order_by)

        if 'positions' in query:
            #FIXME: this does not scale for larger results
            response['data']['positions'] = {}
            ids = [j['value'] for j in qs]
            response['data']['positions'] = utils.get_positions(ids, query['positions'])

        elif 'range' in data:
            qs = qs[query['range'][0]:query['range'][1]]
            response['data']['items'] = [{'name': i['value'], 'items': i[items]} for i in qs]
        else:
            response['data']['items'] = qs.count()
    elif 'positions' in query:
        #FIXME: this does not scale for larger results
        qs = models.File.objects.filter(item__in=query['qs'])
        qs = _order_query(qs, query['sort'])

        response['data']['positions'] = {}
        ids = [j['oshash'] for j in qs.values('oshash')]
        response['data']['positions'] = utils.get_positions(ids, query['positions'])

    elif 'keys' in query:
        response['data']['items'] = []
        qs = models.File.objects.filter(item__in=query['qs'])
        qs = _order_query(qs, query['sort'])
        keys = query['keys']
        qs = qs[query['range'][0]:query['range'][1]]
        response['data']['items'] = [f.json(keys) for f in qs]
    else: # otherwise stats
        items = query['qs']
        files = models.File.objects.filter(item__in=query['qs'])
        response['data']['items'] = files.count()
    return render_to_json_response(response)

actions.register(findFiles)

