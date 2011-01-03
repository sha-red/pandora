# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from datetime import datetime

from django.db.models import Q, Manager

import models


def parseCondition(condition):
    '''
    condition: {
            value: "war"
    }
    or
    condition: {
            key: "year",
            value: "1970-1980,
            operator: "!="
    }
    ...
    '''
    k = condition.get('key', 'all')
    k = {'id': 'itemId'}.get(k, k)
    if not k:
        k = 'all'
    v = condition['value']
    op = condition.get('operator', None)
    if not op:
        op = ''
    if op.startswith('!'):
        op = op[1:]
        exclude = True
    else:
        exclude = False

    key_type = models.site_config['keys'].get(k, {'type':'string'}).get('type')
    key_type = {
        'title': 'string',
        'person': 'string'
    }.get(key_type, key_type)

    if key_type == "string":
        in_find=True
        value_key = 'find__value'
        if k in models.Item.facet_keys:
            in_find = False
            if op == '=':
                v = models.Item.objects.filter(facets__key=k, facets__value=v)
            elif op == '^':
                v = models.Item.objects.filter(facets__key=k, facets__value__istartswith=v)
            elif op == '$':
                v = models.Item.objects.filter(facets__key=k, facets__value__iendswith=v)
            k = 'id__in'
        elif op == '=':
            value_key = 'find__value__iexact'
        elif op == '^':
            v = v[1:]
            value_key = 'find__value__istartswith'
        elif op == '$':
            v = v[:-1]
            value_key = 'find__value__iendswith'
        else: # default
            value_key = 'find__value__icontains'
        k = str(k)
        if exclude:
            if in_find and not k.startswith('itemId'):
                q = ~Q(**{'find__key': k, value_key: v})
            else:
                q = ~Q(**{k: v})
        else:
            if in_find and not k.startswith('itemId'):
                q = Q(**{'find__key': k, value_key: v})
            else:
                q = Q(**{k: v})
        return q
    else: #number or date

        def parseDate(d):
            while len(d) < 3:
                d.append(1)
            return datetime(*[int(i) for i in d])
        if op == '-':
            v1 = v[1]
            v2 = v[2]
            if key_type == "date":
                v1 = parseDate(v1.split('.'))
                v2 = parseDate(v2.split('.'))

            if exclude: #!1960-1970
                k1 = 'value__lt'
                k2 = 'value__gte'
                return Q(**{'find__key': k, k1: v1})|Q(**{'find__key': k, k2: v2})
            else: #1960-1970
                k1 = 'value__gte'
                k2 = 'value__lt'
                return Q(**{'find__key': k, k1: v1})&Q(**{'find__key': k, k2: v2})
        else:
            if key_type == "date":
                v = parseDate(v.split('.'))
            if op == '=':
                vk = 'value__exact'
            elif op == '>':
                vk = 'value__gt'
            elif op == '>=':
                vk = 'value__gte'
            elif op == '<':
                vk = 'value__lt'
            elif op == '<=':
                vk = 'value__lte'
            elif op == '':
                vk = 'value__exact'

            vk = 'find__%s' % vk
            vk = str(vk)

            if exclude: #!1960
                return ~Q(**{'find__key': k, vk: v})
            else: #1960
                return Q(**{'find__key': k, vk: v})


def parseConditions(conditions, operator):
    '''
    conditions: [
        {
            value: "war"
        }
        {
            key: "year",
            value: "1970-1980,
            operator: "!="
        },
        {
            key: "country",
            value: "f",
            operator: "^"
        }
    ],
    operator: "&"
    '''
    conn = []
    for condition in conditions:
        if 'conditions' in condition:
            q = parseConditions(condition['conditions'],
                             condition.get('operator', '&'))
            if q:
                conn.append(q)
            pass
        else:
            if condition.get('value', '') != '' or \
               condition.get('operator', '') == '=':
                conn.append(parseCondition(condition))
    if conn:
        q = conn[0]
        for c in conn[1:]:
            if operator == '|':
                q = q | c
            else:
                q = q & c
        return q
    return None


class ItemManager(Manager):

    def get_query_set(self):
        return super(ItemManager, self).get_query_set()

    def filter_list(self, qs, l, user):
        if l != "all":
            l = l.split(":")
            only_public = True
            if not user.is_anonymous():
                if len(l) == 1:
                    l = [user.username] + l
                if user.username == l[0]:
                    only_public = False
            if len(l) == 2:
                lqs = models.List.objects.filter(name=l[1], user__username=l[0])
                if only_public:
                    lqs = lqs.filter(public=True)
                if lqs.count() == 1:
                    qs = qs.filter(listitem__list__id=lqs[0].id)
        return qs

    def find(self, data, user):
        '''
            query: {
                conditions: [
                    {
                        value: "war"
                    }
                    {
                        key: "year",
                        value: "1970-1980,
                        operator: "!="
                    },
                    {
                        key: "country",
                        value: "f",
                        operator: "^"
                    }
                ],
                operator: "&"
            }
        '''

        #join query with operator
        qs = self.get_query_set()
        #only include items that have hard metadata
        qs = qs.filter(available=True)
        conditions = parseConditions(data['query']['conditions'],
                                     data['query'].get('operator', '&'))
        if conditions:
            qs = qs.filter(conditions)

        #FIXME: lists are part of query now
        # filter list, works for own or public lists
        l = data.get('list', 'all')
        qs = self.filter_list(qs, l, user)
        return qs
