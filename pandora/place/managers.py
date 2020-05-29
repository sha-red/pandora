# -*- coding: utf-8 -*-
import unicodedata

from django.db.models import Q, Manager

from item.utils import decode_id
from oxdjango.managers import get_operator
from oxdjango.query import QuerySet

keymap = {
    'user': 'user__username',
}
default_key = 'name'

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
    k = condition.get('key', default_key)
    k = keymap.get(k, k)
    if not k:
        k = default_key
    v = condition['value']
    op = condition.get('operator')
    if not op:
        op = '='
    if op.startswith('!'):
        op = op[1:]
        exclude = True
    else:
        exclude = False
    if isinstance(v, list) and len(v) == 2 and op == '=':
        q = parseCondition({'key': k, 'value': v[0], 'operator': '>='}, user) \
            & parseCondition({'key': k, 'value': v[1], 'operator': '<'}, user)
        if exclude:
            q = ~q
        return q
    if k == 'id':
        v = decode_id(v)
    if isinstance(v, bool):
        key = k
    elif k in ('lat', 'lng', 'area', 'south', 'west', 'north', 'east', 'matches', 'id'):
        key = k + get_operator(op, 'int')
    else:
        key = k + get_operator(op, 'istr')

    key = str(key)
    if isinstance(v, str):
        v = unicodedata.normalize('NFKD', v).lower()

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



class PlaceManager(Manager):

    def get_query_set(self):
        return QuerySet(self.model)

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
        
        query = data.get('query', {})
        conditions = parseConditions(query.get('conditions', []),
                                     query.get('operator', '&'),
                                     user)
        if conditions:
            qs = qs.filter(conditions)
        qs = qs.distinct()
        return qs
