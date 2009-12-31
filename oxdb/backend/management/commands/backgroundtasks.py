# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
# j@v2v.cc
import os
from os.path import join, dirname, basename, splitext, exists
from glob import glob

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from ... import daemon

class Command(BaseCommand):
    """
    listen to rabbitmq and execute background dasks.
    """
    help = 'listen to rabbitmq and execute background dasks.'
    args = ''

    def handle(self, **options):
        daemon.run()

