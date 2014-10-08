# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import print_function
from django.core.management.base import BaseCommand
from django.conf import settings
from ... import documentation


class Command(BaseCommand):
    """
    """
    help = 'update config.jsonc documentation'
    args = '[config.jsonc] [baseconfig.jsonc]'

    def handle(self, *args, **options):
        target = settings.SITE_CONFIG
        base = settings.DEFAULT_CONFIG
        if len(args) == 1:
            target = args[0]
        elif len(args) == 2:
            target = args[0]
            base = args[1]
        print('update docs', target, 'base', base)
        documentation.update(target, base)
