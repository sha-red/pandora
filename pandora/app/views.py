# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.conf import settings
from django.http import HttpResponse

from ox.django.shortcuts import json_response, render_to_json_response
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


def embed(request, id):
    context = RequestContext(request, {'settings': settings})
    return render_to_response('embed.html', context)


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
    if isinstance(data, basestring):
        name = data
    else:
        name = data['name']
    page, created = models.Page.objects.get_or_create(name=name)
    if created:
        page.body = 'Insert text here'
        page.save()
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
actions.register(editPage)

def redirect_url(request, url):
    if request.META['QUERY_STRING']:
        url += "?" + request.META['QUERY_STRING']

    if settings.CONFIG.get('sendReferrer', False):
        return redirect(url)
    else:
        return HttpResponse('<script>document.location.href=%s;</script>'%json.dumps(url))

