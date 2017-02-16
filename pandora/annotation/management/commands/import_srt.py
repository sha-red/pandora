# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import print_function

from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings

import ox

import app.monkey_patch

from item.models import Item
from user.models import User

from ... import models

class Command(BaseCommand):
    """
    import annotations
    """
    help = 'import annotations from srt or vtt'
    args = 'username item layername filename.srt'
    option_list = BaseCommand.option_list + (
    )

    def handle(self, *args, **options):
        if len(args) != 4:
            print(self.usage('import_srt'))
            return 
        username, public_id, layer_id, filename = args
        user = User.objects.get(username=username)
        item = Item.objects.get(public_id=public_id)
        layer = list(filter(lambda l: l['id'] == layer_id, settings.CONFIG['layers']))[0]

        if filename.endswith('.vtt'):
            annotations = ox.vtt.load(filename)
        else:
            annotations = ox.srt.load(filename)
        print('importing %d annotations into %s/%s' % (len(annotations), public_id, layer_id))
        for i in range(len(annotations)-1):
            if annotations[i]['out'] == annotations[i+1]['in']:
                annotations[i]['out'] = annotations[i]['out'] - 0.001
        with transaction.atomic():
            for a in annotations:
                if a['value']:
                    annotation = models.Annotation(
                        item=item,
                        layer=layer_id,
                        user=user,
                        start=float(a['in']),
                        end=float(a['out']),
                        value=a['value'])
                    annotation.save()
            #update facets if needed
            if list(filter(lambda f: f['id'] == layer_id, settings.CONFIG['filters'])):
                item.update_layer_facet(layer_id)
            Item.objects.filter(id=item.id).update(modified=annotation.modified)
            annotation.item.modified = annotation.modified
            annotation.item.update_find()
            annotation.item.update_sort()
            annotation.item.update_facets()
