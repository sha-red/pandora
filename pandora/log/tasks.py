# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os
from datetime import timedelta, datetime
import gzip
import random
random

from django.conf import settings
from celery.task import task, periodic_task

import models

@periodic_task(run_every=timedelta(days=1), queue='encoding')
def cronjob(**kwargs):
    models.Log.objects.filter(modified__lt=datetime.now()-timedelta(days=30)).delete()
