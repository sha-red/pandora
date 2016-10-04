# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import print_function

from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.db.models import fields
from django.conf import settings

settings.RELOAD_CONFIG = False
import app.monkey_patch
from ... import models

class Command(BaseCommand):
    help = 'update document find and sort values'
    args = ''

    def handle(self, **options):
        ids = [i['id'] for i in models.Document.objects.all().values('id')]
        for id in ids:
            try:
                i = models.Document.objects.get(id=id)
                if i.file:
                    i.get_info()
                i.get_ratio()
                #print(i, i.ratio)
                i.save()
            except:
                pass
