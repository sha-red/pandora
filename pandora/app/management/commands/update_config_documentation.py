# -*- coding: utf-8 -*-
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
        print('update documentation in ', target, 'based on', base)
        documentation.update(target, base)
