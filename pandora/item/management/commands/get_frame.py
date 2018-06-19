# -*- coding: utf-8 -*-
from __future__ import print_function

from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import transaction

settings.RELOAD_CONFIG = False
import app.monkey_patch
from ... import models

class Command(BaseCommand):
    help = 'extract frame and print path'
    args = '<id> <height> <position>'

    def handle(self, id, height, position, **options):
        position = float(position)
        height = int(height)
        with transaction.atomic():
            i = models.Item.objects.get(public_id=id)
            path = i.frame(position, height)
        if path:
            print(path)
