# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.db.models import Q, Manager
from ox.django.query import QuerySet

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
    }.get(k, k)
    if not k:
        k = 'name'
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
    if k == 'id':
        v = v.split('/')
        if len(v) == 2:
            q = Q(user__username=v[0], name=v[1])
        else:
            q = Q(id__in=[])
        return q
    if isinstance(v, bool): #featured and public flag
        key = k
    elif k in ('lat', 'lng', 'area', 'south', 'west', 'north', 'east', 'matches'):
        if op == '>':
            key = '%s__gt'%k
        elif op == '>=':
            key = '%s__gte'%k
        elif op == '<':
            key = '%s__lt'%k
        elif op == '<=':
            key = '%s__lte'%k
        else: #default is exact match
            key = k
    else:
        if op == '=' or op == '^$':
            key = '%s__iexact'%k
        elif op == '^':
            v = v[1:]
            key = '%s__istartswith'%k
        elif op == '$':
            v = v[:-1]
            key = '%s__iendswith'%k
        else: # default
            key = '%s__icontains'%k

    key = str(key)
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
        
        south=data['area']['south']
        west=data['area']['west']
        north=data['area']['north']
        east=data['area']['east']
        qs = qs.filter(Q(
            Q(Q(south__gt=south)|Q(south__lt=north)|Q(west__gt=west)|Q(west__lt=east)) &
            Q(Q(south__gt=south)|Q(south__lt=north)|Q(west__lt=east)|Q(east__gt=east)) &
            Q(Q(north__gt=south)|Q(north__lt=north)|Q(west__gt=west)|Q(west__lt=east)) &
            Q(Q(north__gt=south)|Q(north__lt=north)|Q(east__gt=west)|Q(east__lt=east))
        ))
        
        conditions = parseConditions(data['query'].get('conditions', []),
                                     data['query'].get('operator', '&'),
                                     user)
        if conditions:
            qs = qs.filter(conditions)
        return qs
