# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand

from ... import config


class Command(BaseCommand):
    """
    """
    help = 'update static files'
    args = ''

    def handle(self, **options):
        config.update_static()
