# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, print_function, absolute_import

from celery.task import task

from . import models


@task(ignore_results=True, queue='default')
def update_itemsort(id):
    try:
        p = models.Person.objects.get(pk=id)
        p.update_itemsort()
    except models.Person.DoesNotExist:
        pass

@task(ignore_results=True, queue='default')
def update_file_paths(id):
    from item.models import Item, ItemFind
    p = models.Person.objects.get(pk=id)
    items = ItemFind.objects.filter(key='name', value__icontains=p.name).values('item_id')
    for i in Item.objects.filter(id__in=items):
        i.update_file_paths()
