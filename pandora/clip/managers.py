# -*- coding: utf-8 -*-
import unicodedata

from six import string_types
from django.db.models import Q, Manager
from django.conf import settings

from oxdjango.query import QuerySet

from item.utils import decode_id, get_by_id
from oxdjango.managers import get_operator


keymap = {
    'event': 'annotations__events__id',
    'in': 'start',
    'out': 'end',
    'place': 'annotations__places__id',
    'text': 'findvalue',
    'annotations': 'findvalue',
    'user': 'annotations__user__username',
}
case_insensitive_keys = ('annotations__user__username', )
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
    '''
    k = condition.get('key', default_key)
    k = keymap.get(k, k)
    if not k:
        k = default_key
    v = condition['value']
    op = condition.get('operator')
    if not op:
        op = ''
    if get_by_id(settings.CONFIG['layers'], k):
        return parseCondition({'key': 'annotations__layer',
                               'value': k,
                               'operator': '==='}, user) & \
            parseCondition({'key': 'annotations__findvalue',
                            'value': v,
                            'operator': op}, user)

    if op.startswith('!'):
        op = op[1:]
        exclude = True
    else:
        exclude = False
    if op == '-':
        q = parseCondition({'key': k, 'value': v[0], 'operator': '>='}, user) \
            & parseCondition({'key': k, 'value': v[1], 'operator': '<'}, user)
        return exclude and ~q or q
    if (not exclude and op == '=' or op in ('$', '^', '>=', '<')) and v == '':
        return Q()

    if k == 'id':
        public_id, points = v.split('/')
        points = [float('%0.03f' % float(p)) for p in points.split('-')]
        q = Q(item__public_id=public_id, start=points[0], end=points[1])
        return exclude and ~q or q
    elif k.endswith('__id'):
        v = decode_id(v)

    if isinstance(v, bool):
        key = k
    elif k in ('id', ) or k.endswith('__id'):
        key = k + get_operator(op, 'int')
    else:
        key = k + get_operator(op, 'istr' if k in case_insensitive_keys else 'str')
    key = str(key)
    if isinstance(v, string_types) and op != '===':
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
                for conn_ in q:
                    conn.append(conn_)
            pass
        else:
            conn.append(parseCondition(condition, user))
    if conn:
        if operator == '|':
            q = conn[0]
            for c in conn[1:]:
                q = q | c
            return [q]
        else:
            return conn
    return None

def flatten_conditions(conditions):
    conditions_ = []
    for c in conditions:
        if 'conditions' in c:
            conditions_ += flatten_conditions(c['conditions'])
        else:
            conditions_.append(c)
    return conditions_

class ClipManager(Manager):

    def get_query_set(self):
        return QuerySet(self.model)

    def filter_annotations(self, data, user):
        layer_ids = [k['id'] for k in settings.CONFIG['layers']]
        keys = layer_ids + ['annotations', 'text', '*']
        conditions = data.get('query', {}).get('conditions', [])
        conditions = flatten_conditions(conditions)
        conditions = list(filter(lambda c: c.get('key') in keys, conditions))
        operator = data.get('query', {}).get('operator', '&')

        def parse(condition):
            key = 'findvalue' + get_operator(condition.get('operator', ''))
            v = condition['value']
            if isinstance(v, string_types):
                v = unicodedata.normalize('NFKD', v).lower()
            q = Q(**{key: v})
            if condition['key'] in layer_ids:
                q = q & Q(layer=condition['key'])
            return q

        conditions = [parse(c) for c in conditions]
        if conditions:
            # always make an any query,
            # since & is for intersection in clip not intersection in annotation
            if operator == '|' or operator == '&':
                q = conditions[0]
                for c in conditions[1:]:
                    q = q | c
                return [q]
            else:
                return conditions
            return q
        return None

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
        
        conditions = parseConditions(data.get('query', {}).get('conditions', []),
                                     data.get('query', {}).get('operator', '&'),
                                     user)
        if conditions:
            for condition in conditions:
                qs = qs.filter(condition)

        qs = qs.distinct()

        if 'keys' in data:
            layer_ids = [k['id'] for k in settings.CONFIG['layers']]
            for l in list(filter(lambda k: k in layer_ids, data['keys'])):
                qs = qs.filter(**{l: True})
        #anonymous can only see public clips
        if not user or user.is_anonymous():
            allowed_level = settings.CONFIG['capabilities']['canSeeItem']['guest']
            qs = qs.filter(sort__rightslevel__lte=allowed_level)
        #users can see public clips, there own clips and clips of there groups
        else:
            allowed_level = settings.CONFIG['capabilities']['canSeeItem'][user.profile.get_level()]
            q = Q(sort__rightslevel__lte=allowed_level)|Q(user=user.id)
            if user.groups.count():
                q |= Q(item__groups__in=user.groups.all())
            qs = qs.filter(q)
        #admins can see all available clips
        return qs
