# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from datetime import timedelta, datetime

from celery.task import task
from django.contrib.auth.models import User

import models

@periodic_task(run_every=timedelta(days=1), queue='encoding')
def update_program(**kwargs):
    user = User.objects.all()[0]
    for c in models.Channel.objects.all():
        c.json(user)
