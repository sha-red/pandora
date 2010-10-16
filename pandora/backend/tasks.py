# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from datetime import timedelta

from celery.decorators import task, periodic_task

import load
import models


@periodic_task(run_every=timedelta(days=1))
def cronjob(**kwargs):
    print "do some cleanup stuff once a day"

@task(ignore_resulsts=True, queue='default')
def updatePoster(itemId):
    item = models.Item.objects.get(itemId=itemId)
    item.download_poster(True)

@task(ignore_resulsts=True, queue='default')
def updateImdb(imdbId):
    item = models.Item.objects.get(itemId=imdbId)
    item.updateImdb()

@task(ignore_resulsts=True)
def findItem(fileId):
    f = models.File.objects.get(pk=fileId)
    f.findItem()

@task(ignore_resulsts=True, queue="encoding")
def updateStreams(itemId):
    '''
        create stream, extract timeline and create derivatives
    '''
    item = models.Item.objects.get(itemId=itemId)
    if item.files.filter(is_main=True, is_video=True, availble=False).count() == 0:
        item.updateStreams()

