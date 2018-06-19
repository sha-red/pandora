# -*- coding: utf-8 -*-
from __future__ import division, print_function, absolute_import

from celery.task import task

from . import models


'''
@periodic_task(run_every=crontab(hour=6, minute=30), queue='encoding')
def update_all_matches(**kwargs):
    ids = [p['id'] for p in models.Place.objects.all().values('id')]
    for i in ids:
        p = models.Place.objects.get(pk=i)
        p.update_matches()
'''

@task(ignore_results=True, queue='default')
def update_matches(id):
    place = models.Place.objects.get(pk=id)
    place.update_matches()

