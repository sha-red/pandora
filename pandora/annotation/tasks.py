# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.conf import settings
from celery.task import task

import models


@task(ignore_resulsts=True, queue='default')
def update_matching_events(id):
    from event.models import Event
    a = models.Annotation.objects.get(pk=id)
    for e in a.events.filter(defined=False).exclude(name=a.value):
        if e.annotations.exclude(id=id).count() == 0:
            e.delete()
    if a.get_layer().get('type') == 'event' \
        and a.events.count() == 0:
            a.events.add(Event.get_or_create(a.value))
    for e in a.events.all():
        e.update_matches()
    ids = [e['id'] for e in Event.objects.all().values('id')]
    for i in ids:
        e = Event.objects.get(pk=i)
        for name in [e.name] + list(e.alternativeNames):
            if name.lower() in a.value.lower():
                e.update_matches()
                break

@task(ignore_resulsts=True, queue='default')
def update_matching_places(id):
    from place.models import Place
    a = models.Annotation.objects.get(pk=id)
    for p in a.places.filter(defined=False).exclude(name=a.value):
        if p.annotations.exclude(id=id).count() == 0:
            p.delete()
    if a.get_layer().get('type') == 'place' \
        and a.places.count() == 0:
            a.places.add(Place.get_or_create(a.value))
    for p in a.places.all():
        p.update_matches()
    ids = [e['id'] for e in Place.objects.all().values('id')]
    for i in ids:
        e = Place.objects.get(pk=i)
        for name in [e.name] + list(e.alternativeNames):
            if name.lower() in a.value.lower():
                e.update_matches()
                break

@task(ignore_resulsts=True, queue='default')
def update_item(id):
    from item.models import Item
    a = models.Annotation.objects.get(pk=id)
    #update facets if needed
    if filter(lambda f: f['id'] == a.layer, settings.CONFIG['filters']):
        a.item.update_layer_facet(a.layer)
    Item.objects.filter(id=a.item.id).update(modified=a.modified)
    a.item.update_find()
    a.item.update_sort()
    a.item.update_facets()
