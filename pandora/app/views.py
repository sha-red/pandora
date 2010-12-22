# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404
from django.template import RequestContext
from django.conf import settings

from ox.django.shortcuts import json_response, render_to_json_response, get_object_or_404_json

import models

from api.views import html_snapshot
from item.models import siteJson

def intro(request):
    context = RequestContext(request, {'settings':settings})
    return render_to_response('intro.html', context)

def index(request):
    context = RequestContext(request, {'settings':settings})
    if request.GET.get('_escaped_fragment_', None):
        return html_snapshot(request)
    return render_to_response('index.html', context)

def timeline(request):
    context = RequestContext(request, {'settings':settings})
    return render_to_response('timeline.html', context)

def api_getPage(request):
    data = json.loads(request.POST['data'])
    name = data['page']
    page = get_object_or_404_json(models.Archive, name=name)
    response = json_response({'name': page.name, 'body': page.body})
    return render_to_json_response(response)

def site_json(request):
    #return render_to_json_response(siteJson())
    siteSettings = {}
    for s in models.SiteSettings.objects.all():
        siteSettings[s.key] = s.value
    context = RequestContext(request, {'settings':settings, 'siteSettings': siteSettings})
    return render_to_response('site.json', context, mimetype="application/javascript")
