# -*- coding: utf-8 -*-

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

import ox

import app.monkey_patch

from item.models import Item

from ... import models, tasks

User = get_user_model()


class Command(BaseCommand):
    """
    import annotations
    """
    help = 'import annotations from srt or vtt'
    args = 'username item layer filename.srt'

    def add_arguments(self, parser):
        parser.add_argument('username', help='username')
        parser.add_argument('item', help='item')
        parser.add_argument('layer', help='layer')
        parser.add_argument('language', help='language', default="")
        parser.add_argument('filename', help='filename.srt')

    def handle(self, *args, **options):
        username = options['username']
        public_id = options['item']
        layer_id = options['layer']
        filename = options['filename']
        language = options.get("language")

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
        if language:
            for annotation in annotations:
                annotation["value"] = '<span lang="%s">%s</span>' % (language, annotation["value"])
        tasks.add_annotations.delay({
            'item': item.public_id,
            'layer': layer_id,
            'user': username,
            'annotations': annotations
        })
