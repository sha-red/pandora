# -*- coding: utf-8 -*-

import os

import ox
from django.core.management.base import BaseCommand
from django.conf import settings

import app.monkey_patch
from ... import models

def link(src, target):
    if not os.path.exists(target):
        ox.makedirs(os.path.dirname(target))
        print(src)
        print('\t', target)
        os.symlink(src, target)

class Command(BaseCommand):
    """
    symlink flies into author/title tree
    """
    help = 'symlink files into author/title tree'
    args = '<prefix>'

    def handle(self, prefix, **options):
        for i in models.Item.objects.all():
            for f in i.files.all():
                path = f.normalize_item_path()
                print(path)
                if settings.CONFIG['site']['folderdepth'] == 4:
                    path = os.path.join(path[0], path)
                if f.data:
                    target = os.path.join(prefix, path)
                    link(f.data.path, target)

                    versions = os.path.join(prefix, os.path.dirname(path), 'Versions')
                    s = f.streams.filter(source=None)[0]
                    basename = os.path.basename(path).rsplit('.', 1)[0]
                    target = os.path.join(versions, '%s.%s' % (basename, s.format))
                    link(s.media.path, target)
                else:
                    s = f.streams.filter(source=None)[0]
                    basename = path.rsplit('.', 1)[0]
                    target = os.path.join(prefix, '%s.%s' % (basename, s.format))
                    link(s.media.path, target)
