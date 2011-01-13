# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from datetime import datetime

from django.db.models import Q, Manager

import models


def parseCondition(condition, user):
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
    k = condition.get('key', 'name')
    k = {
        'user': 'user__username',
        'position': 'position__position',
    }.get(k, k)
    if not k:
        k = 'name'
    v = condition['value']
    op = condition.get('operator', None)
    if not op:
        op = ''
    if op.startswith('!'):
        op = op[1:]
        exclude = True
    else:
        exclude = False
    if k == 'subscribed':
        key = 'subscribed_users__username'
        v = user.username
    elif isinstance(v, bool): #featured and public flag
        key = k
    else:
        if op == '=':
            key = '%s__iexact'%k
        elif op == '^':
            v = v[1:]
            key = '%s__istartswith'%k
        elif op == '$':
            v = v[:-1]
            key = '%s__iendswith'%k
        else: # default
            key = '%s__icontains'%k

    if exclude:
        q = ~Q(**{key: v})
    else:
        q = Q(**{key: v})
    return q

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
            pass
        else:
            if condition.get('value', '') != '' or \
               condition.get('operator', '') == '=':
                conn.append(parseCondition(condition, user))
    if conn:
        q = conn[0]
        for c in conn[1:]:
            if operator == '|':
                q = q | c
            else:
                q = q & c
        return q
    return None


class ListManager(Manager):

    def get_query_set(self):
        return super(ListManager, self).get_query_set()

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
        conditions = parseConditions(data['query'].get('conditions', []),
                                     data['query'].get('operator', '&'),
                                     user)
        if conditions:
            qs = qs.filter(conditions)

        if user.is_anonymous():
            qs = qs.filter(Q(status='public') | Q(status='featured'))
        else:
            qs = qs.filter(Q(status='public') | Q(status='featured') | Q(user=user))
        return qs
