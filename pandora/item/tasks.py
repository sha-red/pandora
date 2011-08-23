# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from datetime import timedelta

from celery.decorators import task, periodic_task

import models


@periodic_task(run_every=timedelta(days=1))
def cronjob(**kwargs):
    print "do some cleanup stuff once a day"


@task(ignore_resulsts=True, queue='default')
def update_poster(itemId):
    item = models.Item.objects.get(itemId=itemId)
    item.make_poster(True)
    item.make_icon()


@task(ignore_resulsts=True, queue='default')
def update_external(itemId):
    item = models.Item.objects.get(itemId=itemId)
    item.update_external()

@task(queue="default")
def update_timeline(itemId):
    item = models.Item.objects.get(itemId=itemId)
    item.update_timeline()

def load_subtitles(itemId):
    item = models.Item.objects.get(itemId=itemId)
    item.load_subtitles()

