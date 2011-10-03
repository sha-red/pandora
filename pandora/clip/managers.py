# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.db.models import Q, Manager
from django.conf import settings

from ox.django.query import QuerySet
import ox

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
    k = condition.get('key', 'name')
    k = {
        'user': 'annotations__user__username',
        'place': 'annotations__places__id',
        'event': 'annotations__events__id',
        'in': 'start',
        'out': 'end',
        'id': 'public_id',
    }.get(k, k)
    if not k:
        k = 'name'
    v = condition['value']
    op = condition.get('operator')
    if not op:
        op = ''
    public_layers = [l['id']
                     for l in filter(lambda l: not l.get('private', False),
                                     settings.CONFIG['layers'])]
    if k in public_layers:
        return parseCondition({'key': 'annotations__value',
                               'value': v,
                               'operator': op}, user) \
             & parseCondition({'key': 'annotations__layer__name',
                               'value': k,
                               'operator': '=='}, user)

    if op.startswith('!'):
        op = op[1:]
        exclude = True
    else:
        exclude = False
    if op == '-':
        q = parseCondition({'key': k, 'value': v[0], 'operator': '>='}, user) \
            & parseCondition({'key': k, 'value': v[1], 'operator': '<'}, user)
        if exclude:
            return ~q
        else:
            return q
    if k.endswith('__id'):
        v = ox.from26(v)
    if isinstance(v, bool): #featured and public flag
        key = k
    elif k in ('lat', 'lng', 'area', 'south', 'west', 'north', 'east', 'matches',
               'id') or k.endswith('__id'):
        key = "%s%s" % (k, {
            '>': '__gt',
            '>=': '__gte',
            '<': '__lt',
            '<=': '__lte',
        }.get(op, ''))
    else:
        key = "%s%s" % (k, {
            '>': '__gt',
            '>=': '__gte',
            '<': '__lt',
            '<=': '__lte',
            '==': '__iexact',
            '=': '__icontains',
            '^': '__istartswith',
            '$': '__iendswith',
        }.get(op, '__icontains'))

    key = str(key)
    print key, v, exclude
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



class ClipManager(Manager):

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
        
        conditions = parseConditions(data.get('query', {}).get('conditions', []),
                                     data.get('query', {}).get('operator', '&'),
                                     user)
        if conditions:
            qs = qs.filter(conditions)
        if 'keys' in data:
            public_layers = [l['id']
                             for l in filter(lambda l: not l.get('private', False),
                                             settings.CONFIG['layers'])]
            filter_layers = filter(lambda k: k in public_layers, data['keys'])
            if filter_layers:
                qs = qs.filter(annotations__layer__name__in=filter_layers)
        qs = qs.distinct()
        return qs
