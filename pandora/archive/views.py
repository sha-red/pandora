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
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404
from django.template import RequestContext
from django.conf import settings

try:
    import simplejson as json
except ImportError:
    from django.utils import simplejson as json

from oxdjango.decorators import login_required_json
from oxdjango.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from oxdjango.http import HttpFileResponse
import ox

import models

from backend.utils import oxid, parsePath
import backend.models



#@login_required_json
def api_update(request):
    '''
        param data
            {archive: string, files: json}
        return {'status': {'code': int, 'text': string},
                'data': {info: object, rename: object}}
    '''
    data = json.loads(request.POST['data'])
    archive = data['archive']
    folder = data['folder']
    files = data['files']
    needs_data = []
    rename = []
    archive, created = models.Archive.objects.get_or_create(name=archive, user=request.user)
    if archive.editable(request.user):
        print 'editing'
        same_folder = models.FileInstance.objects.filter(folder=folder)
        if same_folder.count() > 0:
            movie = same_folder[0].file.movie
        else:
            movie = None
        for filename in files:
			data = files[filename]
			oshash = data['oshash']
			path = os.path.join(folder, filename)

            instance = models.FileInstance.objects.filter(file__oshash=oshash)
            if instance.count()>0:
                instance = instance[0]
				if path != instance.path: #file was movied
					instance.path = path
					instance.folder = folder
					f.save()
                    print "file movied, so other shit"
            else:
                #look if oshash is known
                f = models.File.objects.filter(oshash=oshash)
                if f.count() > 0:
                    f = f[0]
                    instance = models.FileInstance()
                    instance.file = f
                    instance.path=data['path']
                    instance.folder=folder
                    instance.save()
                    movie = f.movie
                #new oshash, add to database
                else:
                    if not movie:
                        movie_info = parsePath(folder)
                        movie = backend.models.getMovie(movie_info)
                    f = models.File()
                    f.oshash = oshash
                    f.info = data
                    del f.info['oshash']
                    f.name = filename
                    f.movie = movie
                    f.save()
                    instance = models.FileInstance()
                    instance.archive = archive
                    instance.file = f
                    instance.path = path
                    instance.folder = folder
                    instance.save()

        response = json_response({'info': needs_data, 'rename': rename})
	else:
		response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)

@login_required_json
def api_addArchive(request):
    '''
        ARCHIVE API NEEDS CLEANUP
        param data
            {name: string}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    data = json.loads(request.POST['data'])
    try:
        archive = models.Archive.objects.get(name=data['name'])
        response = {'status': {'code': 401, 'text': 'archive with this name exists'}}
    except models.Archive.DoesNotExist:
        archive = models.Archive(name=data['name'])
        archive.user = request.user
        archive.save()
        archive.users.add(request.user)
        response = json_response({})
        response['status']['text'] = 'archive created'
    return render_to_json_response(response)

@login_required_json
def api_editArchive(request):
    '''
        ARCHIVE API NEEDS CLEANUP
        param data
            {id: string, key: value,..}
        return {'status': {'code': int, 'text': string},
                'data': {}}
    '''
    data = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Archive, name=data['name'])
    if item.editable(request.user):
		response = json_response(status=501, text='not implemented')
		item.edit(data)
	else:
		response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)

@login_required_json
def api_removeArchive(request):
    '''
        ARCHIVE API NEEDS CLEANUP
        param data
            string id

        return {'status': {'code': int, 'text': string}}
    '''
    response = json_response({})
    itemId = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Archive, movieId=itemId)
	if item.editable(request.user):
		response = json_response(status=501, text='not implemented')
	else:
		response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)

