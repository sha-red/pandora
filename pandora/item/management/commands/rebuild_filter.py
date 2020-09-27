# -*- coding: utf-8 -*-


from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.db.models import fields
from django.conf import settings

import app.monkey_patch
from ... import models
import clip.models

class Command(BaseCommand):
    help = 'update filters, run after adding new filters'
    args = ''

    def add_arguments(self, parser):
        parser.add_argument('--debug', action='store_true', dest='debug',
            default=False, help='print sql commans'),

    def handle(self, **options):
        ids = [i['id'] for i in models.Item.objects.all().values('id')]
        for id in ids:
            try:
                i = models.Item.objects.get(pk=id)
                if options['debug']:
                    print(i)
                i.update_facets()
            except:
                pass
