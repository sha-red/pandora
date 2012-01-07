# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
try:
    import xml.etree.ElementTree as ET
except:
    import elementtree.ElementTree as ET

import copy

from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.conf import settings
from django.http import HttpResponse

from ox.django.shortcuts import json_response, render_to_json_response
from ox.django.decorators import login_required_json

from ox.utils import json

import models

from user.models import init_user

from ox.django.api import actions

def intro(request):
    context = RequestContext(request, {'settings': settings})
    return render_to_response('intro.html', context)


def index(request):
    context = RequestContext(request, {
        'base_url': request.build_absolute_uri('/'),
        'settings': settings
    })
    return render_to_response('index.html', context)


def embed(request, id):
    context = RequestContext(request, {
        'settings': settings
    })
    return render_to_response('embed.html', context)

def opensearch_xml(request):
    osd = ET.Element('OpenSearchDescription')
    osd.attrib['xmlns']="http://a9.com/-/spec/opensearch/1.1/"
    e = ET.SubElement(osd, 'ShortName')
    e.text = settings.SITENAME
    e = ET.SubElement(osd, 'Description')
    e.text = settings.SITENAME
    e = ET.SubElement(osd, 'Image')
    e.attrib['height'] = '16'
    e.attrib['width'] = '16'
    e.attrib['type'] = 'image/x-icon'
    e.text = request.build_absolute_uri('/favicon.ico')
    e = ET.SubElement(osd, 'Url')
    e.attrib['type'] = 'text/html'
    e.attrib['method'] = 'GET'
    e.attrib['template'] = "%s={searchTerms}" % request.build_absolute_uri('/')
    '''
    e = ET.SubElement(osd, 'Url')
    e.attrib['type'] = 'application/x-suggestions+json'
    e.attrib['method'] = 'GET'
    e.attrib['template'] = "%s?q={searchTerms}" % request.build_absolute_uri('/opensearch_suggest')
    '''
    return HttpResponse(
        '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(osd),
        'application/xml'
    )


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
    if request.user.get_profile().capability('canEditSitePages'):
        data = json.loads(request.POST['data'])
        page, created = models.Page.objects.get_or_create(name=data['name'])
        page.body = data['body']
        page.save()
        response = json_response({'name': page.name, 'page': page.body})
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editPage)

def redirect_url(request, url):
    if request.META['QUERY_STRING']:
        url += "?" + request.META['QUERY_STRING']

    if settings.CONFIG.get('sendReferrer', False):
        return redirect(url)
    else:
        return HttpResponse('<script>document.location.href=%s;</script>'%json.dumps(url))

def init(request):
    '''
        return {'status': {'code': int, 'text': string},
                'data': {user: object}}
    '''
    response = json_response({})
    config = copy.deepcopy(settings.CONFIG)
    del config['keys']

    response['data']['site'] = config
    response['data']['user'] = init_user(request.user, request)
    return render_to_json_response(response)
actions.register(init)
