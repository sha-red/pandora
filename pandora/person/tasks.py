# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from celery.task import task

import models


@task(ignore_resulsts=True, queue='default')
def update_itemsort(id):
    p = models.Person.objects.get(pk=id)
    p.update_itemsort()
