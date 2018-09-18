# -*- coding: utf-8 -*-
from django.db.models import Q, Manager

import ox

from oxdjango.query import QuerySet
from oxdjango.managers import get_operator

keymap = {
    'user': 'user__username',
    'name': 'name_find'
}
case_insensitive_keys = ('user__username',)
default_key = 'name'


def namePredicate(op, value):
    pat = {
        '==': '|%s|',
        '^': '|%s',
        '$': '%s|',
    }.get(op, '%s')

    return ('name_find__contains', pat % value.lower())


def parseCondition(condition, user, item=None):
    '''
    '''
    k = condition.get('key', default_key)
    k = keymap.get(k, k)

    v = condition['value']
    op = condition.get('operator')
    if not op:
        op = '='

    if op.startswith('!'):
        return ~buildCondition(k, op[1:], v)
    else:
        return buildCondition(k, op, v)


def buildCondition(k, op, v):
    find_key = None

    if k == 'id':
        v = ox.fromAZ(v)
        return Q(**{k: v})
    if isinstance(v, bool):
        key = k
    elif k == 'name_find':
        key, v = namePredicate(op, v)
    else:
        if k == '*':
            k = 'find__value'
        elif k not in ('id', 'user__username', 'type'):
            find_key = k
            k = 'find__value'
        key = k + get_operator(op, 'istr' if k in case_insensitive_keys else 'str')
    key = str(key)
    if find_key:
        return Q(**{'find__key': find_key, key: v})
        q = Q(**{'find__key': find_key, key: v})

        # TODO: support more elaborate predicates on link targets?
        # Straw man syntax:
        #   // entities with 'ABC' in friends:
        #   {key: 'link:friends', operator: '==', value: 'ABC'}
        #   // entities whose friends have 'science' in their description
        #   {key: 'link:friends', operator: '~', value: {
        #       key: 'description',
        #       operator: '=',
        #       value: 'science'
        #   }}
        #   // entities listed in PQR's friends
        #   {key: 'backlink:friends', operator: '==', value: 'PQR'}
        # It's a bit tricky without special syntax because at this point we
        # don't know what the matching entity type is.
        if op == '==':
            try:
                v_ = ox.fromAZ(v)
            except:
                pass
            else:
                q |= Q(links__key=find_key, links__target=v_)

        return q
    else:
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


class EntityManager(Manager):

    def get_query_set(self):
        return QuerySet(self.model)

    def find(self, data, user, item=None):
        #join query with operator
        qs = self.get_query_set()
        query = data.get('query', {})
        conditions = parseConditions(query.get('conditions', []),
                                     query.get('operator', '&'),
                                     user, item)
        if conditions:
            qs = qs.filter(conditions).distinct()

        return qs

