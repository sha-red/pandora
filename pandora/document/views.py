# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from ox.utils import json
from ox.django.api import actions
from ox.django.decorators import login_required_json
from ox.django.http import HttpFileResponse
from ox.django.shortcuts import render_to_json_response, get_object_or_404_json, json_response, HttpErrorJson
from django import forms
from django.db.models import Sum

from item import utils
from item.models import Item
from itemlist.models import List
from archive.chunk import process_chunk
from changelog.models import add_changelog

import models

def get_document_or_404_json(id):
    try:
        return models.Document.get(id)
    except models.Document.DoesNotExist:
        response = {'status': {'code': 404,
                               'text': 'Document not found'}}
        raise HttpErrorJson(response)

@login_required_json
def addDocument(request, data):
    '''
    Adds one or more documents to one or more items
    takes {
        item: string or [string], // one or more item ids
        id: string or [string] // one or more document ids
    }
    returns {}
    see: editDocument, findDocument, getDocument, removeDocument, sortDocuments
    '''
    response = json_response()
    if 'ids' in data:
        ids = data['ids']
    else:
        ids = [data['id']]
    if 'item' in data:
        if isinstance(data['item'], basestring):
            item = Item.objects.get(public_id=data['item'])
            if item.editable(request.user):
                for id in ids:
                    document = models.Document.get(id)
                    document.add(item)
                add_changelog(request, data, item.public_id)
            else:
                response = json_response(status=403, text='permission denied')
        else:
            for item in Item.objects.filter(public_id__in=data['item']):
                if item.editable(request.user):
                    for id in ids:
                        document = models.Document.get(id)
                        document.add(item)
            add_changelog(request, data, data['item'])
    return render_to_json_response(response)
actions.register(addDocument, cache=False)

@login_required_json
def editDocument(request, data):
    '''
    Edits data for a document
    takes {
        id: string, // document id
        name: string, // new document name
        description: string // new document description
        item: string // item id (optional)
    }
    returns {
        id: string, // document id
        ... // more document properties
    }
    notes: If `item` is present, this will not edit the global description of
    the document, but its specific description in the context of the given
    item.
    see: addDocument, findDocument, getDocument, removeDocument, sortDocuments
    '''
    response = json_response()
    item = 'item' in data and Item.objects.get(public_id=data['item']) or None
    if data['id']:
        document = models.Document.get(data['id'])
        if document.editable(request.user, item):
            add_changelog(request, data)
            document.edit(data, request.user, item)
            document.save()
            response['data'] = document.json(user=request.user, item=item)
        else:
            response = json_response(status=403, text='permission denied')
    else:
        response = json_response(status=500, text='invalid request')
    return render_to_json_response(response)
actions.register(editDocument, cache=False)


def _order_query(qs, sort, item=None):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'name': 'name_sort',
            'description': 'descriptions__description_sort'
                if item else 'description_sort',
            'dimensions': 'dimensions_sort',
            'index': 'items__itemproperties__index',
        }.get(e['key'], e['key'])
        if key == 'resolution':
            order_by.append('%swidth'%operator)
            order_by.append('%sheight'%operator)
        else:
            order = '%s%s' % (operator, key)
            order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    qs = qs.distinct()
    return qs

def get_item(query):
    for c in query.get('conditions'):
        if c.get('key') == 'item':
            return c.get('value')
    return None

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'user', 'operator':'+'}, {'key':'name', 'operator':'+'}]
    for key in ('keys', 'group', 'file', 'range', 'position', 'positions', 'sort'):
        if key in data:
            query[key] = data[key]
    query['qs'] = models.Document.objects.find(data, user).exclude(name='')
    query['item'] = get_item(data['query'])
    return query


def findDocuments(request, data):
    '''
    Finds documents for a given query
    takes {
        query: object, // query object, see `find`
        sort: [object], // list of sort objects, see `find`
        range: [int, int], // range of results, per current sort order
        keys: [string] // list of keys to return
    }
    returns {
        items: [{ // list of documents
            key: value, // item key and value
            ... // more key/value pairs
        }]
    }
    Notes: Query keys and keys to be returned can be 'extension', 'name',
    'size' and 'user'.
    see: addDocument, editDocument, find, getDocument, removeDocument,
    sortDocuments
    '''
    query = parse_query(data, request.user)

    #order
    qs = _order_query(query['qs'], query['sort'], query['item'])
    response = json_response()
    if 'keys' in data:
        qs = qs[query['range'][0]:query['range'][1]]

        response['data']['items'] = [l.json(data['keys'], request.user, query['item']) for l in qs]
    elif 'position' in data:
        #FIXME: actually implement position requests
        response['data']['position'] = 0
    elif 'positions' in data:
        ids = [i.get_id() for i in qs]
        response['data']['positions'] = utils.get_positions(ids, query['positions'])
    else:
        r = qs.aggregate(
            Sum('size')
        )
        response['data']['items'] = qs.count()
        response['data']['size'] = r['size__sum'] or 0
    return render_to_json_response(response)
