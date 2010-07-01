# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import re
from datetime import datetime
from urllib2 import unquote
import json

from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q, Manager

import models


def keyType(key):
    if key in ('released'):
        return "date"
    if key in ('year', 'cast.length'):
        return "int"
    if key in ('rating', 'votes'):
        return "float"
    return "string"

class MovieManager(Manager):
    def get_query_set(self):
        return super(MovieManager, self).get_query_set()

    def filter_list(self, qs, l, user):
        if l != "all":
            l = l.split(":")
            only_public = True
            if not user.is_anonymous():
                if len(l) == 1: l = [request.user.username] + l
                if request.user.username == l[0]:
                    only_public = False
            if len(l) == 2:
                lqs = models.List.objects.filter(name=l[1], user__username=l[0])
                if only_public:
                    lqs = qls.filter(public=True)
                if lqs.count() == 1:
                    qs = qs.filter(listitem__list__id=lqs[0].id)
        return qs

    def find(self, data, user):
        '''
            query: {
                conditions: [
                    {
                        value: "war""
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
        query_operator = data['query'].get('operator', '&')
        conditions = []
        for condition in data['query']['conditions']:
            k = condition.get('key', 'all')
            v = condition['value']
            op = condition.get('operator', None)
            if op.startswith('!'):
                op = op[1:]
                exclude = True
            else:
                exclude = False
            if keyType(k) == "string":
                if op == '=':
                    k = '%s__iexact' % k
                elif op == '^':
                    v = v[1:]
                    k = '%s__istartswith' % k
                elif op == '$':
                    v = v[:-1]
                    k = '%s__iendswith' % k
                else: # elif op == '~':
                    k = '%s__icontains' % k
                k = 'find__%s' % k
                k = str(k)
                if exclude:
                    conditions.append(~Q(**{k:v}))
                else:
                    conditions.append(Q(**{k:v}))
            else: #number or date
                def parseDate(d):
                    while len(d) < 3:
                        d.append(1)
                    return datetime(*[int(i) for i in d])
                if op == '-':
                    v1 = v[1]
                    v2 = v[2]
                    if keyType(k) == "date":
                        v1 = parseDate(v1.split('.'))
                        v2 = parseDate(v2.split('.'))

                    k = 'find__%s' % k
                    if exclude: #!1960-1970
                        k1 = str('%s__lt' % k)
                        k2 = str('%s__gte' % k)
                        conditions.append(Q(**{k1:v1})|Q(**{k2:v2}))
                    else: #1960-1970
                        k1 = str('%s__gte' % k)
                        k2 = str('%s__lt' % k)
                        conditions.append(Q(**{k1:v1})&Q(**{k2:v2}))
                else:
                    if keyType(k) == "date":
                        v = parseDate(v.split('.'))
                    if op == '=':
                        k = '%s__exact' % k
                    elif op == '>':
                        k = '%s__gt' % k
                    elif op == '>=':
                        k = '%s__gte' % k
                    elif op == '<':
                        k = '%s__lt' % k
                    elif op == '<=':
                        k = '%s__lte' % k

                    k = 'find__%s' % k
                    k = str(k)
                    if exclude: #!1960
                        conditions.append(~Q(**{k:v}))
                    else: #1960
                        conditions.append(Q(**{k:v}))

        #join query with operator
        qs = self.get_query_set()
        #only include movies that have hard metadata
        qs = qs.filter(available=True)
        if conditions:
            q = conditions[0]
            for c in conditions[1:]:
                if query_operator == '|':
                    q = q | c
                else:
                    q = q & c
            qs = qs.filter(q)

        # filter list, works for own or public lists
        l = data.get('list', 'all')
        qs = self.filter_list(qs, l, user)
        return qs

class FileManager(Manager):
    def get_query_set(self):
        return super(FileManager, self).get_query_set()

    def movie_files(self, movie):
        q = self.get_query_set()
        return q.filter(type=1, movie=movie)

class ArchiveFileManager(Manager):
    def get_query_set(self):
        return super(ArchiveFileManager, self).get_query_set()

    def movie_files(self, movie):
        q = self.get_query_set()
        return q.filter(file__is_video=True, file__movie=movie)

    def by_oshash(self, oshash):
        q = self.get_query_set()
        q = q.filter(file__oshash=oshash)
        if q.count() == 0:
            raise models.ArchiveFile.DoesNotExist("%s matching oshash %s does not exist." %
                 (models.ArchiveFile._meta.object_name, oshash))
        else:
            return q[0]

