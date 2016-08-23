# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, print_function, absolute_import

from datetime import timedelta, datetime

from celery.task import periodic_task

from . import models

@periodic_task(run_every=timedelta(days=1), queue='encoding')
def cronjob(**kwargs):
    models.Log.objects.filter(modified__lt=datetime.now()-timedelta(days=30)).delete()
