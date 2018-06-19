# -*- coding: utf-8 -*-

from django.core.management.base import BaseCommand

import app.monkey_patch
from ... import models


class Command(BaseCommand):
    """
    reparse all useragents. useful after updating python-ox
    """
    help = 'reparse all useragents. useful after updating python-ox'
    args = ''

    def handle(self, **options):
        ids = [s['session_key'] for s in models.SessionData.objects.all().values('session_key')]
        for i in ids:
            s = models.SessionData.objects.get(pk=i)
            s.parse_useragent()
            s.save()
