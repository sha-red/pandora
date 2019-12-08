# -*- coding: utf-8 -*-
from celery.task import task

@task(queue="encoding")
def extract_fulltext(id):
    from . import models
    d = models.Document.objects.get(id=id)
    d.update_fulltext()
