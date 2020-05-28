# -*- coding: utf-8 -*-

from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    """
    """
    help = 'check if south migrations are initialized'
    args = ''

    def handle(self, **options):
        try:
            import south.models
            table_name = south.models.MigrationHistory._meta.db_table
            cursor = connection.cursor()
            db_rows = connection.introspection.get_table_description(cursor, table_name)
            print("yes")
        except:
            print("no")
