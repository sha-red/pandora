# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

import ox
from oxdjango.decorators import login_required_json
from oxdjango.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from oxdjango.api import actions

from . import models


@login_required_json
def getTasks(request, data):
    '''
    get list of tasks
    takes {
        user: ''
    }
    returns {
        [{
            started: 0,
            finished: 0,
            status: 'queued|uploading|processing|finished|failed|cancelled',
            title: '',
            item: 'itemID',
            id: 'taskID'
        }]
    }
    '''
    user = data.get('user', '')
    if user != request.user.username and not request.user.profile.capability('canSeeAllTasks'):
        response = json_response(status=403, text='permission denied')
    else:
        response = json_response(status=200, text='ok')
        response['data']['items'] = models.get_tasks(user)
    return render_to_json_response(response)
actions.register(getTasks, cache=False)

@login_required_json
def cancelTask(request, data):
    response = json_response(status=200, text='ok')
    ids = data['id']
    if not isinstance(ids, list):
        ids = [ids]
    for id in ids:
        task = models.Task.get(id)
        if task.user != request.user and not request.user.profile.capability('canSeeAllTasks'):
            response = json_response(status=403, text='permission denied')
            return render_to_json_response(response)
        else:
            task.cancel()
    return render_to_json_response(response)
actions.register(cancelTask, cache=False)
