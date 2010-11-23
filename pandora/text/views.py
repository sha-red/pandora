# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Q, Avg, Count, Sum
from django.http import HttpResponse, Http404
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404, redirect
from django.template import RequestContext
from django.conf import settings

from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from ox.django.http import HttpFileResponse
import ox

import models


def api_getNews(request):
    '''
        param data
            string id

        return page
    '''
    response = json_response({})
    itemId = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.News, pk=itemId)
    response['data']['page'] = item.html()
    return render_to_json_response(response)

def api_findNews(request):
    '''
    '''
    response = json_response({})
    return render_to_json_response(response)

def api_getText(request):
    '''
        param data
            string id

        return page
    '''
    response = json_response({})
    itemId = json.loads(request.POST['data'])
    item = get_object_or_404_json(models.Text, pk=itemId)
    response['data']['page'] = item.html()
    return render_to_json_response(response)

def api_findText(request):
    '''
    '''
    response = json_response({})
    return render_to_json_response(response)

