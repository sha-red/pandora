# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, print_function, absolute_import

from datetime import datetime, timedelta

from celery.task import periodic_task

from app.utils import limit_rate

from . import models


@periodic_task(run_every=timedelta(days=1), queue='encoding')
def update_program(**kwargs):
    if limit_rate('tv.tasks.update_program', 8 * 60 * 60):
        for c in models.Channel.objects.all():
            c.update_program()
        old = datetime.now() - timedelta(days=180)
        models.Program.objects.filter(created__lt=old).delete()
