# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

import models
from ox.utils import json
from ox.django.decorators import login_required_json
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response

from itemlist.views import get_list_or_404_json
from api.actions import actions

@login_required_json
def tv(request):
    data = json.loads(request.POST['data'])
    list = get_list_or_404_json(data['list'])
    channel, created = models.Channel.objects.get_or_create(list=list)
    response = json_response(status=200, text='created')
    response['data'] = channel.json(request.user)
    return render_to_json_response(response)
actions.register(tv, cache=False)
