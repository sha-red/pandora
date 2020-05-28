# -*- coding: utf-8 -*-

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
        import annotation.models
        ids = [i['id'] for i in annotation.models.Annotation.objects.all().values('id')]
        for id in ids:
            try:
                a = annotation.models.Annotation.objects.get(id=id)
                a.update_documents()
            except:
                pass
