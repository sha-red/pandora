# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import unicodedata

from six import string_types
from django.db.models import Q, Manager
from django.conf import settings

import ox
from oxdjango.query import QuerySet

import entity.managers
from oxdjango.managers import get_operator

from documentcollection.models import Collection
from item import utils


keymap = {
    'item': 'items__public_id',
}
default_key = 'title'

def get_key_type(k):
    key_type = (utils.get_by_id(settings.CONFIG['documentKeys'], k) or {'type': 'string'}).get('type')
    if isinstance(key_type, list):
        key_type = key_type[0]
    key_type = {
        'title': 'string',
        'person': 'string',
        'text': 'string',
        'year': 'string',
        'length': 'string',
        'layer': 'string',
        'list': 'list',
    }.get(key_type, key_type)
    return key_type

def parseCondition(condition, user, item=None, owner=None):
    '''
    '''
    k = condition.get('key', default_key)
    k = keymap.get(k, k)
    if not k:
        k = default_key
    if item and k == 'description':
        item_conditions = condition.copy()
        item_conditions['key'] = 'items__itemproperties__description'
        return parseCondition(condition, user) | parseCondition(item_conditions, user)

    v = condition['value']
    op = condition.get('operator')
    if not op:
        op = '='

    if op.startswith('!'):
        return buildCondition(k, op[1:], v, user, True, owner=owner)
    else:
        return buildCondition(k, op, v, user, owner=owner)

def buildCondition(k, op, v, user, exclude=False, owner=None):
    import entity.models
    from . import models

    # fixme: frontend should never call with list
    if k == 'list':
        print('fixme: frontend should never call with list', k, op, v)
        k = 'collection'

    key_type = get_key_type(k)
    facet_keys = models.Document.facet_keys
    if k == 'id':
        v = ox.fromAZ(v)
        q = Q(**{k: v})
        if exclude:
            q = ~Q(id__in=models.Document.objects.filter(q))
        return q
    elif k == 'groups':
        if op == '==' and v == '$my':
            if not owner:
                owner = user
            groups = owner.groups.all()
        else:
            key = 'name' + get_operator(op)
            groups = Group.objects.filter(**{key: v})
        if not groups.count():
            return Q(id=0)
        q = Q(groups__in=groups)
        if exclude:
            q = ~q
        return q
    elif k in ('oshash', 'items__public_id'):
        q = Q(**{k: v})
        if exclude:
            q = ~Q(id__in=models.Document.objects.filter(q))
        return q
    elif isinstance(v, bool):
        key = k
    elif k == 'entity':
        entity_key, entity_v = entity.managers.namePredicate(op, v)
        key = 'id__in'
        v = entity.models.DocumentProperties.objects.filter(**{
            'entity__' + entity_key: entity_v
        }).values_list('document_id', flat=True)
    elif k == 'collection':
        q = Q(id=0)
        l = v.split(":", 1)
        if len(l) >= 2:
            lqs = list(Collection.objects.filter(name=l[1], user__username=l[0]))
            if len(lqs) == 1 and lqs[0].accessible(user):
                    l = lqs[0]
                    if l.query.get('static', False) is False:
                        data = l.query
                        q = parseConditions(data.get('conditions', []),
                                            data.get('operator', '&'),
                                            user, owner=l.user)
                    else:
                        q = Q(id__in=l.documents.all())
            else:
                q = Q(id=0)
        return q
    elif key_type == 'boolean':
        q = Q(**{'find__key': k, 'find__value': v})
        if exclude:
            q = ~Q(id__in=models.Document.objects.filter(q))
        return q
    elif key_type == "string":
        in_find = True
        if in_find:
            value_key = 'find__value'
        else:
            value_key = k
        if isinstance(v, string_types):
            v = unicodedata.normalize('NFKD', v).lower()
        if k in facet_keys:
            in_find = False
            facet_value = 'facets__value' + get_operator(op, 'istr')
            v = models.Document.objects.filter(**{'facets__key': k, facet_value: v})
            value_key = 'id__in'
        else:
            value_key = value_key + get_operator(op)
        k = str(k)
        value_key = str(value_key)
        if k == '*':
            q = Q(**{value_key: v})
        elif in_find:
            q = Q(**{'find__key': k, value_key: v})
        else:
            q = Q(**{value_key: v})
        if exclude:
            q = ~Q(id__in=models.Document.objects.filter(q))
        return q
    elif key_type == 'date':
        def parse_date(d):
            while len(d) < 3:
                d.append(1)
            return datetime(*[int(i) for i in d])

        #using sort here since find only contains strings
        v = parse_date(v.split('-'))
        vk = 'sort__%s%s' % (k, get_operator(op, 'int'))
        vk = str(vk)
        q = Q(**{vk: v})
        if exclude:
            q = ~q
        return q
    else:  # integer, float, list, time
        #use sort table here
        if key_type == 'time':
            v = int(utils.parse_time(v))

        vk = 'sort__%s%s' % (k, get_operator(op, 'int'))
        vk = str(vk)
        q = Q(**{vk: v})
        if exclude:
            q = ~q
        return q
    key = str(key)
    q = Q(**{key: v})
    if exclude:
        q = ~q
    return q


def parseConditions(conditions, operator, user, item=None, owner=None):
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
                             condition.get('operator', '&'), user, item, owner=owner)
            if q:
                conn.append(q)
            pass
        else:
            conn.append(parseCondition(condition, user, item, owner=owner))
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

        #anonymous can only see public items
        if not user or user.is_anonymous():
            level = 'guest'
            allowed_level = settings.CONFIG['capabilities']['canSeeDocument'][level]
            qs = qs.filter(rightslevel__lte=allowed_level)
            rendered_q = Q(rendered=True)
        #users can see public items, there own items and items of there groups
        else:
            level = user.profile.get_level()
            allowed_level = settings.CONFIG['capabilities']['canSeeDocument'][level]
            q = Q(rightslevel__lte=allowed_level) | Q(user=user)
            rendered_q = Q(rendered=True) | Q(user=user)
            if user.groups.count():
                q |= Q(groups__in=user.groups.all())
                rendered_q |= Q(groups__in=user.groups.all())
            qs = qs.filter(q)

        return qs
