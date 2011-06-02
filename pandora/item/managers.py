# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from datetime import datetime

from django.db.models import Q, Manager

from itemlist.models import List
import models
from ox.django.query import QuerySet

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
    op = condition.get('operator')
    if not op:
        op = ''
    if op.startswith('!'):
        op = op[1:]
        exclude = True
    else:
        exclude = False

    if op == '-':
        q = parseCondition({'key': k, 'value': v[0], 'operator': '>='}) \
            & parseCondition({'key': k, 'value': v[1], 'operator': '<'})
        if exclude:
            return ~q
        else:
            return q

    key_type = models.site_config()['keys'].get(k, {'type':'string'}).get('type')
    if isinstance(key_type, list):
        key_type = key_type[0]
    key_type = {
        'title': 'string',
        'person': 'string',
        'text': 'string',
        'year': 'string',
        'length': 'string',
        'list': 'list',
        'layer': 'string'
    }.get(key_type, key_type)
    if k == 'list':
        key_type = 'list'

    if key_type == "string":
        in_find=True
        value_key = 'find__value'
        if k in models.Item.facet_keys:
            in_find = False
            if op == '=' or op == '^$':
                v = models.Item.objects.filter(facets__key=k, facets__value=v)
            elif op == '^':
                v = models.Item.objects.filter(facets__key=k, facets__value__istartswith=v)
            elif op == '$':
                v = models.Item.objects.filter(facets__key=k, facets__value__iendswith=v)
            else:
                v = models.Item.objects.filter(facets__key=k, facets__value__icontains=v)
            k = 'id__in'
        elif op == '=' or op == '^$':
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
            if k == 'all':
                q = ~Q(**{value_key: v})
            elif in_find and not k.startswith('itemId'):
                q = ~Q(**{'find__key': k, value_key: v})
            else:
                q = ~Q(**{k: v})
        else:
            if k == 'all':
                q = Q(**{value_key: v})
            elif in_find and not k.startswith('itemId'):
                q = Q(**{'find__key': k, value_key: v})
            else:
                q = Q(**{k: v})
        return q
    elif key_type == 'list':
        q = Q(itemId=False)
        l = v.split("/")
        if len(l) == 2:
            lqs = list(List.objects.filter(name=l[1], user__username=l[0]))
            if len(lqs) == 1:
                l = lqs[0]
                if l.query.get('static', False) == False:
                    data = l.query
                    q = parseConditions(data.get('conditions', []),
                                        data.get('operator', '&'))
                else:
                    q = Q(id__in=l.items.all())
        return q
    else: #number or date

        def parseDate(d):
            while len(d) < 3:
                d.append(1)
            return datetime(*[int(i) for i in d])

        if key_type == "date":
            v = parseDate(v.split('.'))
        if op == '=' or op == '^$':
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
    return Q() 


class ItemManager(Manager):

    def get_query_set(self):
        #return super(ItemManager, self).get_query_set()
        return QuerySet(self.model)

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
                    lqs = lqs.filter(Q(status='public')|Q(status='featured'))
                if lqs.count() == 1:
                    if lqs[0].query:
                        data = lqs[0].query
                        conditions = parseConditions(data['query']['conditions'],
                                                     data['query'].get('operator', '&'))
                        qs = qs.filter(conditions)
                    else:
                        qs = qs.filter(id__in=lqs[0].items.all())
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
        conditions = parseConditions(data.get('query', {}).get('conditions', []),
                                     data.get('query', {}).get('operator', '&'))
        qs = qs.filter(conditions).distinct()
        
        #anonymous can only see public items
        if user.is_anonymous():
            qs = qs.filter(public=True)
        #users can see public items, there own items and items of there groups
        elif not user.is_staff:
            qs = qs.filter(Q(public=True)|Q(user=user)|Q(groups__in=user.groups.all()))
        #admins can see all available items
        return qs
