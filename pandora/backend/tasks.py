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
def extractData(fileId):
    '''
        update file stuff
        create derivates and other related stuff for a file
    '''
    f = models.File.objects.get(pk=fileId)
    f.extract()

@task(ignore_resulsts=True, queue="encoding")
def updateItem(movidId):
    '''
        update item
        create proxy stream and other related files extracted from itemFiles
    '''
    m = models.Item.objects.get(pk=itemId)
    m.extract()

