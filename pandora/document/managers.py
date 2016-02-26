# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.db.models import Q, Manager

import ox
from oxdjango.query import QuerySet

import entity.managers


def parseCondition(condition, user, item=None):
    '''
    '''
    k = condition.get('key', 'name')
    k = {
        'user': 'user__username',
        'item': 'items__public_id',
    }.get(k, k)
    if not k:
        k = 'name'
    if item and k == 'description':
        item_conditions = condition.copy()
        item_conditions['key'] = 'items__itemproperties__description'
        return parseCondition(condition, user) | parseCondition(item_conditions, user)

    v = condition['value']
    op = condition.get('operator')
    if not op:
        op = '='

    if op.startswith('!'):
        return ~buildCondition(k, op[1:], v)
    else:
        return buildCondition(k, op, v)


def buildCondition(k, op, v):
    if k == 'id':
        v = ox.fromAZ(v)
        return Q(**{k: v})
    if isinstance(v, bool): #featured and public flag
        key = k
    elif k == 'entity':
        entity_key, v = entity.managers.namePredicate(op, v)
        key = 'entities__' + entity_key
    else:
        key = "%s%s" % (k, {
            '==': '__iexact',
            '^': '__istartswith',
            '$': '__iendswith',
        }.get(op, '__icontains'))
    key = str(key)
    return Q(**{key: v})


def parseConditions(conditions, operator, user, item=None):
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
                             condition.get('operator', '&'), user, item)
            if q:
                conn.append(q)
            pass
        else:
            conn.append(parseCondition(condition, user, item))
    if conn:
        q = conn[0]
        for c in conn[1:]:
            if operator == '|':
                q = q | c
            else:
                q = q & c
        return q
    return None


class DocumentManager(Manager):

    def get_query_set(self):
        return QuerySet(self.model)

    def find(self, data, user, item=None):
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
        query = data.get('query', {})
        conditions = parseConditions(query.get('conditions', []),
                                     query.get('operator', '&'),
                                     user, item)
        if conditions:
            qs = qs.filter(conditions)

        return qs
