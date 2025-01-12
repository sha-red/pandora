# -*- coding: utf-8 -*-

from datetime import datetime
import unicodedata

from django.db.models import Q, Manager
from django.conf import settings

from archive.models import Volume
from itemlist.models import List
from user.models import Group
from . import utils

from oxdjango.query import QuerySet
from oxdjango.managers import get_operator


def parseCondition(condition, user, owner=None):
    '''
    condition: {
            value: "war"
    }
    or
    condition: {
            key: "year",
            value: [1970, 1980],
            operator: "="
    }
    ...
    '''
    from . import models
    k = condition.get('key', '*')
    k = {'id': 'public_id'}.get(k, k)
    if not k:
        k = '*'
    v = condition.get('value', '')
    op = condition.get('operator')
    if not op:
        op = '='
    if op.startswith('!'):
        op = op[1:]
        exclude = True
    else:
        exclude = False

    facet_keys = models.Item.facet_keys + ['title']
    key_type = (utils.get_by_id(settings.CONFIG['itemKeys'], k) or {'type': 'string'}).get('type')
    if isinstance(key_type, list):
        key_type = key_type[0]
        type_is_list = True
    else:
        type_is_list = False
    key_type = {
        'title': 'string',
        'person': 'string',
        'text': 'string',
        'year': 'string',
        'length': 'string',
        'layer': 'string',
        'list': 'list',
    }.get(key_type, key_type)
    if k == 'list':
        key_type = ''

    if k in ('width', 'height'):
        key_type = 'integer'

    if k == 'groups':
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

    if (not exclude and op == '=' or op in ('$', '^')) and v == '':
        return Q()
    elif k == 'filename' and (user.is_anonymous or not user.profile.capability('canSeeMedia')):
        return Q(id=0)
    elif k == 'oshash':
        return Q(files__oshash=v)
    elif k == 'rendered':
        return Q(rendered=v)
    elif k == 'resolution':
        if isinstance(v, list) and len(v) == 2:
            q = parseCondition({'key': 'width', 'value': v[0], 'operator': op}, user) \
                & parseCondition({'key': 'height', 'value': v[1], 'operator': op}, user)
        else:
            q = Q(id=0)
        if exclude:
            q = ~q
        return q
    elif isinstance(v, list) and len(v) == 2 and op == '=':
        q = parseCondition({'key': k, 'value': v[0], 'operator': '>='}, user) \
            & parseCondition({'key': k, 'value': v[1], 'operator': '<'}, user)
        if exclude:
            q = ~q
        return q
    elif k in ('canplayvideo', 'canplayclips'):
        level = user.is_anonymous and 'guest' or user.profile.get_level()
        allowed_level = settings.CONFIG['capabilities'][{
            'canplayvideo': 'canPlayVideo',
            'canplayclips': 'canPlayClips'
        }[k]][level]
        if v:
            q = Q(level__lte=allowed_level)
        else:
            q = Q(level__gt=allowed_level)
        if exclude:
            q = ~q
        return q
    elif key_type == 'boolean':
        q = Q(**{'find__key': k, 'find__value': v})
        if exclude:
            q = ~Q(id__in=models.Item.objects.filter(q))
        return q
    elif key_type == "string" or (key_type == 'date' and type_is_list):
        in_find = not k.startswith('public_id')
        if in_find:
            value_key = 'find__value'
        else:
            value_key = k
        if not k.startswith('public_id'):
            if isinstance(v, str):
                v = unicodedata.normalize('NFKD', v).lower()
        if k in facet_keys:
            in_find = False
            facet_value = 'facets__value' + get_operator(op, 'istr')
            v = models.Item.objects.filter(**{'facets__key': k, facet_value: v})
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
            q = ~Q(id__in=models.Item.objects.filter(q))
        return q
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
                    if l.query.get('static', False) == False:
                        data = l.query
                        q = parseConditions(data.get('conditions', []),
                                            data.get('operator', '&'),
                                            user, l.user)
                    else:
                        q = Q(id__in=l.items.all())
                    if exclude:
                        if isinstance(q, list):
                            q = [~x for x in q]
                        else:
                            q = ~q
            else:
                q = Q(id=0)
        return q
    elif key_type == 'date' and not type_is_list:
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
    else: #integer, float, list, time
        #use sort table here
        if key_type == 'time':
            v = int(utils.parse_time(v))

        vk = 'sort__%s%s' % (k, get_operator(op, 'int'))
        vk = str(vk)
        q = Q(**{vk: v})
        if exclude:
            q = ~q
        return q

def parseConditions(conditions, operator, user, owner=None):
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
                             condition.get('operator', '&'), user, owner)
        else:
            q = parseCondition(condition, user, owner)
        if isinstance(q, list):
            conn += q
        elif q:
            conn.append(q)
    if conn:
        if operator == '|':
            q = conn[0]
            for c in conn[1:]:
                q = q | c
            q = [q]
        else:
            q = conn
        return q
    return [Q()]

class ItemManager(Manager):

    def get_query_set(self):
        return QuerySet(self.model)

    def filter_list(self, qs, l, user):
        from . import models
        if l != "*":
            l = l.split(":")
            only_public = True
            if not user.is_anonymous:
                if len(l) == 1:
                    l = [user.username] + l
                if user.username == l[0]:
                    only_public = False
            if len(l) == 2:
                lqs = models.List.objects.filter(name=l[1], user__username=l[0])
                if only_public:
                    lqs = lqs.filter(Q(status='public')|Q(status='featured'))
                if lqs.count() == 1:
                    if lqs[0].query:
                        data = lqs[0].query
                        conditions = parseConditions(data['query']['conditions'],
                                                     data['query'].get('operator', '&'),
                                                     user)
                        for c in conditions:
                            qs = qs.filter(c)
                    else:
                        qs = qs.filter(id__in=lqs[0].items.all())
        return qs

    def find(self, data, user=None):
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
        #only include items that have hard metadata
        conditions = parseConditions(data.get('query', {}).get('conditions', []),
                                     data.get('query', {}).get('operator', '&'),
                                     user)
        for c in conditions:
            qs = qs.filter(c)

        #FIXME: can this be avoided? needed for grid/accessed/foo
        qs = qs.distinct()
        
        #anonymous can only see public items
        if not user or user.is_anonymous:
            level = 'guest'
            allowed_level = settings.CONFIG['capabilities']['canSeeItem'][level]
            qs = qs.filter(level__lte=allowed_level)
            rendered_q = Q(rendered=True)
        #users can see public items, there own items and items of there groups
        else:
            level = user.profile.get_level()
            allowed_level = settings.CONFIG['capabilities']['canSeeItem'][level]
            q = Q(level__lte=allowed_level)|Q(user=user)
            rendered_q = Q(rendered=True)|Q(user=user)
            if user.groups.count():
                q |= Q(groups__in=user.groups.all())
                rendered_q |= Q(groups__in=user.groups.all())
            qs = qs.filter(q)
            max_level = len(settings.CONFIG['rightsLevels'])
            qs = qs.filter(level__lte=max_level)
        if settings.CONFIG.get('itemRequiresVideo') and level != 'admin':
            qs = qs.filter(rendered_q)
        return qs
