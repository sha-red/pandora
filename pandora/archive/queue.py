# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division

from datetime import datetime
import time

import celery.task.control

from .models import File


def parse_job(job):
    f = File.objects.get(id=job['args'][0])
    r = {
        'id': job['id'],
        'item': f.item.public_id,
        'file': f.oshash
    }
    if job['time_start']:
        r.update({
        'started': datetime.fromtimestamp(job['time_start']),
        'running': time.time() - job['time_start'],
        })
    if f.encoding:
        r['status'] = f.encoding_status()
    return r

def status():
    status = {
        'active': [],
        'queued': [],
    }
    encoding_jobs = ('archive.tasks.extract_stream', 'archive.tasks.process_stream')
    c = celery.task.control.inspect()
    for job in c.active(safe=True)['pandora-encoding']:
        if job['name'] in encoding_jobs:
            status['active'].append(parse_job(job))
    for job in c.reserved(safe=True)['pandora-encoding']:
        if job['name'] in encoding_jobs:
            status['queued'].append(parse_job(job))
    return status


def fill_queue():
    s = status()
    in_queue = [f['file'] for f in s['active']] + [f['file'] for f in s['queued']]
    check = []
    for f in File.objects.filter(queued=True).exclude(oshash__in=in_queue):
        if f.streams.all().count():
            f.process_stream()
        elif f.data:
            f.extract_stream()
        else:
            print 'not sure what to do with' ,f
            check.append(f)
        in_queue.append(f.oshash)
    for f in File.objects.filter(encoding=True).exclude(oshash__in=in_queue):
        if f.streams.all().count():
            f.process_stream()
        elif f.data:
            f.extract_stream()
        else:
            print 'not sure what to do with' ,f
            check.append(f)
    return check


def get_celery_worker_status():
    ERROR_KEY = "ERROR"
    try:
        insp = celery.task.control.inspect()
        d = insp.stats()
        if not d:
            d = { ERROR_KEY: 'No running Celery workers were found.' }
    except IOError as e:
        from errno import errorcode
        msg = "Error connecting to the backend: " + str(e)
        if len(e.args) > 0 and errorcode.get(e.args[0]) == 'ECONNREFUSED':
            msg += ' Check that the RabbitMQ server is running.'
        d = { ERROR_KEY: msg }
    except ImportError as e:
        d = { ERROR_KEY: str(e)}
    return d