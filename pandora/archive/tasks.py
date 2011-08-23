# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os

from celery.decorators import task

from item.utils import parse_path
from item.models import get_item
from django.conf import settings

import models

_INSTANCE_KEYS = ('mtime', 'name', 'folder')


def get_or_create_item(volume, f, user):
    in_same_folder = models.Instance.objects.filter(folder=f['folder'], volume=volume)
    if in_same_folder.count() > 0:
        i = in_same_folder[0].file.item
    else:
        if settings.USE_FOLDER:
            item_info = parse_path(f['folder'])
        else:
            item_info = parse_path(f['path'])
        i = get_item(item_info, user)
    return i

def get_or_create_file(volume, f, user, item=None):
    try:
        file = models.File.objects.get(oshash=f['oshash'])
    except models.File.DoesNotExist:
        file = models.File()
        file.oshash = f['oshash']
        file.name = f['name']
        if item:
            file.item = item
        else:
            file.item = get_or_create_item(volume, f, user)
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
            instance.save()
            instance.file.save()
    else:
        instance = models.Instance.objects.filter(name=f['name'], folder=f['folder'], volume=volume)
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
        if instance.name.lower().startswith('extras/') or \
           instance.name.lower().startswith('versions/'):
           instance.extra = True
        instance.save()
        instance.file.save()
    return instance

@task(ignore_resulsts=True, queue='default')
def update_files(user, volume, files):
    user = models.User.objects.get(username=user)
    volume, created = models.Volume.objects.get_or_create(user=user, name=volume)
    all_files = []
    for f in files:
        folder = f['path'].split('/')
        name = folder.pop()
        if folder and folder[-1].lower() in ('extras', 'versions', 'dvds'):
            name = '/'.join([folder.pop(), name])
        f['folder'] = '/'.join(folder)
        f['name'] = name
        all_files.append(f['oshash'])
        update_or_create_instance(volume, f)
    
    #remove deleted files
    #FIXME: can this have any bad consequences? i.e. on the selction of used item files.
    models.Instance.objects.filter(volume=volume).exclude(file__oshash__in=all_files).delete()

@task(queue="encoding")
def process_stream(fileId):
    file = models.File.objects.get(id=fileId)
    streams = file.streams.filter(source=None)
    if streams.count() > 0:
        stream = streams[0]
        stream.make_timeline()
        stream.extract_derivatives()
    file.item.update_timeline()
    return True
