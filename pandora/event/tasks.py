# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from datetime import timedelta

from celery.decorators import task, periodic_task

import models


@periodic_task(run_every=timedelta(days=1), queue='encoding')
def update_all_matches(**kwargs):
    ids = [e['id'] for e in models.Event.objects.all().values('id')]
    for i in ids:
        e = models.Event.objects.get(pk=i)
        e.update_matches()

@task(ignore_resulsts=True, queue='default')
def update_matches(eventId):
    event = models.Event.objects.get(pk=eventId)
    event.update_matches()

