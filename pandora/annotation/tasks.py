# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from celery.task import task



@task(ignore_resulsts=True, queue='default')
def update_matching_events(value):
    from event.models import Event
    ids = [e['id'] for e in Event.objects.all().values('id')]
    for i in ids:
        e = Event.objects.get(pk=i)
        for name in [e.name] + list(e.alternativeNames):
            if name in value:
                e.update_matches()
                break

@task(ignore_resulsts=True, queue='default')
def update_matching_places(value):
    from place.models import Place
    ids = [e['id'] for e in Place.objects.all().values('id')]
    for i in ids:
        e = Place.objects.get(pk=i)
        for name in [e.name] + list(e.alternativeNames):
            if name in value:
                e.update_matches()
                break
