# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, print_function, absolute_import

import os
import re
import json

from django.db.models import Max, Sum
from django.db import transaction
from django.conf import settings
from oxdjango.decorators import login_required_json
from oxdjango.shortcuts import render_to_json_response, get_object_or_404_json, json_response
from oxdjango.http import HttpFileResponse
import ox

from . import models
from oxdjango.api import actions
from item import utils
from document.models import Document
from user.tasks import update_numberofcollections
from changelog.models import add_changelog

def get_collection_or_404_json(id):
    id = id.split(':')
    username = id[0]
    collectionname = ":".join(id[1:])
    return get_object_or_404_json(models.Collection, user__username=username, name=collectionname)

def _order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'subscribed': 'subscribed_users',
            'items': 'numberofitems'
        }.get(e['key'], e['key'])
        order = '%s%s' % (operator, key)
        order_by.append(order)
        if key == 'subscribers':
            qs = qs.annotate(subscribers=Sum('subscribed_users'))
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    qs = qs.distinct()
    return qs

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key': 'user', 'operator': '+'}, {'key': 'name', 'operator': '+'}]
    for key in ('keys', 'group', 'collection', 'range', 'position', 'positions', 'sort'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Collection.objects.find(data, user)
    return query


def findCollections(request, data):
    '''
    Finds collections for a given query
    takes {
        query: object, // query object, see `find`
        sort: [], // collection of sort objects, see `find`
        range: [int, int], // range of results to return
        keys: [string] // collection of properties to return
    }
    returns {
        items: [object] // collection of collection objects
    }
    notes: Possible query keys are 'featured', 'name', 'subscribed' and 'user',
    possible keys are 'featured', 'name', 'query', 'subscribed' and 'user'.
    see: addCollection, editCollection, find, getCollection, removeCollection, sortCollections
    '''
    query = parse_query(data, request.user)

    #order
    is_section_request = query['sort'] == [{u'operator': u'+', u'key': u'position'}]

    def is_featured_condition(x):
        return x['key'] == 'status' and \
            x['value'] == 'featured' and \
            x['operator'] in ('=', '==')

    is_featured = any(
        is_featured_condition(x)
        for x in data.get('query', {}).get('conditions', [])
    )

    if is_section_request:
        qs = query['qs']
        if not is_featured and not request.user.is_anonymous():
            qs = qs.filter(position__in=models.Position.objects.filter(user=request.user))
        qs = qs.order_by('position__position')
    else:
        qs = _order_query(query['qs'], query['sort'])

    response = json_response()
    if 'keys' in data:
        qs = qs[query['range'][0]:query['range'][1]]

        response['data']['items'] = [l.json(data['keys'], request.user) for l in qs]
    elif 'position' in data:
        #FIXME: actually implement position requests
        response['data']['position'] = 0
    elif 'positions' in data:
        ids = [i.get_id() for i in qs]
        response['data']['positions'] = utils.get_positions(ids, query['positions'])
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findCollections)

def getCollection(request, data):
    '''
    Gets a collection by id
    takes {
        id: string // collection id
    }
    returns {
        id: string, // collection id
        section: string, // collections section (like 'personal')
        ... // more key/value pairs
    }
    see: addCollection, editCollection, findCollections, removeCollection, sortCollections
    '''
    if 'id' in data:
        response = json_response()
        collection = get_collection_or_404_json(data['id'])
        if collection.accessible(request.user):
            response['data'] = collection.json(user=request.user)
        else:
            response = json_response(status=403, text='not allowed')
    else:
        response = json_response(status=404, text='not found')
    return render_to_json_response(response)
actions.register(getCollection)

@login_required_json
def addCollectionItems(request, data):
    '''
    Adds one or more items to a static collection
    takes {
        collection: string, // collection id
        items: [string], // either collection of item ids
        query: object // or query object, see `find`
    }
    returns {}
    see: find, orderCollectionItems, removeCollectionItems
    '''
    collection = get_collection_or_404_json(data['collection'])
    if 'items' in data:
        if collection.editable(request.user):
            with transaction.atomic():
                items = [ox.fromAZ(id) for id in data['items']]
                for item in Document.objects.filter(id__in=items):
                    collection.add(item)
            response = json_response(status=200, text='items added')
            add_changelog(request, data, data['collection'])
        else:
            response = json_response(status=403, text='not allowed')
    elif 'query' in data:
        response = json_response(status=501, text='not implemented')
    else:
        response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)
