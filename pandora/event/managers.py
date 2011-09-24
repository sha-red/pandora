# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.db.models import Q, Manager


class EventManager(Manager):

    def get_query_set(self):
        return super(EventManager, self).get_query_set()

    def find(self, q=''):
        qs = self.get_query_set()
        if q:
            qs = qs.filter(Q(name_find__icontains=q))
        return qs
