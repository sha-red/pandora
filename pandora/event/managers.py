# -*- coding: utf-8 -*-
import unicodedata

from six import string_types
from django.db.models import Q, Manager

from oxdjango.query import QuerySet
from oxdjango.managers import get_operator
from item.utils import decode_id

keymap = {
    'user': 'user__username',
}
default_key = 'name'

def parseCondition(condition, user):
    k = condition.get('key', default_key)
    k = keymap.get(k, k)
    v = condition['value']
    op = condition.get('operator')
    if not op:
        op = '='
    if op.startswith('!'):
        op = op[1:]
        exclude = True
    else:
        exclude = False
    if k == 'id':
        v = decode_id(v)

    key = k + get_operator(op, 'istr')
    key = str(key)
    if isinstance(v, string_types):
        v = unicodedata.normalize('NFKD', v).lower()
    if exclude:
        q = ~Q(**{k: v})
    else:
        q = Q(**{k: v})
    return q

def parseConditions(conditions, operator, user):
    '''
    conditions: [
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

class EventManager(Manager):

    def get_query_set(self):
        return QuerySet(self.model)

    def find(self, data, user):
        qs = self.get_query_set()
        query = data.get('query', {})
        conditions = parseConditions(query.get('conditions', []),
                                     query.get('operator', '&'),
                                     user)
        if conditions:
            qs = qs.filter(conditions)
        return qs
