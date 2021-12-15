# -*- coding: utf-8 -*-

from app.celery import app

from .models import Event


'''
from celery.schedules import crontab

@app.task(ignore_results=True, queue='encoding')
def update_all_matches(**kwargs):
    ids = [e['id'] for e in Event.objects.all().values('id')]
    for i in ids:
        e = Event.objects.get(pk=i)
        e.update_matches()

@app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(crontab(hour=7, minute=30), update_all_matches.s())
'''

@app.task(ignore_results=True, queue='default')
def update_matches(eventId):
    event = Event.objects.get(pk=eventId)
    event.update_matches()