actions.register(addCollectionItems, cache=False)


@login_required_json
def removeCollectionItems(request, data):
    '''
    Removes one or more items from a static collection
    takes {
         collection: string, // collection id
         items: [itemId], // either collection of item ids
         query: object // or query object, see `find`
    }
    returns {}
    see: addCollectionItems, find, orderCollectionItems
    '''
    collection = get_collection_or_404_json(data['collection'])
    if 'items' in data:
        if collection.editable(request.user):
            items = [ox.fromAZ(id) for id in data['items']]
            collection.remove(documents=items)
            response = json_response(status=200, text='items removed')
            add_changelog(request, data, data['collection'])
        else:
            response = json_response(status=403, text='not allowed')
    elif 'query' in data:
        response = json_response(status=501, text='not implemented')

    else:
        response = json_response(status=501, text='not implemented')
    return render_to_json_response(response)
actions.register(removeCollectionItems, cache=False)

@login_required_json
def orderCollectionItems(request, data):
    '''
    Sets the manual ordering of items in a given collection
    takes {
       collection: string, // collection id
       ids: [string] // ordered collection of item ids
    }
    returns {}
    notes: There is no UI for this yet.
    see: addCollectionItems, removeCollectionItems
    '''
    collection = get_collection_or_404_json(data['collection'])
    response = json_response()
    if collection.editable(request.user) and collection.type == 'static':
        index = 0
        with transaction.atomic():
            for i in data['ids']:
                models.CollectionItem.objects.filter(collection=collection, item__public_id=i).update(index=index)
                index += 1
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(orderCollectionItems, cache=False)


@login_required_json
def addCollection(request, data):
    '''
    Adds a new collection
    takes {
        name: value, // collection name (optional)
        ... // more key/value pairs
    }
    returns {
        id: string, // collection id
        name: string, // collection name
        ... // more key/value pairs
    }
    notes: Possible keys are 'description', 'items', 'name', 'query', 'sort',
    'type' and 'view'.
    see: editCollection, findCollections, getCollection, removeCollection, sortCollections
    '''
    data['name'] = re.sub(' \[\d+\]$', '', data.get('name', 'Untitled')).strip()
    name = data['name']
    if not name:
        name = "Untitled"
    num = 1
    created = False
    while not created:
        collection, created = models.Collection.objects.get_or_create(name=name, user=request.user)
        num += 1
        name = data['name'] + ' [%d]' % num

    del data['name']
    if data:
        collection.edit(data, request.user)
    else:
        collection.save()
    update_numberofcollections.delay(request.user.username)

    if 'items' in data:
        items = [ox.fromAZ(id) for id in data['items']]
        for item in Document.objects.filter(id__in=items):
            collection.add(item)

    if collection.status == 'featured':
        pos, created = models.Position.objects.get_or_create(collection=collection,
                                         user=request.user, section='featured')
        qs = models.Position.objects.filter(section='featured')
    else:
        pos, created = models.Position.objects.get_or_create(collection=collection,
                                         user=request.user, section='personal')
        qs = models.Position.objects.filter(user=request.user, section='personal')
    pos.position = qs.aggregate(Max('position'))['position__max'] + 1
    pos.save()
    response = json_response(status=200, text='created')
    response['data'] = collection.json()
    add_changelog(request, data, collection.get_id())
    return render_to_json_response(response)
actions.register(addCollection, cache=False)


@login_required_json
def editCollection(request, data):
    '''
    Edits a collection
    takes {
        id: string, // collection id
        key: value, // property id and new value
        ... // more key/value pairs
    }
    returns {
        id: string, // collection id
        ... // more key/value pairs
    }
    notes: Possible keys are 'name', 'position', 'posterFrames', 'query' and
    'status'. 'posterFrames' is an array of {item, position}. If you change
    'status', you have to pass 'position' (the position of the collection in its new
    collection folder).
    see: addCollection, findCollections, getCollection, removeCollection, sortCollections
    '''
    collection = get_collection_or_404_json(data['id'])
    if collection.editable(request.user):
        response = json_response()
        collection.edit(data, request.user)
        response['data'] = collection.json(user=request.user)
        add_changelog(request, data)
    else:
        response = json_response(status=403, text='not allowed')
    return render_to_json_response(response)
