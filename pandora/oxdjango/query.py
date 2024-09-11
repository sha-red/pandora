# -*- coding: utf-8 -*-

from django.db.models.sql import Query
from django.db.models.sql.compiler import SQLCompiler
from django.db import connections
import django.db.models.query

'''
models.py:
-----------------------------------
from oxdjango.query import QuerySet

class Manager(models.Manager):
    def get_query_set(self):
        return QuerySet(self.model)

class Model(models.Model):
    ...
    objects = Manager()
'''

class NullLastSQLCompiler(SQLCompiler):

    def get_order_by(self):
            result = super(NullLastSQLCompiler, self).get_order_by()
            if self.query.nulls_last and result \
                and self.connection.vendor == 'postgresql':
                return [(expr, (sql + ' NULLS LAST', params, is_ref))
                        for (expr, (sql, params, is_ref)) in result]
            return result

class NullsLastQuery(Query):
    nulls_last = False

    def clone(self, *args, **kwargs):
        obj = super(NullsLastQuery, self).clone(*args, **kwargs)
        obj.nulls_last = self.nulls_last
        return obj

    def get_compiler(self, using=None, connection=None, elide_empty=True):
        if using is None and connection is None:
            raise ValueError("Need either using or connection")
        if using:
            connection = connections[using]
        return NullLastSQLCompiler(self, connection, using, elide_empty)

class QuerySet(django.db.models.query.QuerySet):

    def __init__(self, model=None, query=None, using=None, **kwargs):
        super(QuerySet, self).__init__(model=model, query=query, using=None, **kwargs)
        self.query = query or NullsLastQuery(self.model)

    def order_by(self, *args, **kwargs):
        nulls_last = kwargs.pop('nulls_last', False)
        obj = super(QuerySet, self).order_by(*args, **kwargs)
        obj.query.nulls_last = nulls_last
        return obj
