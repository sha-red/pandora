# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import json
from datetime import timedelta
from itertools import izip_longest

from celery.task import task, periodic_task

import models
from app.models import Settings
from statistics import Statistics

@periodic_task(run_every=timedelta(hours=1), queue='encoding')
def cronjob(**kwargs):
    update_statistics()

def update_statistics():
    def chunker(iterable, chunksize, filler):
        return izip_longest(*[iter(iterable)]*chunksize, fillvalue=filler)

    stats = Statistics()
    ids = [i['session_key']
        for i in models.SessionData.objects.filter(level__gte=0).values('session_key')]

    for chunk in chunker(ids, 100, None):
        chunk = filter(None, chunk)
        for u in models.SessionData.objects.filter(pk__in=chunk):
            stats.add(u.json())
    Settings.set('statistics', stats)

@task(ignore_results=True, queue='default')
def parse_data(key):
    session_data = models.SessionData.objects.get(session_key=key)
    session_data.parse_data()
    session_data.save()

@task(ignore_results=True, queue='default')
def update_numberoflists(username):
    user = models.User.objects.get(username=username)
    models.SessionData.objects.filter(
        user=user
    ).update(
        numberoflists=user.lists.count()
    )
