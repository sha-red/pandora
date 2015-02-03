# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.core.management.base import BaseCommand
from django.conf import settings
import os
import subprocess
import sys

def run(cmd):
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = p.communicate()

    if p.returncode != 0:
        print stderr
        sys.exit(r)

class Command(BaseCommand):
    """
    """
    help = 'initialize database'
    args = ''

    def handle(self, **options):
        print 'initializing database...'
        manage_py = sys.argv[0]
        for cmd in [
            [manage_py, 'syncdb', '--noinput'],
            [manage_py, 'migrate', 'item'],
            [manage_py, 'migrate', 'annotation'],
            [manage_py, 'migrate'],
            [manage_py, 'sqlfindindex'],
            [manage_py, 'sync_itemsort'],
            [manage_py, 'update_static'],
            [manage_py, 'compile_pyc'],
        ]:
            run(cmd)
        if not os.path.exists(os.path.join(settings.STATIC_ROOT, 'admin')):
            run([manage_py, 'collectstatic', '-l', '--noinput'])