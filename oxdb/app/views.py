# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404
from django.template import RequestContext
from django.conf import settings


def index(request):
    context = RequestContext(request, {})
    return render_to_response('index.html', context)

