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


@task(queue="encoding")
def update_streams(itemId):
    '''
        create stream, extract timeline and create derivatives
    '''
    item = models.Item.objects.get(itemId=itemId)
    if item.files.filter(is_main=True, is_video=True, available=False).count() == 0:
        item.update_streams()
    return True
