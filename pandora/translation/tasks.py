# -*- coding: utf-8 -*-
from __future__ import division, print_function, absolute_import

from datetime import timedelta, datetime

from celery.task import task, periodic_task
from django.conf import settings

from app.utils import limit_rate

@periodic_task(run_every=timedelta(days=1), queue='encoding')
def cronjob(**kwargs):
    if limit_rate('translations.tasks.cronjob', 8 * 60 * 60):
        load_translations()

@task(ignore_results=True, queue='encoding')
def load_translations():
    from .models import load_itemkey_translations, load_translations
    load_translations()
    load_itemkey_translations()
