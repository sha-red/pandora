# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404
from django.template import RequestContext
from django.conf import settings

from oxdjango.shortcuts import json_response, render_to_json_response, get_object_or_404_json

import models

def index(request):
    context = RequestContext(request, {'settings':settings})
    return render_to_response('index.html', context)

def api_getPage(request):
    data = json.loads(request.POST['data'])
    name = data['page']
    page = get_object_or_404_json(models.Archive, name=name)
    response = json_response({'name': page.name, 'body': page.body})
    return render_to_json_response(response)

    return render_to_response('site.js', context, mimetype="application/javascript")

def site_js(request):
    pages = models.Page.objects.all()
    siteSettings = {}
    for s in models.SiteSettings.objects.all():
        siteSettings[s.key] = s.value
    context = RequestContext(request, {'settings':settings, 'pages': pages, 'siteSettings': siteSettings})
    return render_to_response('site.js', context, mimetype="application/javascript")