actions.register(findDocuments)

def getDocument(request, data):
    '''
    Gets a document by id
    takes {
        id: string, // document id
        keys: [string] // list of properties to return
    }
    returns {
        key: value, // document key and value
        ... // more key/value pairs
    }
    see: addDocument, editDocument, findDocument, removeDocument, sortDocuments
    '''
    response = json_response({})
    data['keys'] = data.get('keys', [])
    document = get_document_or_404_json(data['id'])
    response['data'] = document.json(keys=data['keys'], user=request.user)
    return render_to_json_response(response)
actions.register(getDocument)

@login_required_json
def removeDocument(request, data):
    '''
    Removes one or more documents, either from an item or from the database
    takes {
        id or ids: string or [string], // one or more document ids
        item: string // item id (optional)
    }
    returns {}
    notes: If `item` is present, this removes the documents from that item.
    Otherwise, it removes the documents from the database.
    see: addDocument, editDocument, findDocument, getDocument, sortDocuments
    '''
    response = json_response()

    if 'ids' in data:
        ids = data['ids']
    else:
        ids = [data['id']]
    item = 'item' in data and Item.objects.get(public_id=data['item']) or None
    if item:
        if item.editable(request.user):
            add_changelog(request, data, item.public_id)
            for id in ids:
                document = models.Document.get(id)
                document.remove(item)
        else:
            response = json_response(status=403, text='not allowed')
    else:
        add_changelog(request, data, ids)
        for id in ids:
            document = models.Document.get(id)
            if document.editable(request.user):
                document.delete()
            else:
                response = json_response(status=403, text='not allowed')
                break
    return render_to_json_response(response)
actions.register(removeDocument, cache=False)

@login_required_json
def sortDocuments(request, data):
    '''
    Sets the sort order for the documents associated with a given item
    takes {
        item: string, // item id
        ids: [string] // ordered list of document ids
    }
    returns {}
    see: addDocument, editDocument, findDocument, removeDocument, sortDocuments
    '''
    index = 0
    item = Item.objects.get(public_id=data['item'])
    ids = data['ids']
    if item.editable(request.user):
        for i in ids:
            document = models.Document.get(i)
            models.ItemProperties.objects.filter(item=item, document=document).update(index=index)
            index += 1
        response = json_response()
        add_changelog(request, data, item.public_id)
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(sortDocuments, cache=False)

def file(request, id, name=None):
    document = models.Document.get(id)
    return HttpFileResponse(document.file.path)

def thumbnail(request, id, size=256, page=None):
    size = int(size)
    document = get_document_or_404_json(id)
    return HttpFileResponse(document.thumbnail(size, page=page))

@login_required_json
def upload(request):
    if 'id' in request.GET:
        file = models.Document.get(request.GET['id'])
    else:
        file = None
        extension = request.POST['filename'].split('.')
        name = '.'.join(extension[:-1])
        extension = extension[-1].lower()
    response = json_response(status=400, text='this request requires POST')
    if 'chunk' in request.FILES:
        if file.editable(request.user):
            response = process_chunk(request, file.save_chunk)
            response['resultUrl'] = request.build_absolute_uri(file.get_absolute_url())
            return render_to_json_response(response)
    #init upload
    else:
        if not file:
            created = False
            num = 1
            _name = name
            while not created:
                file, created = models.Document.objects.get_or_create(
                    user=request.user, name=name, extension=extension)
                if not created:
                    num += 1
                    name = _name + ' [%d]' % num
            file.name = name
            file.extension = extension
            file.uploading = True
            file.save()
        else:
            #replace existing file
            file.file.delete()
            file.uploading = True
            file.save()
        upload_url = request.build_absolute_uri('/api/upload/document?id=%s' % file.get_id())
        return render_to_json_response({
            'uploadUrl': upload_url,
            'url': request.build_absolute_uri(file.get_absolute_url()),
            'result': 1
        })
    return render_to_json_response(response)
