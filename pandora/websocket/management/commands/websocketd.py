# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import absolute_import

import os

from django.core.management.base import BaseCommand
from django.conf import settings


from ... import daemon, worker

import logging

class Command(BaseCommand):
    """
    """
    help = 'run websocket daemon'
    args = ''

    def add_arguments(self, parser):
        parser.add_argument('--debug',
                            action='store_true',
                            dest='debug',
                            default=False,
                            help='enable debug'),
        parser.add_argument("--pidfile", dest="pidfile", metavar="PIDFILE"),

    def handle(self, **options):
        socket = daemon.Daemon(settings.WEBSOCKET_PORT, settings.WEBSOCKET_ADDRESS)
        if options['debug']:
            logging.basicConfig(level=logging.DEBUG)
        if options['pidfile']:
            with open(options['pidfile'], 'w') as pid:
                pid.write('%s' % os.getpid())
        worker.run()
        socket.join()
