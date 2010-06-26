# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from datetime import timedelta

from celery.decorators import task, periodic_task

import load
import models


@periodic_task(run_every=timedelta(days=1))
def cronjob(**kwargs):
    print "do some cleanup stuff once a day"

@task(ignore_resulsts=True)
def loadIMDb(imdbId):
    load.loadIMDb(imdbId)

@task(ignore_resulsts=True)
def findMovie(fileId):
    f = models.File.objects.get(pk=fileId)
    f.findMovie()

@task(ignore_resulsts=True, exchange="encoding")
def extractData(fileId):
    '''
        update file stuff
        create derivates and other related stuff for a file
    '''
    f = models.File.objects.get(pk=fileId)
    f.extract()

@task(ignore_resulsts=True, exchange="encoding")
def updateMovie(movidId):
    '''
        update movie
        create proxy stream and other related files extracted from movieFiles
    '''
    m = models.Movie.objects.get(pk=movieId)
    m.extract()

