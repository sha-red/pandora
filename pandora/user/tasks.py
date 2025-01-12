# -*- coding: utf-8 -*-

from datetime import timedelta
from itertools import zip_longest
import json

from celery.schedules import crontab

from app.celery import app
from app.utils import limit_rate
from app.models import Settings
from .statistics import Statistics

@app.task(queue='encoding')
def cronjob(**kwargs):
    if limit_rate('user.tasks.cronjob', 30 * 60):
        update_statistics()

@app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(timedelta(hours=1), cronjob.s())

def update_statistics():
    from . import models

    def chunker(iterable, chunksize, filler):
        return zip_longest(*[iter(iterable)]*chunksize, fillvalue=filler)

    stats = Statistics()
    ids = [i['session_key']
           for i in models.SessionData.objects.filter(level__gte=0).values('session_key')]

    for chunk in chunker(ids, 100, None):
        chunk = list(filter(None, chunk))
        for u in models.SessionData.objects.filter(pk__in=chunk):
            stats.add(u.json())
    Settings.set('statistics', stats)

@app.task(ignore_results=True, queue='default')
def parse_data(key):
    from . import models
    try:
        session_data = models.SessionData.objects.get(session_key=key)
    except models.SessionData.DoesNotExist:
        return
    session_data.parse_data()
    session_data.save()

@app.task(ignore_results=True, queue='default')
def update_numberoflists(username):
    from . import models
    user = models.User.objects.get(username=username)
    models.SessionData.objects.filter(
        user=user
    ).update(
        numberoflists=user.lists.count()
    )

@app.task(ignore_results=True, queue='default')
def update_numberofcollections(username):
    from . import models
    user = models.User.objects.get(username=username)
    models.SessionData.objects.filter(
        user=user
    ).update(
        numberofcollections=user.collections.count()
    )
