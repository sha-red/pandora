# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os

from celery.decorators import task

from item.utils import parse_path
from item.models import get_item

import models


@task(ignore_resulsts=True, queue='default')
def update_files(user, volume, files):
    user = models.User.objects.get(username=user)
    volume, created = models.Volume.objects.get_or_create(user=user, name=volume)
    all_files = []
    for f in files:
        path = f['path']
        folder = path.split('/')
        name = folder.pop()
        if folder and folder[-1] in ('Extras', 'Versions', 'DVDs'):
            name = '/'.join([folder.pop(), name])
        folder = '/'.join(folder)
        #print folder
        #print name
        f['folder'] = folder
        f['name'] = name
        oshash = f['oshash']
        all_files.append(oshash)

        same_folder = models.Instance.objects.filter(folder=folder, volume=volume)
        if same_folder.count() > 0:
            i = same_folder[0].file.item
        else:
            i = None

        path = os.path.join(folder, name)

        instance = models.Instance.objects.filter(file__oshash=oshash, volume=volume)
        if instance.count()>0:
            instance = instance[0]
            updated = False
            for key in ('mtime', 'name', 'folder'):
                if f[key] != getattr(instance, key):
                    setattr(instance, key, f[key])
                    updated=True
            if updated:
                instance.save()
        else:
            #look if oshash is known
            file_objects = models.File.objects.filter(oshash=oshash)
            if file_objects.count() > 0:
                file_object = file_objects[0]
            #new oshash, add to database
            else:
                if not i:
                    item_info = parse_path(folder)
                    i = get_item(item_info)
                file_object = models.File()
                file_object.oshash = oshash
                file_object.name = name
                file_object.item = i
                file_object.save()
            instance = models.Instance()
            instance.volume = volume
            instance.file = file_object
            for key in ('mtime', 'name', 'folder'):
                setattr(instance, key, f[key])
            instance.save()

    #remove deleted files
    #FIXME: can this have any bad consequences? i.e. on the selction of used item files.
    models.Instance.objects.filter(volume=volume).exclude(file__oshash__in=all_files).delete()
