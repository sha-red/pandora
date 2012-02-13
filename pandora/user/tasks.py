# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os
from datetime import timedelta, datetime
import gzip


from django.conf import settings
from celery.task import task

import models


@task(ignore_resulsts=True, queue='default')
def parse_data(key):
    session_data = models.SessionData.objects.get(session_key=key)
    session_data.parse_data()
