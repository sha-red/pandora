# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from datetime import datetime

from django.db.models import Q, Manager
from django.conf import settings

from itemlist.models import List
import models

from ox.django.query import QuerySet

def parseCondition(condition, user):
    '''
    condition: {
            value: "war"
    }
    or
    condition: {
            key: "year",
            value: [1970, 1980],
            operator: "="
    }
    ...
    '''
    k = condition.get('key', '*')
    k = {'id': 'itemId'}.get(k, k)
    if not k:
        k = '*'
    v = condition['value']
    op = condition.get('operator')
    if not op:
        op = '='
    if op.startswith('!'):
        op = op[1:]
        exclude = True
    else:
        exclude = False

    if isinstance(v, list):
        q = parseCondition({'key': k, 'value': v[0], 'operator': '>='}, user) \
            & parseCondition({'key': k, 'value': v[1], 'operator': '<'}, user)
        if exclude:
            return ~q
        else:
            return q

    if (not exclude and op == '=' or op in ('$', '^')) and v == '':
        return Q(True)

    if k == 'filename' and (user.is_anonymous() or \
        not user.get_profile().capability('canSeeFiles')):
        return Q(id=0)

    key_type = settings.CONFIG['keys'].get(k, {'type':'string'}).get('type')
    if isinstance(key_type, list):
        key_type = key_type[0]
    key_type = {
        'title': 'string',
        'person': 'string',
        'text': 'string',
        'year': 'string',
        'length': 'string',
        'list': 'list',
        'layer': 'string',
    }.get(key_type, key_type)
    if k == 'list':
        key_type = 'list'
    if k in ('isSeries', ):
        key_type = 'bool'

    if k in ('canPlayVideo', 'canPlayClips'):
        level = user.is_anonymous() and 'guest' or user.get_profile().get_level()
        allowed_level = settings.CONFIG['capabilities'][k][level]
        if v:
            q = Q(level__lte=allowed_level)
        else:
            q = Q(level__gt=allowed_level)
        if exclude:
            q = ~q
        return q
    elif key_type == 'bool':
        q = Q(**{'find__key': k, 'find__value': v and '1' or '0'})
        if exclude:
            q = ~q
        return q
    elif key_type == "string":
        in_find = not k.startswith('itemId')
        if in_find:
            value_key = 'find__value'
        else:
            value_key = k
        if k in models.Item.facet_keys + ['title']:
            in_find = False
            facet_value = 'facets__value%s' % {
                '==': '__iexact',
                '>': '__gt',
                '>=': '__gte',
                '<': '__lt',
                '<=': '__lte',
                '^': '__istartswith',
                '$': '__iendswith',
            }.get(op, '__icontains')
            v = models.Item.objects.filter(**{'facets__key':k, facet_value:v})
            value_key = 'id__in'
        else:
            value_key = '%s%s' % (value_key, {
                '==': '__iexact',
                '>': '__gt',
                '>=': '__gte',
                '<': '__lt',
                '<=': '__lte',
                '^': '__istartswith',
                '$': '__iendswith',
            }.get(op, '__icontains'))

        k = str(k)
        value_key = str(value_key)
        if exclude:
            if k == '*':
                q = ~Q(**{value_key: v})
            elif in_find:
                q = ~Q(**{'find__key': k, value_key: v})
            else:
                q = ~Q(**{value_key: v})
        else:
            if k == '*':
                q = Q(**{value_key: v})
            elif in_find:
                q = Q(**{'find__key': k, value_key: v})
            else:
                q = Q(**{value_key: v})
        return q
    elif key_type == 'list':
        q = Q(id=0)
        l = v.split(":")
        if len(l) >= 2:
            l = (l[0], ":".join(l[1:]))
            lqs = list(List.objects.filter(name=l[1], user__username=l[0]))
            if len(lqs) == 1 and lqs[0].accessible(user):
                    l = lqs[0]
                    if l.query.get('static', False) == False:
                        data = l.query
                        q = parseConditions(data.get('conditions', []),
                                            data.get('operator', '&'),
                                            user)
                    else:
                        q = Q(id__in=l.items.all())
                    if exclude:
                        q = ~q
            else:
                q = Q(id=0)
        return q
    else: #number or date

        def parseDate(d):
            while len(d) < 3:
                d.append(1)
            return datetime(*[int(i) for i in d])

        if key_type == "date":
            v = parseDate(v.split('.'))
        else:
            vk = 'value%s' % ({
                '==': '__exact',
                '>': '__gt',
                '>=': '__gte',
                '<': '__lt',
                '<=': '__lte',
                '^': '__istartswith',
                '$': '__iendswith',
            }.get(op,'__exact'))

        vk = str('find__%s' % vk)
        
        if exclude: #!1960
            return ~Q(**{'find__key': k, vk: v})
        else: #1960
            return Q(**{'find__key': k, vk: v})


def parseConditions(conditions, operator, user):
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
                             condition.get('operator', '&'), user)
            if q:
                conn.append(q)
        else:
            conn.append(parseCondition(condition, user))
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
        if l != "*":
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
                                                     data['query'].get('operator', '&'),
                                                     user)
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
        conditions = parseConditions(data.get('query', {}).get('conditions', []),
                                     data.get('query', {}).get('operator', '&'),
                                     user)
        qs = qs.filter(conditions)
        qs = qs.distinct()
        
        #anonymous can only see public items
        if user.is_anonymous():
            allowed_level = settings.CONFIG['capabilities']['canSeeItem']['guest']
            qs = qs.filter(level__lte=allowed_level)
        #users can see public items, there own items and items of there groups
        else:
            allowed_level = settings.CONFIG['capabilities']['canSeeItem'][user.get_profile().get_level()]
            qs = qs.filter(Q(level__lte=allowed_level)|Q(user=user)|Q(groups__in=user.groups.all()))
        #admins can see all available items
        return qs
