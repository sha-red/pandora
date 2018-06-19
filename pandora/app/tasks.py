# -*- coding: utf-8 -*-
from __future__ import division, print_function, absolute_import

import datetime

from celery.task import periodic_task
from celery.schedules import crontab


@periodic_task(run_every=crontab(hour=6, minute=0), queue='encoding')
def cron(**kwargs):
    from django.db import transaction
    from django.contrib.sessions.models import Session
    Session.objects.filter(expire_date__lt=datetime.datetime.now()).delete()
    transaction.commit()
