# -*- coding: utf-8 -*-
from __future__ import print_function

from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.db.models import fields
from django.conf import settings

settings.RELOAD_CONFIG = False
import app.monkey_patch


class Command(BaseCommand):
    """
    sync document sort table with current settings in site.json
    """
    help = 'alter table to match documentKeys in site.json.'
    args = ''

    def add_arguments(self, parser):
        parser.add_argument('--debug', action='store_true', dest='debug',
            default=False, help='print sql commans')

    def handle(self, **options):
        import document.sync_sort
        document.sync_sort.update_tables(options['debug'])
