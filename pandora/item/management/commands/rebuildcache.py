# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

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

    def handle(self, **options):
        offset = 0
        chunk = 100
        count = pos = models.Item.objects.count()
        while offset <= count:
            for i in models.Item.objects.all().order_by('id')[offset:offset+chunk]:
                print pos, i.itemId
                i.save()
                pos -= 1
            offset += chunk
