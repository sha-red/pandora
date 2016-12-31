# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import print_function


from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.conf import settings

settings.RELOAD_CONFIG = False
import app.monkey_patch
from ... import models


class Command(BaseCommand):
    """
    print sql statement to add trigram 
    """
    help = 'sql create statements for find tables to use trigram index'
    args = ''

    def add_arguments(self, parser):
        parser.add_argument('--debug', action='store_true', dest='debug',
                            default=False, help='print sql commans')

    def handle(self, **options):
        cursor = connection.cursor()

        def create_index(index, table, key):
            sql = 'CREATE INDEX "%s" ON "%s" USING gin ("%s" gin_trgm_ops)' % (index, table, key)
            if options['debug']:
                print(sql)
            cursor.execute(sql)

        if settings.DB_GIN_TRGM:
            import entity.models
            import document.models
            for table, column in (
                (models.ItemFind._meta.db_table, 'value'),        # Item Find
                (models.Clip._meta.db_table, 'findvalue'),        # Clip Find
                (models.Annotation._meta.db_table, 'findvalue'),  # Annotation Find
                (entity.models.Find._meta.db_table, 'value'),     # Entity Find
                (document.models.Find._meta.db_table, 'value'),   # Document Find
            ):
                cursor = connection.cursor()
                indexes = connection.introspection.get_indexes(cursor, table)
                drop = []
                if column in indexes:
                    sql = "SELECT indexname, indexdef FROM pg_catalog.pg_indexes " + \
                          "WHERE indexdef LIKE '%ON {table}%' AND indexdef LIKE '%{column}%'".format(table=table, column=column)
                    cursor.execute(sql)
                    for r in cursor:
                        if 'USING gin' not in r[1]:
                            drop.append(r[0])
                if drop:
                    for idx in drop:
                        sql = 'DROP INDEX ' + idx
                        if options['debug']:
                            print(sql)
                        cursor.execute(sql)
                    indexes = connection.introspection.get_indexes(cursor, table)
                if column not in indexes:
                    create_index("%s_%s_idx" % (table, column), table, column)
            transaction.commit()
