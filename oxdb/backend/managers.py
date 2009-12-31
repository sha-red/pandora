# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import re
from datetime import datetime
from urllib2 import unquote

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

    def find(self, request):
        '''
            construct query set from q value in request,
            also checks for lists.
            range and order must be applied later
        '''
        q = ''
        for i in request.META['QUERY_STRING'].split('&'):
          if i.startswith('q='):
            q = i[2:]
        op = ','
        if '|' in q:
            op = '|'
        conditions = []
        for e in q.split(op):
            e = e.split(':')
            if len(e) == 1: e = ['all'] + e
            k, v = e
            exclude = False
            if v.startswith('!'):
                v = v[1:]
                exclude = True
            if keyType(k) == "string":
                startswith = v.startswith('^')
                endswith = v.endswith('$')
                if startswith and endswith:
                    v = v[1:-1]
                    k = '%s__iexact' % k
                elif startswith:
                    v = v[1:]
                    k = '%s__istartswith' % k
                elif v.endswith('$'):
                    v = v[:-1]
                    k = '%s__iendswith' % k
                else:
                    k = '%s__icontains' % k
                k = 'find__%s' % k
                v = unquote(v)
                if exclude:
                    conditions.append(~Q(**{k:v}))
                else:
                    conditions.append(Q(**{k:v}))
            else:
                def parseDate(d):
                    while len(d) < 3:
                        d.append(1)
                    return datetime(*[int(i) for i in d])
                #1960-1970
                match = re.compile("(-?[\d\.]+?)-(-?[\d\.]+$)").findall(v)
                if match:
                    v1 = match[0][0]
                    v2 = match[0][1]
                    if keyType(k) == "date":
                        v1 = parseDate(v1.split('.'))
                        v2 = parseDate(v2.split('.'))
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
                    k = str('%s' % k)
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
                if op == '|':
                    q = q | c
                else:
                    q = q & c
            qs = qs.filter(q)

        # filter list, works for own or public lists
        l = request.GET.get('l', 'all')
        if l != "all":
            l = l.split(":")
            only_public = True
            if not request.user.is_anonymous():
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

