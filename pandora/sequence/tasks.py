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
        keys = None
        values = []
        for mode in data:
            for s in data[mode]:
                sequence = {
                    'item_id': i.pk,
                    'sort_id': i.sort.pk,
                    'mode': mode,
                    'start': float('%0.03f' % s['in']),
                    'end': float('%0.03f' % s['out']),
                    'hash': s['hash']
                }
                sequence['public_id'] = u"%s/%0.03f-%0.03f" % (
                    i.itemId, sequence['start'], sequence['end']
                )
                sequence['duration'] = sequence['end'] - sequence['start']
                if not keys:
                    keys = ', '.join(['"%s"'%k for k in sequence.keys()])
                v = ', '.join([isinstance(v, basestring) and "'%s'"%v or str(v)
                               for v in sequence.values()])
                values.append('(%s)'%v)

        cursor = connection.cursor()
        sql = "INSERT INTO sequence_sequence (%s) VALUES %s" % (keys, ', '.join(values));
        cursor.execute(sql)
        transaction.commit_unless_managed()

@task(ignore_results=True, queue='encoding')
def update_sequence_ids(itemId):
    for s in models.Sequence.objects.filter(item__itemId=itemId):
        s.save()
