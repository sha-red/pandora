# -*- coding: utf-8 -*-

from datetime import timedelta, datetime

from app.celery import app
from celery.schedules import crontab

from . import models

@app.task(queue='encoding')
def cronjob(**kwargs):
    models.Log.objects.filter(modified__lt=datetime.now()-timedelta(days=30)).delete()

@app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(timedelta(days=1), cronjob.s())
