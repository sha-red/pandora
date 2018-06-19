# -*- coding: utf-8 -*-
from __future__ import division, print_function, absolute_import

from celery.task import task

from .models import Event


'''
@periodic_task(run_every=crontab(hour=7, minute=30), queue='encoding')
def update_all_matches(**kwargs):
    ids = [e['id'] for e in Event.objects.all().values('id')]
    for i in ids:
        e = Event.objects.get(pk=i)
        e.update_matches()
'''

@task(ignore_results=True, queue='default')
def update_matches(eventId):
    event = Event.objects.get(pk=eventId)
    event.update_matches()

