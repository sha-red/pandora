# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division


from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

import models
from api.actions import actions


def getNews(request):
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
actions.register(getNews)


@login_required_json
def editNews(request):
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
actions.register(editNews)


def findNews(request):
    '''
    '''
    response = json_response({})
    return render_to_json_response(response)
actions.register(findNews)


def getText(request):
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
actions.register(getText)


@login_required_json
def editText(request):
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
actions.register(editText)


def findText(request):
    '''
    '''
    response = json_response({})
    return render_to_json_response(response)
actions.register(findText)
