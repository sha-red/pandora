# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.db.models import Q, Manager

from oxdjango.managers import get_operator
from oxdjango.query import QuerySet
from oxdjango.fields import DictField


keymap = {
    'id': 'item__public_id',
    'filename': 'path',
}
default_key = 'oshash'

def parseCondition(condition, user):
    '''
    '''
    from item.managers import parseConditions as itemParseConditions
    from itemlist.models import List
    from item.models import Item
    from .models import Volume
    k = condition.get('key', default_key)
    k = keymap.get(k, k)
    if not k:
        k = default_key
    v = condition.get('value', '')
    op = condition.get('operator')
    if not op:
        op = '='
    if op.startswith('!'):
        op = op[1:]
        exclude = True
    else:
        exclude = False
    if isinstance(v, bool):
        key = k
    elif k == 'url':
        key = 'info' + get_operator('=', 'istr')
        v = DictField.dumps({'url': v})[1:-1]
    elif k == 'list':
        q = Q(id=0)
        l = v.split(":")
        if len(l) == 1:
            vqs = Volume.objects.filter(name=v, user=user)
            if vqs.count() == 1:
                v = vqs[0]
                q = Q(files__instances__volume__id=v.id)
        elif len(l) >= 2:
            l = (l[0], ":".join(l[1:]))
            lqs = list(List.objects.filter(name=l[1], user__username=l[0]))
            if len(lqs) == 1 and lqs[0].accessible(user):
                    l = lqs[0]
                    if l.query.get('static', False) is False:
                        data = l.query
                        q = itemParseConditions(data.get('conditions', []),
                                                data.get('operator', '&'),
                                                user, l.user)
                    else:
                        q = Q(id__in=l.items.all())
                    if exclude:
                        q = ~q
            else:
                q = Q(id=0)
        return Q(item__in=Item.objects.filter(q))
    else:
        key = k + get_operator(op, 'istr')
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


class FileManager(Manager):

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

        # join query with operator
        qs = self.get_query_set()
        query = data.get('query', {})
        conditions = parseConditions(query.get('conditions', []),
                                     query.get('operator', '&'),
                                     user)
        if conditions:
            qs = qs.filter(conditions)
        return qs
