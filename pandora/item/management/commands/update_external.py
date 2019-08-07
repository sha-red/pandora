# -*- coding: utf-8 -*-
from __future__ import print_function


from django.core.management.base import BaseCommand

import app.monkey_patch
from ... import models


class Command(BaseCommand):
    """
    rebuild sort/search cache for all items.
    """
    help = 'listen to rabbitmq and execute encoding tasks.'
    args = ''

    def add_arguments(self, parser):
        parser.add_argument('--all', action='store_true', dest='all',
            default=False, help='update all items, otherwise oldes N')
        parser.add_argument('-n', '--items', action='store', dest='items', type=int,
            default=30, help='number of items ot update')

    def handle(self, **options):
        offset = 0
        chunk = options['all'] and 100 or options['items']
        qs = models.Item.objects.exclude(public_id__startswith='0x')
        count = pos = qs.count()
        while (options['all'] and offset <= count) or offset < options['items']:
            print(offset, pos, count)
            for i in qs.order_by('modified')[:chunk]:
                print(pos, i.public_id, i.modified)
                i.update_external()
                pos -= 1
            offset += chunk
