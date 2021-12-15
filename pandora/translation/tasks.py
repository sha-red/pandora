# -*- coding: utf-8 -*-

from datetime import timedelta, datetime

from django.conf import settings

from app.utils import limit_rate
from app.celery import app
from celery.schedules import crontab

@app.task(queue='encoding')
def cronjob(**kwargs):
    if limit_rate('translations.tasks.cronjob', 8 * 60 * 60):
        load_translations()

@app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(timedelta(days=1), cronjob.s())

@app.task(ignore_results=True, queue='encoding')
def load_translations():
    from .models import load_itemkey_translations, load_translations
    load_translations()
    load_itemkey_translations()
