# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import os.path
import re
from datetime import datetime
from urllib2 import unquote
import mimetypes

from django import forms
from django.core.paginator import Paginator
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Q, Avg, Count, Sum
from django.http import HttpResponse, Http404
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404, redirect
from django.template import RequestContext
from django.conf import settings

try:
    import simplejson as json
except ImportError:
    from django.utils import simplejson as json

from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from ox.django.http import HttpFileResponse
from ox.django.views import task_status
import ox

from item.utils import oxid, parse_path
from item.models import get_item
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
actions.register(removeVolume)

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

    files = models.Instance.objects.filter(volume__user=user, file__available=False)
    if volume:
        files = files.filter(volume=volume)
    response['data']['info'] = [f.file.oshash for f in files.filter(file__info='{}')]
    #needs some flag to find those that are actually used main is to generic
    response['data']['data'] = [f.file.oshash for f in files.filter(file__is_video=True, file__is_main=True)]
    response['data']['file'] = [f.file.oshash for f in files.filter(file__is_subtitle=True)]

    return render_to_json_response(response)
actions.register(update)

@login_required_json
def encodingProfile(request):
    response = json_response({'profile': settings.VIDEO_PROFILE})
    return render_to_json_response(response)
actions.register(encodingProfile)

@login_required_json
def upload(request):
    '''
        oshash: string
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
    user = request.user
    f = get_object_or_404_json(models.File, oshash=request.POST['oshash'])
    if 'frame' in request.FILES:
        if f.frames.count() == 0:
            for frame in request.FILES.getlist('frame'):
                name = frame.name
                #float required?
                position = float(os.path.splitext(name)[0])
                fr = models.Frame(file=f, position=position)
                fr.save()
                fr.frame.save(name, frame)
            response = json_response({})
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
actions.register(upload)

class VideoChunkForm(forms.Form):
    chunk = forms.FileField()
    chunkId = forms.IntegerField(required=False)
    done = forms.IntegerField(required=False)

@login_required_json
def firefogg_upload(request):
    profile = request.GET['profile']
    if profile.endswith('.webm'):
        profile = os.path.splitext(profile)[0]
    oshash = request.GET['oshash']
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
                        data['resultUrl'] = t.task_id
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
                    'uploadUrl': request.build_absolute_uri('/api/upload/?oshash=%s&profile=%s' % (f.oshash, profile)),
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
actions.register(taskStatus)

@login_required_json
def editFile(request):
    '''
        change file / item link
        param data {
            oshash: hash of file
            itemId: new itemId
        }

        return {
            status: {'code': int, 'text': string},
            data: {
                imdbId:string
            }
        }
    '''
    #FIXME: permissions, need to be checked
    data = json.loads(request.POST['data'])
    f = get_object_or_404_json(models.File, oshash=data['oshash'])
    response = json_response()
    if f.item.id != data['itemId']:
        if len(data['itemId']) != 7:
            folder = f.instances.all()[0].folder
            item_info = parse_path(folder)
            item = get_item(item_info)
        else:
            item = get_item({'imdbId': data['itemId']})
        f.item = item
        f.save()
        #FIXME: other things might need updating here
        response = json_response(text='updated')
    return render_to_json_response(response)
actions.register(editFile)

def lookup_file(request, oshash):
    f = get_object_or_404(models.File, oshash=oshash)
    return redirect(f.item.get_absolute_url())

"""
def fileInfo(request):
    '''
        param data
            oshash string
        return {'status': {'code': int, 'text': string},
                'data': {imdbId:string }}
    '''
    if 'data' in request.POST:
		oshash = json.loads(request.POST['data'])
	elif 'oshash' in request.GET:
		oshash = request.GET['oshash']
    f = models.ItemFile.objects.get(oshash=oshash)
    response = {'data': f.json()}
    return render_to_json_response(response)
actions.register(fileInfo)

def subtitles(request):
	'''
	param data
		oshash string
		language string
		subtitle string
	return
		if no language is provided:
			{data: {languages: array}}
		if language is set:
			{data: {subtitle: string}}
		if subtitle is set:
			saves subtitle for given language
	'''
    if 'data' in request.POST:
		data = json.loads(request.POST['data'])
		oshash = data['oshash']
		language = data.get('language', None)
		srt = data.get('subtitle', None)
	if srt:
        user = request.user
        sub = models.Subtitles.objects.get_or_create(user, oshash, language)
        sub.srt = srt
        sub.save()
    else:
        response = json_response({})
        if language:
            q = models.Subtitles.objects.filter(item_file__oshash=oshash, language=language)
            if q.count() > 0:
				response['data']['subtitle'] = q[0].srt
				return render_to_json_response(response)
        l = models.Subtitles.objects.filter(item_file__oshash=oshash).values('language')
        response['data']['languages'] = [f['language'] for f in l]
        return render_to_json_response(response)
actions.register(subtitles)
"""
