from django.shortcuts import render

from oxdjango.shortcuts import render_to_json_response, json_response, get_object_or_404_json
from oxdjango.api import actions
import ox

from item import utils
from changelog.models import add_changelog
from .models import Translation

def locale_json(request, lang):
    locale = {}
    for t in Translation.objects.filter(lang=lang):
        if t.value:
            locale[t.key] = t.value
    return render_to_json_response(locale)

def editTranslation(request, data):
    '''
    Edits translation for a given key and language
    takes {
        key: string, // name key
        lang: string // language i.e. en
        value: string // translated value
    }
    returns {
        id: string, // name id
        key: string // key
        ... // more properties
    }
    see: findTranslations
    '''
    response = json_response()
    if not data['value']:
        Translation.objects.filter(id=ox.fromAZ(data['id'])).delete()
    else:
        trans, created = Translation.objects.get_or_create(id=ox.fromAZ(data['id']))
        trans.value = data['value']
        trans.save()
        response['data'] = trans.json()
    add_changelog(request, data)
    return render_to_json_response(response)
actions.register(editTranslation)


def parse_query(data, user):
    query = {}
    query['range'] = [0, 100]
    query['sort'] = [{'key':'key', 'operator':'+'}]
    for key in ('keys', 'range', 'sort', 'query'):
        if key in data:
            query[key] = data[key]
    query['qs'] = Translation.objects.find(query, user)
    return query

def order_query(qs, sort):
    order_by = []
    for e in sort:
        operator = e['operator']
        if operator != '-':
            operator = ''
        key = {}.get(e['key'], e['key'])
        order = '%s%s' % (operator, key)
        order_by.append(order)
    if order_by:
        qs = qs.order_by(*order_by, nulls_last=True)
    return qs


def findTranslations(request, data):
    '''
    Finds translations for a given query
    takes {
        query: object, // query object, see `find`
        sort: [object], // list of sort objects, see `find`
        range: [int, int], // range of results to return
        keys: [string] // list of properties to return
    }
    returns {
        items: [object] // list of translation objects
    }
    see: editTranslation
    '''
    response = json_response()

    query = parse_query(data, request.user)
    qs = order_query(query['qs'], query['sort'])
    qs = qs.distinct()

    if 'keys' in data:
        qs = qs.select_related()
        qs = qs[query['range'][0]:query['range'][1]]
        response['data']['items'] = [p.json(data['keys'], request.user) for p in qs]
    elif 'position' in query:
        ids = [i.get_id() for i in qs]
        data['conditions'] = data['conditions'] + {
            'value': data['position'],
            'key': query['sort'][0]['key'],
            'operator': '^'
        }
        query = parse_query(data, request.user)
        qs = order_query(query['qs'], query['sort'])
        if qs.count() > 0:
            response['data']['position'] = utils.get_positions(ids, [qs[0].public_id])[0]
    elif 'positions' in data:
        ids = list(qs.values_list('id', flat=True))
        response['data']['positions'] = utils.get_positions(ids, data['positions'], decode_id=True)
    else:
        response['data']['items'] = qs.count()
    return render_to_json_response(response)
actions.register(findTranslations)
