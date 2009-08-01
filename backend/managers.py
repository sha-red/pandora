# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from django.db.models import Q


class MovieManager(models.Manager):
    def get_query_set(self):
        return super(MovieManager, self).get_query_set()

    def find(self, q="", f="all", s="title", a="desc", l="all", o=0, n=100, p=None):
        qs = self.get_query_set()

        if q:
            if f == "all":
                qs = qs.filter(title__icontains=q)
            else:
                field = str("find__%s__icontains"%f)
                qs = qs.filter(**{field: q})

        order_by = s
        if a == "desc":
          order_by = "-sort__" + order_by
        qs = qs.order_by(order_by)

        return qs[o:n]

