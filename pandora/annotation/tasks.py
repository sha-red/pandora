# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, print_function, absolute_import

import ox

from django.conf import settings
from django.db import transaction
from celery.task import task

from .models import Annotation


@task(ignore_results=False, queue='default')
def add_annotations(data):
    from item.models import Item
    from entity.models import Entity
    from user.models import User
    item = Item.objects.get(public_id=data['item'])
    layer_id = data['layer']
    layer = filter(lambda l: l['id'] == layer_id, settings.CONFIG['layers'])
    if not layer:
        return False
    else:
        layer = layer[0]
    user = User.objects.get(username=data['user'])
    annotation = None
    for a in data['annotations']:
        if layer['type'] == 'entity':
            try:
                value = Entity.get_by_name(a['value'], layer['entity']).get_id()
            except Entity.DoesNotExist:
                continue
        else:
            value = a['value']
        annotation = Annotation(
            item=item,
            layer=layer_id,
            user=user,
            start=float(a['in']), end=float(a['out']),
            value=value)
        annotation.save()
    # update facets if needed
    if layer_id in item.facet_keys:
        item.update_layer_facet(layer_id)
    if annotation:
        Item.objects.filter(id=item.id).update(modified=annotation.modified)
        annotation.item.modified = annotation.modified
        annotation.item.update_find()
        annotation.item.update_sort()
        annotation.item.update_facets()
    return True

@task(ignore_results=True, queue='default')
def update_item(id, force=False):
    from item.models import Item
    from clip.models import Clip
    a = Annotation.objects.get(pk=id)
    if force or a.modified >= a.item.annotations.order_by('-modified')[0].modified:
        #cleanup orphaned clips
        Clip.objects.filter(item__id=a.item.id, annotations__id=None).delete()
        #update facets if needed
        with transaction.atomic():
            if filter(lambda f: f['id'] == a.layer and f.get('filter'), settings.CONFIG['itemKeys']):
                a.item.update_layer_facet(a.layer)
            Item.objects.filter(id=a.item.id).update(modified=a.modified)
            a.item.modified = a.modified
            a.item.update_find()
            a.item.update_sort()
            a.item.update_facets()
            if a.item.update_languages():
                a.item.save()


@task(ignore_results=True, queue='default')
def update_annotations(layers, value):
    items = {}

    with transaction.atomic():
        for a in Annotation.objects.filter(
            layer__in=layers,
            value=value
        ):
            a.save()
            items[a.item.id] = a.id

    for id in items.values():
        update_item.delay(id, True)
