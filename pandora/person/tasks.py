# -*- coding: utf-8 -*-


from . import models
from app.celery import app


@app.task(ignore_results=True, queue='default')
def update_itemsort(id):
    try:
        p = models.Person.objects.get(pk=id)
        p.update_itemsort()
    except models.Person.DoesNotExist:
        pass

@app.task(ignore_results=True, queue='default')
def update_file_paths(id):
    from item.models import Item, ItemFind
    p = models.Person.objects.get(pk=id)
    items = ItemFind.objects.filter(key='name', value__icontains=p.name).values('item_id')
    for i in Item.objects.filter(id__in=items):
        i.update_file_paths()
