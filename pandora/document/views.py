# -*- coding: utf-8 -*-

import os
import re
from glob import glob
import unicodedata

import ox
from ox.utils import json
from oxdjango.api import actions
from oxdjango.decorators import login_required_json
from oxdjango.http import HttpFileResponse
from oxdjango.shortcuts import render_to_json_response, get_object_or_404_json, json_response, HttpErrorJson
from django import forms
from django.conf import settings
from django.db.models import Count, Sum
from django.http import HttpResponse
from django.shortcuts import render

from item import utils
from item.models import Item
from itemlist.models import List
from entity.models import Entity
from archive.chunk import process_chunk
from changelog.models import add_changelog

from . import models
from . import tasks
from . import page_views

def get_document_or_404_json(request, id):
    response = {'status': {'code': 404,
                           'text': 'Document not found'}}
    try:
        document = models.Document.get(id)
    except:
        raise HttpErrorJson(response)
    if not document.access(request.user):
        raise HttpErrorJson(response)
    return document

@login_required_json
def addDocument(request, data):
    '''
    Create new html document
    takes {
        title: string
    }

    or

    Adds one or more documents to one or more items
    takes {
        item: string or [string], // one or more item ids (optional)
        entity: string or [string], // one or more entity ids (optional)
        id: string or [string] // one or more document ids
    }
    notes: either `item` or `entity` must be provided
    returns {}
    see: editDocument, findDocuments, getDocument, removeDocument, sortDocuments
    '''
    response = json_response()
    if 'title' in data:
        doc = models.Document(user=request.user, extension='html')
        doc.data['title'] = data['title']
        doc.save()
        response = json_response(status=200, text='created')
        response['data'] = doc.json(user=request.user)
        add_changelog(request, data, doc.get_id())
    else:
        if 'ids' in data:
            ids = data['ids']
        else:
            ids = [data['id']]
        if 'item' in data:
            if isinstance(data['item'], str):
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
        elif 'entity' in data:
            if isinstance(data['entity'], str):
                entity = Entity.get(data['entity'])
                if entity.editable(request.user):
                    for id in ids:
                        document = models.Document.get(id)
                        entity.add(document)
                    add_changelog(request, data, entity.get_id())
                else:
                    response = json_response(status=403, text='permission denied')
            else:
                for entity in Entity.objects.filter(id__in=map(ox.fromAZ, data['entity'])):
                    if entity.editable(request.user):
                        for id in ids:
                            document = models.Document.get(id)
                            entity.add(document)
                add_changelog(request, data, data['entity'])
        else:
            response = json_response(status=500, text='invalid request')
    return render_to_json_response(response)
actions.register(addDocument, cache=False)

@login_required_json
def editDocument(request, data):
    '''
    Edits data for a document
    takes {
        id: string, // document id

        key: value, // set new data
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
    see: addDocument, findDocuments, getDocument, removeDocument, sortDocuments
    '''
    response = json_response()
    item = 'item' in data and Item.objects.get(public_id=data['item']) or None
    if data['id']:
        if isinstance(data['id'], list):
            add_changelog(request, data)
            t = tasks.bulk_edit.delay(data, request.user.username)
            response['data']['taskId'] = t.task_id
        else:
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
    prefix = 'sort__'
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {
            'description': 'descriptions__description_sort'
                if item else 'description',
            'index': 'items__itemproperties__index',
            #fixme:
            'position': 'id',
            'name': 'title',
        }.get(e['key'], e['key'])
        if key == 'resolution':
            order_by.append('%swidth' % operator)
            order_by.append('%sheight' % operator)
        else:
            if '__' not in key and key not in ('created', 'modified'):
                key = "%s%s" % (prefix, key)
            order = '%s%s' % (operator, key)
            order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    qs = qs.distinct()
    return qs

def _order_by_group(query):
    if 'sort' in query:
        if len(query['sort']) == 1 and query['sort'][0]['key'] == 'items':
            order_by = query['sort'][0]['operator'] == '-' and '-items' or 'items'
            if query['group'] == "year":
                secondary = query['sort'][0]['operator'] == '-' and '-sortvalue' or 'sortvalue'
                order_by = (order_by, secondary)
            elif query['group'] != "keyword":
                order_by = (order_by, 'sortvalue')
            else:
                order_by = (order_by, 'value')
        else:
            order_by = query['sort'][0]['operator'] == '-' and '-sortvalue' or 'sortvalue'
            order_by = (order_by, 'items')
    else:
        order_by = ('-sortvalue', 'items')
    return order_by

