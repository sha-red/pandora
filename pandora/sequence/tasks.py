# -*- coding: utf-8 -*-

from six import string_types
from django.db import connection, transaction
from celery.task import task

import item.models
from . import extract

@task(ignore_results=True, queue='encoding')
def get_sequences(public_id):
    from . import models
    i = item.models.Item.objects.get(public_id=public_id)
    models.Sequence.objects.filter(sort=i.sort).delete()
    position = 0
    for stream in i.streams():
        if stream.file.is_video:
            data = extract.get_cut_sequences(stream)
            keys = None
            values = []
            for mode in data:
                for s in data[mode]:
                    sequence = {
                        'sort_id': i.sort.pk,
                        'mode': models.Sequence.MODE[mode],
                        'start': position + float('%0.03f' % s['in']),
                        'end': position + float('%0.03f' % s['out']),
                        'hash': models.parse_hash(s['hash'])
                    }
                    sequence['duration'] = sequence['end'] - sequence['start']
                    if not keys:
                        keys = ', '.join(['"%s"'%k for k in sequence.keys()])
                    v = ', '.join([isinstance(v, string_types) and "'%s'"%v or str(v)
                                   for v in sequence.values()])
                    values.append('(%s)'%v)
            if values:
                cursor = connection.cursor()
                sql = "INSERT INTO sequence_sequence (%s) VALUES %s" % (keys, ', '.join(values));
                cursor.execute(sql)
                transaction.commit()
        position += stream.duration
