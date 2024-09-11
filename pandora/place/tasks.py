# -*- coding: utf-8 -*-

from app.celery import app

from . import models


'''
from celery.schedules import crontab

@app.task(queue='encoding')
def update_all_matches(**kwargs):
    ids = [p['id'] for p in models.Place.objects.all().values('id')]
    for i in ids:
        p = models.Place.objects.get(pk=i)
        p.update_matches()

@app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(crontab(hour=6, minute=30), update_all_matches.s())
'''

@app.task(ignore_results=True, queue='default')
def update_matches(id):
    place = models.Place.objects.get(pk=id)
    place.update_matches()

