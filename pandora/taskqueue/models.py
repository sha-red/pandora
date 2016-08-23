# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, print_function, absolute_import

from datetime import datetime, timedelta
from time import time

from celery.backends import default_backend
from celery.utils import get_full_cls_name
from django.contrib.auth.models import User
from django.db import models
from django.db.models import Q
import celery.task.control
import kombu.five
import ox


def get_tasks(username):
    from item.models import Item
    tasks = []

    # remove finished tasks
    yesterday = datetime.now() - timedelta(days=1)
    Task.objects.filter(status__in=Task.DONE, ended__lt=yesterday).delete()

    # add task for that might be missing
    for i in Item.objects.filter(rendered=False).exclude(files__id=None):
        task, created = Task.objects.get_or_create(item=i)
        if created:
            task.started = i.modified
            task.update()

    qs = Task.objects.all()
    if username:
        qs = qs.filter(user__username=username)
    for task in qs:
        tasks.append(task.json())
    return tasks

class Task(models.Model):
    DONE = ['finished', 'failed', 'cancelled']

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    # 'queued|uploading|processing|finished|failed|cancelled',
    status = models.CharField(default='unknown', max_length=32)
    started = models.DateTimeField(null=True)
    ended = models.DateTimeField(null=True)
    item = models.ForeignKey("item.Item", related_name='tasks')
    user = models.ForeignKey(User, related_name='tasks', null=True)

    def __unicode__(self):
        return "%s [%s]" % (self.item.public_id, self.status)

    @property
    def public_id(self):
        return ox.toAZ(self.id)

    @classmethod
    def get(cls, id):
        return cls.objects.get(pk=ox.fromAZ(id))

    @classmethod
    def start(cls, item, user):
        task, created = cls.objects.get_or_create(item=item)
        if task.update(save=False) or created:
            task.user = user
            task.started = datetime.now()
            task.ended = None
            task.save()

    @classmethod
    def finish(cls, item):
        task, created = cls.objects.get_or_create(item=item)
        task.update()
        if task.status in task.DONE and not task.ended:
            task.ended = datetime.now()
            task.save()

    def update(self, save=True):
        if self.item.files.filter(wanted=True, available=False).count():
            status = 'pending'
        elif self.item.files.filter(uploading=True).count():
            status = 'uploading'
        elif self.item.files.filter(queued=True).count():
            status = 'queued'
        elif self.item.files.filter(encoding=True).count():
            status = 'processing'
        elif self.item.files.filter(failed=True).count():
            status = 'failed'
        elif self.item.rendered:
            status = 'finished'
        else:
            status = 'unknown'
        if status != self.status:
            self.status = status
            if save:
                self.save()
            return True
        return False

    def update_from_queue(self, save=True):
        c = celery.task.control.inspect()
        active = c.active(safe=True)
        status = 'unknown'
        if active:
            for queue in active:
                for job in active[queue]:
                    if job.get('name') in ('item.tasks.update_timeline', ):
                        args = job.get('args', [])
                        if args and args[0] == self.item.public_id:
                            if job.get('time_start'):
                                status = 'processing'
                            else:
                                status = 'queued'
        if status != self.status:
            self.status = status
            if save:
                self.save()
            return True
        return False

    def cancel(self):
        self.state = 'cancelled'
        self.save()
        # FIXME: actually cancel task

    def json(self):
        if self.state != 'cancelled':
            self.update()
        return {
            'started': self.started,
            'ended': self.ended,
            'status': self.status,
            'title': self.item.get('title'),
            'item': self.item.public_id,
            'user': self.user and self.user.username or '',
            'id': self.public_id,
        }

