# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.core.management.base import BaseCommand
from django.conf import settings

import monkey_patch.models
from ... import models


class Command(BaseCommand):
    """
    print sql statement to add trigram 
    """
    help = 'sql create statements for find tables to use trigram index'
    args = ''

    def handle(self, **options):
        print 'CREATE INDEX item_itemfind_value_idx ON item_itemfind USING gin (value gin_trgm_ops);'
        print ''
        print 'CREATE INDEX clip_clip_findvalue_idx ON clip_clip USING gin (findvalue gin_trgm_ops);'
