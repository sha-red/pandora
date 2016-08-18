# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from datetime import timedelta

from celery.task import periodic_task

from app.utils import limit_rate

import models


@periodic_task(run_every=timedelta(days=1), queue='encoding')
def update_program(**kwargs):
    if limit_rate('tv.tasks.update_program', 8 * 60 * 60):
        for c in models.Channel.objects.all():
            c.update_program()
