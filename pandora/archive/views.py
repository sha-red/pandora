# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import os.path
from datetime import datetime

from django import forms
from django.shortcuts import get_object_or_404, redirect
from django.conf import settings
from django.db.models import Count

import ox
from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from ox.django.views import task_status

from item import utils
from item.models import get_item, Item
from item.views import parse_query
import item.tasks
from ox.django.api import actions

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
            f = models.File.objects.filter(oshash=oshash)
            if f.count()>0:
                f = f[0]
                if not f.info:
                    for key in ('atime', 'mtime', 'ctime'):
                        if key in info:
                            del info[key]
                    f.info = info
                    f.save()
    if not upload_only:
        files = models.Instance.objects.filter(volume__user=user, file__available=False)
        if volume:
            files = files.filter(volume=volume)
        response['data']['info'] = [f.file.oshash for f in files.filter(file__info='{}')]
        response['data']['data'] = [f.file.oshash for f in files.filter(file__is_video=True,
                                                                        file__available=False,
                                                                        file__wanted=True)]
        response['data']['data'] += [f.file.oshash for f in files.filter(file__is_audio=True,
                                                                         file__available=False,
                                                                         file__wanted=True)]

        if filter(lambda l: l['id'] == 'subtitles', settings.CONFIG['layers']):
            response['data']['file'] = [f.file.oshash
                                        for f in files.filter(file__is_subtitle=True,
                                                              file__available=False,
                                                              path__endswith='.srt')]
        else:
            response['data']['file'] = []
    return render_to_json_response(response)
actions.register(update, cache=False)


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
                if fr.frame:
                    fr.frame.delete()
                fr.frame.save(name, frame)
                os.chmod(fr.frame.path, 0644)
            f.item.select_frame()
            f.item.save()
            item.tasks.update_poster.delay(f.item.itemId)
        else:
            response = json_response(status=403, text='permissino denied')
    if 'file' in request.FILES:
        if not f.available:
            if f.data:
                f.data.delete()
            f.data.save('data.raw', request.FILES['file'])
            f.save()
            os.chmod(f.data.path, 0644)
            item.tasks.load_subtitles.delay(f.item.itemId)
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
def addFile(request):
    '''
        id: oshash
        title: 
        info: {}
        return {
            status: {'code': int, 'text': string},
            data: {
                item: id,
             }
        }
    '''
    response = json_response({})
    data = json.loads(request.POST['data'])
    oshash = data.pop('id')
    if not request.user.get_profile().capability('canUploadVideo'):
        response = json_response(status=403, text='permissino denied')
    elif models.File.objects.filter(oshash=oshash).count() > 0:
        f = models.File.objects.get(oshash=oshash)
        if f.available:
            response['status']['text'] = 'file exists'
        response['data']['item'] = f.item.itemId
        response['data']['itemUrl'] = request.build_absolute_uri('/%s' % f.item.itemId)
    else:
        title = ox.parse_movie_path(os.path.splitext(data['filename'])[0])['title']
        i = Item()
        i.data = {
            'title': title,
            'director': data.get('director', []),
        }
        i.user = request.user
        i.save()
        f = models.File(oshash=oshash, item=i)
        f.path = data.get('filename', 'Untitled')
        f.selected = True
        f.info = data['info']
        f.save()
        response['data']['item'] = i.itemId
        response['data']['itemUrl'] = request.build_absolute_uri('/%s' % i.itemId)
    return render_to_json_response(response)
actions.register(addFile, cache=False)

