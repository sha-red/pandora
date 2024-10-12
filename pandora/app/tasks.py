# -*- coding: utf-8 -*-

import datetime

from app.celery import app
from celery.schedules import crontab


@app.task(queue='encoding')
def cron(**kwargs):
    from django.db import transaction
    from django.contrib.sessions.models import Session
    
    Session.objects.filter(expire_date__lt=datetime.datetime.now()).delete()
    transaction.commit()


@app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(crontab(hour=6, minute=0), cron.s())