def get_item(query):
    for c in query.get('conditions', []):
        if c.get('key') == 'item':
            return c.get('value')
    return None

def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key': 'user', 'operator': '+'}, {'key': 'name', 'operator': '+'}]
    for key in ('keys', 'group', 'file', 'range', 'position', 'positions', 'sort'):
        if key in data:
            query[key] = data[key]
    #print(query.get('sort'), data.get('sort'))
    query['qs'] = models.Document.objects.find(data, user)
    query['item'] = get_item(data.get('query', {}))
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
    if 'group' in query:
        response['data']['items'] = []
        items = 'items'
        document_qs = query['qs']
        order_by = _order_by_group(query)
        qs = models.Facet.objects.filter(key=query['group']).filter(document__id__in=document_qs)
        qs = qs.values('value').annotate(items=Count('id')).order_by(*order_by)

        if 'positions' in query:
            response['data']['positions'] = {}
            ids = [j['value'] for j in qs]
            response['data']['positions'] = utils.get_positions(ids, query['positions'])
        elif 'range' in data:
            qs = qs[query['range'][0]:query['range'][1]]
            response['data']['items'] = [{'name': i['value'], 'items': i[items]} for i in qs]
        else:
            response['data']['items'] = qs.count()
    elif 'keys' in data:
        qs = qs[query['range'][0]:query['range'][1]]

        response['data']['items'] = [l.json(data['keys'], request.user, query['item']) for l in qs]
    elif 'position' in data:
        #FIXME: actually implement position requests
        response['data']['position'] = 0
    elif 'positions' in data:
        ids = list(qs.values_list('id', flat=True))
        response['data']['positions'] = utils.get_positions(ids, query['positions'], decode_id=True)
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
    see: addDocument, editDocument, findDocuments, removeDocument, sortDocuments
    '''
    response = json_response({})
    data['keys'] = data.get('keys', [])
    document = get_document_or_404_json(request, data['id'])
    response['data'] = document.json(keys=data['keys'], user=request.user)
    return render_to_json_response(response)
actions.register(getDocument)

@login_required_json
def removeDocument(request, data):
    '''
    Removes one or more documents, either from an item/entity or from the database
    takes {
        id or ids: string or [string], // one or more document ids
        item: string // item id (optional)
        entity: string // entity id (optional)
    }
    returns {}
    notes: If `item` is present, this removes the documents from that item.
    If `entity` is present, this removes the documents from that entity.
    Otherwise, it removes the documents from the database.
    see: addDocument, editDocument, findDocuments, getDocument, sortDocuments
    '''
    response = json_response()

    if 'ids' in data:
        ids = data['ids']
    else:
        ids = [data['id']]
    item = 'item' in data and Item.objects.get(public_id=data['item']) or None
    entity = 'entity' in data and Entity.objects.get(id=ox.fromAZ(data['entity'])) or None
    if item:
        if item.editable(request.user):
            add_changelog(request, data, item.public_id)
            for id in ids:
                document = models.Document.get(id)
                document.remove(item)
        else:
            response = json_response(status=403, text='not allowed')
    elif entity:
        if entity.editable(request.user):
            add_changelog(request, data, entity.get_id())
            for id in ids:
                document = models.Document.get(id)
                entity.remove(document)
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
    see: addDocument, editDocument, findDocuments, removeDocument, sortDocuments
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
    document = get_document_or_404_json(request, id)
    return HttpFileResponse(document.file.path)

def thumbnail(request, id, size=256, page=None):
    size = int(size)
    document = get_document_or_404_json(request, id)
    if "q" in request.GET and page:
        img = document.highlight_page(page, request.GET["q"], size)
        return HttpResponse(img, content_type="image/jpeg")
    return HttpFileResponse(document.thumbnail(size, page=page))


@login_required_json
def upload(request):
    if 'id' in request.GET:
        file = models.Document.get(request.GET['id'])
    elif 'id' in request.POST:
        file = models.Document.get(request.POST['id'])
    else:
        file = None
        name, extension = request.POST['filename'].rsplit('.', 1)
        extension = extension.lower()
    response = json_response(status=400, text='this request requires POST')
    if 'chunk' in request.FILES:
        if file.editable(request.user):
            response = process_chunk(request, file.save_chunk)
            response['resultUrl'] = file.get_absolute_url()
            # id is used to select document in dialog after upload
            response['id'] = file.get_id()
            return render_to_json_response(response)
    #init upload
    else:
        if not file:
            file = models.Document(user=request.user)
            file.data['title'] = name
            file.extension = extension
            file.uploading = True
            file.save()
        elif file.editable(request.user):
            #replace existing file
            if file.file:
                file.delete_cache()
                file.file.delete()
            file.uploading = True
            name, extension = request.POST['filename'].rsplit('.', 1)
            file.extension = extension
            file.width = -1
            file.pages = -1
            file.save()
        else:
            return render_to_json_response(response)
        add_changelog({
            'user': request.user,
            'action': 'uploadDocument',
        }, {
            'name': name,
            'extension': extension
        }, file.get_id())
        upload_url = '/api/upload/document?id=%s' % file.get_id()
        return render_to_json_response({
            'uploadUrl': upload_url,
            'url': file.get_absolute_url(),
            'result': 1
        })
    return render_to_json_response(response)

def autocompleteDocuments(request, data):
    '''
    Returns autocomplete strings for a given document key and search string
    takes {
        key: string, // document key
        value: string, // search string
        operator: string, // '=', '==', '^', '$'
        query: object, // document query to limit results, see `find`
        range: [int, int] // range of results to return
    }
    returns {
        items: [string, ...] // list of matching strings
    }
    see: autocomplete, autocompleteEntities
    '''
    if 'range' not in data:
        data['range'] = [0, 10]
    op = data.get('operator', '=')

    key = utils.get_by_id(settings.CONFIG['documentKeys'], data['key'])
    order_by = key.get('autocompleteSort', False)
    if order_by:
        for o in order_by:
            if o['operator'] != '-':
                o['operator'] = ''
        order_by = ['%(operator)ssort__%(key)s' % o for o in order_by]
    else:
        order_by = ['-items']

    qs = parse_query({'query': data.get('query', {})}, request.user)['qs']
    response = json_response({})
    response['data']['items'] = []
    '''
    for d in qs:
        value = d.json().get(data['key'])
        add = False
        if value:
            if op == '=' and data['value'] in value:
                add = True
            elif op == '==' and data['value'].lower() == value.lower():
                add = True
            elif op == '^' and value.lower().startswith(data['value'].lower()):
                add = True
        if add and value not in response['data']['items']:
            response['data']['items'].append(value)

    '''

    sort_type = key.get('sortType', key.get('type', 'string'))
    qs = models.Facet.objects.filter(key=data['key'])
    if data['value']:
        value = unicodedata.normalize('NFKD', data['value']).lower()
        if op == '=':
            qs = qs.filter(value__icontains=value)
        elif op == '==':
            qs = qs.filter(value__iexact=value)
        elif op == '^':
            qs = qs.filter(value__istartswith=value)
        elif op == '$':
            qs = qs.filter(value__iendswith=value)
    if 'query' in data:
        document_query = parse_query({'query': data.get('query', {})}, request.user)['qs']
        qs = qs.filter(document__in=document_query)
    qs = qs.values('value').annotate(items=Count('id'))
    qs = qs.order_by(*order_by)
    qs = qs[data['range'][0]:data['range'][1]]
    response = json_response({})
    response['data']['items'] = [i['value'] for i in qs]
    return render_to_json_response(response)
actions.register(autocompleteDocuments)


def document(request, fragment):
    context = {}
    parts = fragment.split('/')
    # FIXME: parse collection urls and return the right metadata for those
    id = parts[0]
    page = None
    crop = None
    if len(parts) == 2:
        rect = parts[1].split(',')
        if len(rect) == 1:
            page = rect[0]
        else:
            crop = rect
    try:
        document = models.Document.objects.filter(id=ox.fromAZ(id)).first()
    except:
        document = None
    if document and document.access(request.user):
        context['title'] = document.data['title']
        if document.data.get('description'):
            context['description'] = document.data['description']
        link = request.build_absolute_uri(document.get_absolute_url())
        public_id = ox.toAZ(document.id)
        preview = '/documents/%s/512p.jpg' % public_id
        if page:
            preview = '/documents/%s/512p%s.jpg' % (public_id, page)
        if crop:
            preview = '/documents/%s/512p%s.jpg' % (public_id, ','.join(crop))
        context['preview'] = request.build_absolute_uri(preview)
        context['url'] = request.build_absolute_uri('/documents/' + fragment)
    context['settings'] = settings
    return render(request, "document.html", context)
