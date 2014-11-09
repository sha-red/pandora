# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from optparse import make_option

from django.core.management.base import BaseCommand

import app.monkey_patch
from ... import models


class Command(BaseCommand):
    """
    """
    help = 'reinject files into encoding queue'
    args = ''

    def handle(self, **options):
        for f in models.File.objects.filter(encoding=True):
            if f.streams.all().count():
                f.process_stream()
            elif f.data:
                f.extract_stream()