actions.register(editCollection, cache=False)

@login_required_json
def removeCollection(request, data):
    '''
    Removes a collection
    takes {
        id: string // collection id
    }
    returns {}
    see: addCollection, editCollection, findCollections, getCollection, sortCollections
    '''
    collection = get_collection_or_404_json(data['id'])
    response = json_response()
    if collection.editable(request.user):
        add_changelog(request, data)
        collection.delete()
        update_numberofcollections.delay(request.user.username)
    else:
        response = json_response(status=403, text='not allowed')
    return render_to_json_response(response)
actions.register(removeCollection, cache=False)


@login_required_json
def subscribeToCollection(request, data):
    '''
    Adds a collection to favorites
    takes {
        id: string, // collection id
        user: string // username (admin-only)
    }
    returns {}
    see: unsubscribeFromCollection
    '''
    collection = get_collection_or_404_json(data['id'])
    user = request.user
    if collection.status == 'public' and \
       collection.subscribed_users.filter(username=user.username).count() == 0:
        collection.subscribed_users.add(user)
        pos, created = models.Position.objects.get_or_create(collection=collection, user=user, section='public')
        if created:
            qs = models.Position.objects.filter(user=user, section='public')
            pos.position = qs.aggregate(Max('position'))['position__max'] + 1
            pos.save()
        add_changelog(request, data)
    response = json_response()
    return render_to_json_response(response)
actions.register(subscribeToCollection, cache=False)


@login_required_json
def unsubscribeFromCollection(request, data):
    '''
    Removes a collection from favorites
    takes {
        id: string, // collection id
        user: string // username (admin-only)
    }
    returns {}
    see: subscribeToCollection
    '''
    collection = get_collection_or_404_json(data['id'])
    user = request.user
    collection.subscribed_users.remove(user)
    models.Position.objects.filter(collection=collection, user=user, section='public').delete()
    response = json_response()
    add_changelog(request, data)
    return render_to_json_response(response)
actions.register(unsubscribeFromCollection, cache=False)


@login_required_json
def sortCollections(request, data):
    '''
    Sets the order of collections in a given section
    takes {
        section: string, // collections section
        ids: [string] // ordered collection of collections
    }
    returns {}
    notes: Possible sections are 'personal', 'favorite' and 'featured'. Setting
    the order of featured collections requires the appropriate capability.
    see: addCollection, editCollection, findCollections, getCollection, removeCollection
    '''
    position = 0
    section = data['section']
    section = {
        'favorite': 'public'
    }.get(section, section)
    #ids = collection(set(data['ids']))
    ids = data['ids']
    if section == 'featured' and not request.user.profile.capability('canEditFeaturedCollections'):
        response = json_response(status=403, text='not allowed')
    else:
        user = request.user
        if section == 'featured':
            for i in ids:
                l = get_collection_or_404_json(i)
                qs = models.Position.objects.filter(section=section, collection=l)
                if qs.count() > 0:
                    pos = qs[0]
                else:
                    pos = models.Position(collection=l, user=user, section=section)
                if pos.position != position:
                    pos.position = position
                    pos.save()
                position += 1
                models.Position.objects.filter(section=section, collection=l).exclude(id=pos.id).delete()
        else:
            for i in ids:
                l = get_collection_or_404_json(i)
                pos, created = models.Position.objects.get_or_create(collection=l,
                                            user=request.user, section=section)
                if pos.position != position:
                    pos.position = position
                    pos.save()
                position += 1

        response = json_response()
    return render_to_json_response(response)
actions.register(sortCollections, cache=False)


def icon(request, id, size=16):
    if not size:
        size = 16

    id = id.split(':')
    username = id[0]
    collectionname = ":".join(id[1:])
    qs = models.Collection.objects.filter(user__username=username, name=collectionname)
    if qs.count() == 1 and qs[0].accessible(request.user):
        collection = qs[0]
        icon = collection.get_icon(int(size))
    else:
        icon = os.path.join(settings.STATIC_ROOT, 'jpg/list256.jpg')
    return HttpFileResponse(icon, content_type='image/jpeg')
