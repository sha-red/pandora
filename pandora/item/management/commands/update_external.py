# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from optparse import make_option

import os
from os.path import join, dirname, basename, splitext, exists

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

import monkey_patch.models
from ... import models


class Command(BaseCommand):
    """
    rebuild sort/search cache for all items.
    """
    help = 'listen to rabbitmq and execute encoding tasks.'
    args = ''
    option_list = BaseCommand.option_list + (
        make_option('--all', action='store_true', dest='all',
            default=False, help='update all items, otherwise oldes N'),
        make_option('-n', '--items', action='store', dest='items', type=int,
            default=30, help='number of items ot update'),
    )

    def handle(self, **options):
        offset = 0
        chunk = options['all'] and 100 or options['items']
        count = pos = models.Item.objects.count()
        while options['all'] and offset <= count or offset < options['items']:
            for i in models.Item.objects.all().order_by('modified')[offset:offset+chunk]:
                print pos, i.itemId, i.modified
                i.update_external()
                pos -= 1
            offset += chunk
