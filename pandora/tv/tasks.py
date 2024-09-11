# -*- coding: utf-8 -*-

from datetime import datetime, timedelta

from app.celery import app
from celery.schedules import crontab

from app.utils import limit_rate

from . import models


@app.task(queue='encoding')
def update_program(**kwargs):
    if limit_rate('tv.tasks.update_program', 8 * 60 * 60):
        for c in models.Channel.objects.all():
            c.update_program()
        old = datetime.now() - timedelta(days=180)
        models.Program.objects.filter(created__lt=old).delete()

@app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(timedelta(days=1), update_program.s())
