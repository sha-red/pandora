# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from datetime import timedelta

from celery.decorators import task, periodic_task

import models


@task(ignore_resulsts=True, queue='default')
def update_matches(id):
    place = models.Place.objects.get(pk=id)
    place.update_matches()
