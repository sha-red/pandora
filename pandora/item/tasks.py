# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from datetime import timedelta

from celery.decorators import task, periodic_task
from django.db.models import Q

import models


@periodic_task(run_every=timedelta(days=1))
def cronjob(**kwargs):
    print "do some cleanup stuff once a day"


@task(ignore_resulsts=True, queue='default')
def update_poster(itemId):
    item = models.Item.objects.get(itemId=itemId)
    item.make_poster(True)
    item.make_icon()


@task(ignore_resulsts=True, queue='default')
def update_external(itemId):
    item = models.Item.objects.get(itemId=itemId)
    item.update_external()


@task(queue="encoding")
def update_streams(itemId):
    '''
        create stream, extract timeline and create derivatives
    '''
    item = models.Item.objects.get(itemId=itemId)
    if item.files.filter(is_main=True, is_video=True, available=False).count() == 0:
        item.update_streams()
    return True

def load_subtitles(itemId):
    item = models.Item.objects.get(itemId=itemId)
    layer = models.Layer.objects.get(name='subtitles')
    models.Annotation.objects.filter(layer=layer,item=item).delete()
    offset = 0
    language = ''
    languages = [f.language for f in item.files.filter(is_main=True, is_subtitle=True,
                                                       available=True)]
    if languages:
        if 'en' in languages:
            language = 'en'
        elif '' in languages:
            language = ''
        else:
            language = languages[0] 
    for f in item.files.filter(is_main=True, is_subtitle=True,
                               available=True, language=language).order_by('part'):
            user = f.instances.all()[0].volume.user
            for data in f.srt(offset):
                annotation = models.Annotation(
                    item=f.item,
                    layer=layer,
                    start=data['in'],
                    end=data['out'],
                    value=data['value'],
                    user=user
                )
                annotation.save()
            duration = item.files.filter(Q(is_audio=True)|Q(is_video=True)) \
                                 .filter(is_main=True, available=True, part=f.part)
            if duration:
                duration = duration[0].duration
            else:
                models.Annotation.objects.filter(layer=layer,item=item).delete()
                break
            offset += duration
    item.update_find()

