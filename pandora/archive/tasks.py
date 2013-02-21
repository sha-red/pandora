# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from glob import glob

from celery.task import task

from django.conf import settings

from item.models import Item
import models
import extract

_INSTANCE_KEYS = ('mtime', 'path')


def get_or_create_file(volume, f, user, item=None):
    try:
        file = models.File.objects.get(oshash=f['oshash'])
    except models.File.DoesNotExist:
        file = models.File()
        file.oshash = f['oshash']
        file.path = f['path']
        file.path = f['path']
        if item:
            file.item = item
        else:
            file.item = None #gets pupulated later via update_info
        file.save()
    return file

def update_or_create_instance(volume, f):
    #instance with oshash exists
    instance = models.Instance.objects.filter(file__oshash=f['oshash'], volume=volume)
    if instance.count()>0:
        instance = instance[0]
        updated = False
        for key in _INSTANCE_KEYS:
            if f[key] != getattr(instance, key):
                setattr(instance, key, f[key])
                updated=True
        if updated:
            instance.ignore = False
            instance.save()
            instance.file.save()
    else:
        instance = models.Instance.objects.filter(path=f['path'], volume=volume)
        if instance.count()>0:
            #same path, other oshash, keep path/item mapping, remove instance
            item = instance[0].file.item
            instance.delete()
        else: #new instance
            item = None

        instance = models.Instance()
        instance.volume = volume
        instance.file = get_or_create_file(volume, f, volume.user, item) 
        for key in _INSTANCE_KEYS:
            setattr(instance, key, f[key])
        instance.save()
        instance.file.save()
        if instance.file.item:
            instance.file.item.update_wanted()
    return instance

@task(ignore_results=True, queue='default')
def update_files(user, volume, files):
    user = models.User.objects.get(username=user)
    volume, created = models.Volume.objects.get_or_create(user=user, name=volume)
    all_files = []
    folder_depth = settings.CONFIG['site']['folderdepth']
    for f in files:
        if len(f['path'].split('/')) == folder_depth:
            all_files.append(f['oshash'])

    #remove deleted files
    removed = models.Instance.objects.filter(volume=volume).exclude(file__oshash__in=all_files)
    ids = [i['itemId'] for i in Item.objects.filter(
           files__instances__in=removed.filter(file__selected=True)).distinct().values('itemId')]
    removed.delete()
    for f in files:
        if f['oshash'] in all_files:
            update_or_create_instance(volume, f)
    for i in ids:
        i = Item.objects.get(itemId=i)
        i.update_selected()

@task(queue="encoding")
def process_stream(fileId):
    file = models.File.objects.get(id=fileId)

    streams = file.streams.filter(source=None)
    if streams.count() > 0:
        stream = streams[0]
        stream.make_timeline()
        stream.extract_derivatives()
    file.item.update_selected()
    if not file.item.rendered:
        file.item.update_timeline()
    if file.item.rendered:
        file.item.save()
    return True

@task(queue="encoding")
def extract_derivatives(fileId, rebuild=False):
    file = models.File.objects.get(id=fileId)
    streams = file.streams.filter(source=None)
    if streams.count() > 0:
        streams[0].extract_derivatives(rebuild)
    return True

@task(queue="encoding")
def update_stream(id):
    s = models.Stream.objects.get(pk=id)
    if not glob("%s*"%s.timeline_prefix):
        s.make_timeline()
    if not s.color:
        s.cuts = tuple(extract.cuts(s.timeline_prefix))
        s.color = tuple(extract.average_color(s.timeline_prefix))
        s.save()

    s.file.selected = True
    s.file.save()
    s.file.item.update_timeline()
    #make sure all derivatives exist
    s.extract_derivatives()
    s.file.item.save()

    #update clips
    for c in s.file.item.clips.all():
        c.update_calculated_values()
        c.save()
