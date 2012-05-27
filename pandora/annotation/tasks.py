# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import json
import ox

from django.conf import settings
from celery.task import task

import models


@task(ignore_results=True, queue='default')
def update_matching_events(id):
    from event.models import Event
    a = models.Annotation.objects.get(pk=id)
    for e in a.events.filter(defined=False).exclude(name=a.value):
        if e.annotations.exclude(id=id).count() == 0:
            e.delete()
    for e in a.events.all():
        e.update_matches()
    if a.get_layer().get('type') == 'event' and a.events.count() == 0:
        a.events.add(Event.get_or_create(a.value))
        for e in a.events.all():
            e.update_matches()

    if a.findvalue:
        names = {}
        for n in Event.objects.all().values('id', 'name', 'alternativeNames'):
            names[n['id']] = [ox.decode_html(x) for x in [n['name']] + json.loads(n['alternativeNames'])]

        value = a.findvalue.lower()
        update = []
        for i in names:
            for name in names[i]:
                if name.lower() in value:
                    update.append(i)
                    break
        if update:
            for e in Event.objects.filter(id__in=update):
                e.update_matches()

@task(ignore_results=True, queue='default')
def update_matching_places(id):
    from place.models import Place
    a = models.Annotation.objects.get(pk=id)
    for p in a.places.filter(defined=False).exclude(name=a.value):
        if p.annotations.exclude(id=id).count() == 0:
            p.delete()
    for p in a.places.all():
        p.update_matches()
    if a.get_layer().get('type') == 'place' and a.places.count() == 0:
        a.places.add(Place.get_or_create(a.value))
        for p in a.places.all():
            p.update_matches()
    
    if a.findvalue:
        names = {}
        for n in Place.objects.all().values('id', 'name', 'alternativeNames'):
            names[n['id']] = [ox.decode_html(x) for x in [n['name']] + json.loads(n['alternativeNames'])]
        value = a.findvalue.lower()
        update = []
        for i in names:
            for name in names[i]:
                if name.lower() in value:
                    update.append(i)
                    break
        if update:
            for e in Place.objects.filter(id__in=update):
                e.update_matches()

@task(ignore_results=True, queue='default')
def update_item(id):
    from item.models import Item
    from clip.models import Clip
    a = models.Annotation.objects.get(pk=id)
    #cleanup orphaned clips
    Clip.objects.filter(annotations__id=None).delete()
    #update facets if needed
    if filter(lambda f: f['id'] == a.layer, settings.CONFIG['filters']):
        a.item.update_layer_facet(a.layer)
    Item.objects.filter(id=a.item.id).update(modified=a.modified)
    a.item.modified = a.modified
    a.item.update_find()
    a.item.update_sort()
    a.item.update_facets()
