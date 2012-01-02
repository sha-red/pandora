# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from celery.task import task

import models


@task(ignore_resulsts=True, queue='default')
def update_matching_events(id):
    from event.models import Event
    annotation = models.Annotation.objects.get(pk=id)
    for e in annotation.events.all():
        e.update_matches()
    ids = [e['id'] for e in Event.objects.all().values('id')]
    for i in ids:
        e = Event.objects.get(pk=i)
        for name in [e.name] + list(e.alternativeNames):
            if name in annotation.value:
                e.update_matches()
                break

@task(ignore_resulsts=True, queue='default')
def update_matching_places(id):
    from place.models import Place
    annotation = models.Annotation.objects.get(pk=id)
    for p in annotation.places.all():
        p.update_matches()
    ids = [e['id'] for e in Place.objects.all().values('id')]
    for i in ids:
        e = Place.objects.get(pk=i)
        for name in [e.name] + list(e.alternativeNames):
            if name in annotation.value:
                e.update_matches()
                break
