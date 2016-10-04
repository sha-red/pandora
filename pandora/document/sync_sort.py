# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import print_function

from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.db.models import fields
from django.conf import settings

from . import models

def update_tables(debug=False):
    table_name = models.Sort._meta.db_table
    cursor = connection.cursor()
    db_rows = connection.introspection.get_table_description(cursor, table_name)
    db_fields = dict([(row[0], row) for row in db_rows])
    db_types = dict([(row[0],
                      connection.introspection.data_types_reverse[row[1]]) for row in db_rows])

    model_fields = ['document_id'] + [f.name for f in models.Sort._meta.fields]
    rebuild = False

    changes = []
    for name in db_types:
        if name not in model_fields:
            sql = 'ALTER TABLE "%s" DROP COLUMN "%s"' % (table_name, name)
            changes.append(sql)

    for f in models.Sort._meta.fields:
        if not f.primary_key:
            name = f.name
            col_type = f.db_type(connection)
            if name not in db_fields:
                sql = 'ALTER TABLE "%s" ADD COLUMN "%s" %s' % (table_name, name, col_type)
                changes.append(sql)
                sql = 'CREATE INDEX "%s_%s_idx" ON "%s" ("%s")' % (table_name, name,
                                                                   table_name, name)
                changes.append(sql)
                rebuild = True
            elif f.__class__.__name__ != db_types[name]:
                sql = 'ALTER TABLE "%s" DROP COLUMN "%s"' % (table_name, name)
                changes.append(sql)
                sql = 'ALTER TABLE "%s" ADD COLUMN "%s" %s' % (table_name, name, col_type)
                changes.append(sql)
                sql = 'CREATE INDEX "%s_%s_idx" ON "%s" ("%s")' % (table_name, name,
                                                                   table_name, name)
                changes.append(sql)
                rebuild = True
            elif db_types[name] == 'CharField' and db_fields[name][3] != f.max_length:
                sql = 'ALTER TABLE "%s" ALTER COLUMN "%s" TYPE %s' % (table_name, name,
                                                                      col_type)
                changes.append(sql)
                sql = 'ALTER TABLE "%s" ALTER COLUMN "%s" %s NOT NULL' % (table_name, name,
                                                                f.null and "DROP" or "SET")
                changes.append(sql)
                rebuild = True

    if changes:
        print("Updating document sort schema...")
        for sql in changes:
            if debug:
                print(sql)
            cursor.execute(sql)
        transaction.commit()
        if rebuild:
            print("Updating document sort values...")
            ids = [i['id'] for i in models.Document.objects.all().values('id')]
            for id in ids:
                d = models.Document.objects.get(pk=id)
                if debug:
                    print(d)
                d.update_sort()
