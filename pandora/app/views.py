# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.conf import settings

from ox.django.shortcuts import json_response, render_to_json_response, get_object_or_404_json
from ox.django.decorators import login_required_json

from ox.utils import json

import models

from api.actions import actions


def intro(request):
    context = RequestContext(request, {'settings': settings})
    return render_to_response('intro.html', context)


def index(request):
    context = RequestContext(request, {'settings': settings})
    return render_to_response('index.html', context)


def embed(request):
    context = RequestContext(request, {'settings': settings})
    return render_to_response('embed.html', context)


def timeline(request):
    context = RequestContext(request, {'settings': settings})
    return render_to_response('timeline.html', context)


def getPage(request):
    '''
        param data {
            name: pagename
        }
        return {
            status: ...
            data: {
                name:
                body:
            }
        }
    '''
    data = json.loads(request.POST['data'])
    name = data['name']
    page = get_object_or_404_json(models.Page, name=name)
    response = json_response({'name': page.name, 'body': page.body})
    return render_to_json_response(response)
actions.register(getPage)


@login_required_json
def editPage(request):
    '''
        param data {
            name: pagename
            body: text
        }
        return {
            status: ...
            data: {
                name:
                body:
            }
        }
    '''
    if not request.user.is_staff:
        response = json_response(status=403, text='permission denied')
        return render_to_json_response(response)
    data = json.loads(request.POST['data'])
    page, created = models.Page.objects.get_or_create(name=data['name'])
    page.body = data['body']
    page.save()
    response = json_response({'name': page.name, 'page': page.body})
    return render_to_json_response(response)
actions.register(getPage)


def site_json(request):
    '''
    return render_to_json_response(siteJson())
    '''
    siteSettings = {}
    for s in models.SiteSettings.objects.all():
        siteSettings[s.key] = s.value
    context = RequestContext(request, {'settings': settings,
                                       'siteSettings': siteSettings})
    return render_to_response('site.json', context,
                              mimetype="application/javascript")