@login_required_json
def firefogg_upload(request):
    profile = request.GET['profile']
    oshash = request.GET['id']
    config = settings.CONFIG['video']
    video_profile = "%sp.%s" % (max(config['resolutions']), config['formats'][0])

    #handle video upload
    if request.method == 'POST':
        #post next chunk
        if 'chunk' in request.FILES and oshash:
            f = get_object_or_404(models.File, oshash=oshash)
            form = VideoChunkForm(request.POST, request.FILES)
            if form.is_valid() and profile == video_profile and f.editable(request.user):
                c = form.cleaned_data['chunk']
                chunk_id = form.cleaned_data['chunkId']
                response = {
                    'result': 1,
                    'resultUrl': request.build_absolute_uri('/%s'%f.item.itemId)
                }
                if not f.save_chunk(c, chunk_id, form.cleaned_data['done']):
                    response['result'] = -1
                elif form.cleaned_data['done']:
                    f.uploading = False
                    f.save()
                    #FIXME: this fails badly if rabbitmq goes down
                    try:
                        t = tasks.process_stream.delay(f.id)
                        response['resultUrl'] = t.task_id
                    except:
                        pass
                    response['result'] = 1
                    response['done'] = 1
                return render_to_json_response(response)
        #init upload
        elif oshash and profile == video_profile:
            #404 if oshash is not know, files must be registered via update api first
            f = get_object_or_404(models.File, oshash=oshash)
            if f.editable(request.user):
                f.streams.all().delete()
                f.delete_frames()
                f.uploading = True
                f.save()
                if f.item.rendered and f.selected:
                    Item.objects.filter(id=f.item.id).update(rendered=False)
                response = {
                    'uploadUrl': request.build_absolute_uri('/api/upload/?id=%s&profile=%s' % (f.oshash, profile)),
                    'url': request.build_absolute_uri('/%s' % f.item.itemId),
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
    if Item.objects.filter(itemId=data['itemId']).count() == 1:
        i = Item.objects.get(itemId=data['itemId'])
    else:
        data['itemId'] = data['itemId'].strip()
        if len(data['itemId']) != 7:
            del data['itemId']
            if 'director' in data and isinstance(data['director'], basestring):
                if data['director'] == '':
                    data['director'] = []
                else:
                    data['director'] = data['director'].split(', ')
            i = get_item(data, user=request.user)
        else:
            i = get_item({'imdbId': data['itemId']}, user=request.user)
    changed = [i.itemId]
    for f in models.File.objects.filter(oshash__in=data['ids']):
        if f.item.id != i.itemId and f.editable(request.user):
            if f.item.itemId not in changed:
                changed.append(f.item.itemId)
            f.item = i 
            f.save()
    for itemId in changed:
        c = Item.objects.get(itemId=itemId)
        if c.files.count() == 0:
            c.delete()
        else:
            c.rendered = False
            c.save()
            item.tasks.update_timeline.delay(itemId)
    response = json_response(text='updated')
    response['data']['itemId'] = i.itemId
    return render_to_json_response(response)
actions.register(moveFiles, cache=False)

@login_required_json
def editFiles(request):
    '''
        change file / item link
        param data {
            ids: ids of files 
            part:
            language:
            ignore: boolean
        }

        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    files = models.File.objects.filter(oshash__in=data['ids'])
    response = json_response()
    #FIXME: only editable files!
    if True:
        if 'ignore' in data:
            models.Instance.objects.filter(file__in=files).update(ignore=data['ignore'])
            files.update(auto=True)
            #FIXME: is this to slow to run sync?
            for i in Item.objects.filter(files__in=files).distinct():
                i.update_selected()
                i.update_wanted()
            response = json_response(status=200, text='updated')
        updates = {}
        for key in ('part', 'language'):
            if key in data:
                updates[key] = data[key]
        if updates:
            files.update(**updates)
            response = json_response(status=200, text='updated')
    else:
        response = json_response(status=403, text='permissino denied')
    return render_to_json_response(response)
actions.register(editFiles, cache=False)

@login_required_json
def editFile(request):
    '''
        change file / item link
        param data {
            id: hash of file
            part:
            language:
            ignore: boolean
        }

        return {
            status: {'code': int, 'text': string},
            data: {
            }
        }
    '''
    data = json.loads(request.POST['data'])
    f = get_object_or_404_json(models.File, oshash=data['id'])
    response = json_response()
    if f.editable(request.user):
        update = False
        #FIXME: should all instances be ignored?
        if 'ignore' in data:
            f.auto = True
            f.instances.update(ignore=data['ignore'])
            f.save()
            #FIXME: is this to slow to run sync?
            f.item.update_selected()
            f.item.update_wanted()
        for key in ('part', 'language'):
            if key in data:
                setattr(f, key, data[key])
                f.auto = False
                update = True
        if update:
            f.save()
            response = json_response(status=200, text='updated')
    else:
        response = json_response(status=403, text='permissino denied')
    return render_to_json_response(response)
actions.register(editFile, cache=False)

@login_required_json
def removeFiles(request):
    data = json.loads(request.POST['data'])
    response = json_response()
    if request.user.get_profile().get_level() == 'admin':
        qs = models.File.objects.filter(oshash__in=data['ids'], instances__id=None)
        for f in qs:
            if f.item.sort.numberoffiles:
                f.item.sort.numberoffiles -= 1
                f.item.sort.save()
        qs.delete()
    else:
        response = json_response(status=403, text='permissino denied')
    return render_to_json_response(response)
actions.register(removeFiles, cache=False)

def getPath(request):
    '''
        change file / item link
        param data {
            ids: [hash of file]
        }

        return {
            status: {'code': int, 'text': string},
            data: {
                path: {
                    id: path
                }
            }
        }
    '''
    data = json.loads(request.POST['data'])
    response = json_response({'path': {}})
    for f in models.File.objects.filter(oshash__in=data['ids']):
        response['data']['path'][f.oshash] = f.path
    return render_to_json_response(response)
actions.register(getPath, cache=True)

def lookup_file(request, oshash):
    oshash = oshash.replace('/', '')
    f = get_object_or_404(models.File, oshash=oshash)
    return redirect('%s/files' % f.item.get_absolute_url())


def _order_query(qs, sort, prefix=''):
    order_by = []
    if len(sort) == 1:
        sort.append({'operator': '+', 'key': 'path'})
        sort.append({'operator': '-', 'key': 'created'})

    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'id': 'item__itemId',
            'users': 'instances__volume__user__username',
            'resolution': 'width',
            'path': 'sort_path'
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

        possible values for keys: path, items

        with keys
        items contains list of {'path': string, 'items': int}:
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
    if not data.get('sort'):
        data['sort'] = [{'key': 'path', 'operator': '+'}]
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
                    order_by = (order_by, 'sortvalue')
                else:
                    order_by = (order_by,)
            else:
                order_by = query['sort'][0]['operator'] == '-' and '-sortvalue' or 'sortvalue'
                order_by = (order_by, 'items')
        else:
            order_by = ('-sortvalue', 'items')
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
            response['data']['items'] = [{'path': i['value'], 'items': i[items]} for i in qs]
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
        qs = qs.select_related()
        keys = query['keys']
        qs = qs[query['range'][0]:query['range'][1]]
        response['data']['items'] = [f.json(keys) for f in qs]
    else: # otherwise stats
        items = query['qs']
        files = models.File.objects.filter(item__in=query['qs'])
        response['data']['items'] = files.count()
    return render_to_json_response(response)

actions.register(findFiles)

def parsePath(request): #parse path and return info
    '''
        param data {
            path: string
        }
        return {
            status: {'code': int, 'text': string},
            data: {
                imdb: string
            }
        }
    '''
    path = json.loads(request.POST['data'])['path']
    response = json_response(ox.parse_movie_path(path))
    return render_to_json_response(response)
actions.register(parsePath)

def getFileInfo(request):
    '''
        param data {
            id: oshash of stream file
        }
        return {
            status: {'code': int, 'text': string},
            data: {
                item: itemId,
                file: oshash of source file
            }
        }
    '''
    data = json.loads(request.POST['data'])
    f = None
    qs = models.Stream.objects.filter(oshash=data['id'])
    if qs.count() > 0:
        s = qs[0]
        f = s.file
    else:
        qs = models.File.objects.filter(oshash=data['id'])
        if qs.count() > 0:
            f = qs[0]
    response = json_response()
    if f:
        response['data'] = {
            'file': f.oshash,
            'item': f.item.itemId
        }
    return render_to_json_response(response)
actions.register(getFileInfo)

