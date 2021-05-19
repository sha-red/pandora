# -*- coding: utf-8 -*-

import os
from glob import glob

from django.core.management.base import BaseCommand

import app.monkey_patch
from ... import models
from ... import tasks

class Command(BaseCommand):
    """
    rebuild posters for all items.
    """
    help = 'rebuild all posters for all items.'
    args = ''

    def handle(self, **options):
        offset = 0
        chunk = 100
        count = models.Item.objects.count()
        while offset <= count:
            for i in models.Item.objects.all().order_by('id')[offset:offset+chunk]:
                print(i)
                if i.poster:
                    i.poster.delete()
                i.make_poster()
            offset += chunk
