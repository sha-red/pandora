from django.shortcuts import render
import ox

from oxdjango.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from user.decorators import capability_required_json
from oxdjango.api import actions

from . import models


@capability_required_json('canManageHome')
def addHomeItem(request, data):
    '''
    add new home item
    takes {
        type:
        ...
    }
    returns {
        id:
        ...
    }
    '''
    item = models.Item()
    response = json_response()
    if not 'type' in data:
        data['type'] = 'custom'
    if not item.edit(data):
        response = json_response(status=500, text='invalid data')
    else:
        response['data'] = item.json()
    return render_to_json_response(response)
actions.register(addHomeItem, cache=False)

@capability_required_json('canManageHome')
def editHomeItem(request, data):
    '''
    edit home item
    takes {
        id:
        ...
    }
    returns {
        id:
        ...
    }
    '''
    item = get_object_or_404_json(models.Item, id=ox.fromAZ(data['id']))
    response = json_response()
    if not item.edit(data):
        response = json_response(status=500, text='failed to edit item')
    else:
        response['data'] = item.json()
    return render_to_json_response(response)
actions.register(editHomeItem, cache=False)

@capability_required_json('canManageHome')
def removeHomeItem(request, data):
    '''
    remove home item
    takes {
        id:
    }
    returns {
    }
    '''
    item = get_object_or_404_json(models.Item, id=ox.fromAZ(data['id']))
    item.delete()
    response = json_response()
    return render_to_json_response(response)
actions.register(removeHomeItem, cache=False)

@capability_required_json('canManageHome')
def sortHomeItems(request, data):
    '''
    sort home times
    takes {
        ids: []
    }
    returns {
    }
    '''
    response = json_response()
    ids = data['ids']
    index = 0
    for id in ids:
        item = get_object_or_404_json(models.Item, id=ox.fromAZ(id))
        if item.index != index:
            item.index = index
            item.save()
        index += 1
    return render_to_json_response(response)
actions.register(sortHomeItems, cache=False)

def getHomeItems(request, data):
    '''
    takes {
        active: true // if active is set only return active
    }
    returns {
        items: [] 
    }
    '''
    response = json_response()
    qs = models.Item.objects.all().order_by('-active', 'index', 'created')
    if 'active' in data:
        qs = qs.filter(active=data['active'] is True)
    response['data']['items'] = [i.json() for i in qs]
    return render_to_json_response(response)
actions.register(getHomeItems)
