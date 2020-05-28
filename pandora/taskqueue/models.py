# -*- coding: utf-8 -*-

from datetime import datetime, timedelta
from time import time

from celery.utils import get_full_cls_name
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import models
from django.db.models import Q
import celery.task.control
import kombu.five
import ox

User = get_user_model()

def get_tasks(username):
    from item.models import Item
    tasks = []

    # remove finished tasks
    yesterday = datetime.now() - timedelta(days=1)
    Task.objects.filter(status__in=Task.DONE, ended__lt=yesterday).delete()

    # add task for that might be missing
    '''
    for i in Item.objects.filter(rendered=False).exclude(files__id=None):
        task, created = Task.objects.get_or_create(item=i)
        if created:
            task.started = i.modified
            task.update()
    '''

    qs = Task.objects.all()
    if username:
        qs = qs.filter(user__username=username)
    for task in qs:
        tasks.append(task.json())
    return tasks

class Task(models.Model):
    DONE = ['finished', 'failed', 'canceled']

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    # 'queued|uploading|processing|finished|failed|canceled'
    status = models.CharField(default='unknown', max_length=32)
    started = models.DateTimeField(null=True)
    ended = models.DateTimeField(null=True)
    item = models.ForeignKey("item.Item", related_name='tasks', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='tasks', null=True, on_delete=models.CASCADE)

    def __str__(self):
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
            if not task.started:
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
        from item.models import Item
        try:
            item = self.item.id
        except Item.DoesNotExist:
            return False

        if self.item.files.filter(wanted=True, available=False).count():
            status = 'pending'
        elif self.item.files.filter(uploading=True).count():
            status = 'uploading'
        elif self.item.files.filter(encoding=True).count():
            status = 'processing'
        elif self.item.files.filter(queued=True).count():
            status = 'queued'
        elif self.item.files.filter(failed=True).count():
            status = 'failed'
        elif self.item.rendered:
            status = 'finished'
        elif not self.item.files.count():
            status = 'queued'
        else:
            status = 'unknown'
        if status != self.status:
            self.status = status
            if save:
                self.save()
            return True
        return False

    def get_job(self):
        c = celery.task.control.inspect()
        active = c.active(safe=True)
        if active:
            for queue in active:
                for job in active[queue]:
                    name = job.get('name')
                    args = job.get('args', [])
                    if args:
                        if name in (
                            'item.tasks.update_timeline',
                            'archive.tasks.download_media'
                        ):
                            if args[0] == self.item.public_id:
                                return job
                        elif name in (
                            'archive.tasks.process_stream',
                            'archive.tasks.extract_stream',
                            'archive.tasks.extract_derivatives',
                        ):
                            id = args[0]
                            if self.item.files.filter(id=id).count():
                                return job

    def update_from_queue(self, save=True):
        status = 'unknown'
        job = self.get_job()
        if job:
            if job.get('name') in ('item.tasks.update_timeline', 'archive.tasks.download_media'):
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
        # FIXME: actually cancel task
        if self.status == 'pending':
            for f in self.item.files.filter(wanted=True, available=False):
                f.delete()
        elif self.status == 'uploading':
            for f in self.item.files.filter(wanted=True, available=False):
                f.delete()
            for f in self.item.files.filter(uploading=True):
                f.delete()
        elif self.status in ('processing', 'queued'):
            job = self.get_job()
            if job:
                print(job)
                r = celery.task.control.revoke(job['id'])
                print(r)
                for f in self.item.files.filter(encoding=True):
                    f.delete()
        if not self.item.files.count() and settings.CONFIG.get('itemRequiresVideo'):
            print('delete item')

        self.status = 'canceled'
        self.ended = datetime.now()
        self.save()

    def json(self):
        if self.status != 'canceled':
            self.update()
        data = {
            'started': self.started,
            'ended': self.ended,
            'status': self.status,
            'id': self.public_id,
            'user': self.user and self.user.username or '',
        }
        try:
            data['title'] = self.item.get('title')
            data['item'] = self.item.public_id
        except:
            pass
        return data

