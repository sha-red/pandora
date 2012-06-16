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

@task(ignore_results=True, queue='encoding')
def get_sequences(itemId):
    i = models.Item.objects.get(itemId=itemId)
    models.Sequence.objects.filter(item=i).delete()
    position = 0
    for stream in i.streams():
        data, position = extract.get_sequences(stream.timeline_prefix, position)
        with transaction.commit_on_success():
            for mode in data:
                for seq in data[mode]:
                    s = models.Sequence()
                    s.item = i
                    s.mode = mode
                    s.start = float('%0.03f' % seq['in'])
                    s.end = float('%0.03f' % seq['out'])
                    s.hash = seq['hash']
                    s.save()

@task(ignore_results=True, queue='encoding')
def update_sequence_ids(itemId):
    for s in models.Sequence.objects.filter(item__itemId=itemId):
        s.save()
