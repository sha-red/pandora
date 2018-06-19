# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand

from ... import config


class Command(BaseCommand):
    """
    """
    help = 'update geoip database'
    args = ''

    def handle(self, **options):
        config.update_geoip(True)
