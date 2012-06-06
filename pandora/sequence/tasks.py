# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os
from datetime import timedelta, datetime
import gzip
import random
random

from django.conf import settings
from django.db import connection, transaction
from ox.utils import ET
from celery.task import task, periodic_task

import models
import extract

@task(ignore_results=True, queue='default')
def get_sequences(itemId):
    i = models.Item.objects.get(itemId=itemId)
    models.Sequence.objects.filter(item=i).delete()
    data = extract.get_sequences(i.timeline_prefix)
    with transaction.commit_on_success():
        for mode in data:
            for seq in data[mode]:
                s = models.Sequence()
                s.item = i
                s.mode = mode
                s.start = seq['in']
                s.end = seq['out']
                s.hash = seq['hash']
                s.save()
