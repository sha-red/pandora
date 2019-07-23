# -*- coding: utf-8 -*-
from __future__ import division, print_function, absolute_import

from glob import glob

from six import string_types
from celery.task import task
from django.conf import settings
from django.db.models import Q

from item.models import Item
from item.tasks import update_poster, update_timeline
from taskqueue.models import Task

from . import models
from . import extract
from . import external

_INSTANCE_KEYS = ('mtime', 'path')


def get_or_create_file(volume, f, user, item=None):
    try:
        file = models.File.objects.get(oshash=f['oshash'])
    except models.File.DoesNotExist:
        file = models.File()
        file.oshash = f['oshash']
        file.path = f['path']
        if item:
            file.item = item
        else:
            file.item = None  # gets pupulated later via update_info
        file.save()
    return file

def update_or_create_instance(volume, f):
    # instance with oshash exists
    instance = models.Instance.objects.filter(file__oshash=f['oshash'], volume=volume)
    if instance.count():
        instance = instance[0]
        updated = False
        for key in _INSTANCE_KEYS:
            if f[key] != getattr(instance, key):
                value = f[key]
                if key == 'path' and models.Instance.objects.filter(path=f[key], volume=volume).count():
                    value = f['oshash']
                setattr(instance, key, value)
                updated = True
        if updated:
            instance.ignore = False
            instance.save()
            instance.file.save()
    else:
        instance = models.Instance.objects.filter(path=f['path'], volume=volume)
        if instance.count():
            # same path, other oshash, keep path/item mapping, remove instance
            item = instance[0].file.item
            instance.delete()
        else:  # new instance
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
    all_files = [f['oshash'] for f in files]

    # remove deleted files
    removed = models.Instance.objects.filter(volume=volume).exclude(file__oshash__in=all_files)
    ids = [i['public_id'] for i in Item.objects.filter(
           files__instances__in=removed.filter(file__selected=True)).distinct().values('public_id')]
    removed.delete()
    fix_path = []
    rebuild_timeline = set()
    for f in files:
        instance = update_or_create_instance(volume, f)
        if instance.path == f['oshash'] and f['path'] != f['oshash']:
            fix_path.append([instance, f['path']])
    for instance, path in fix_path:
        instance.path = path
        instance.save()
        instance.file.save()
        if instance.file.item:
            instance.file.item.update_wanted()
            rebuild_timeline.add(instance.file.item.public_id)
    for i in ids:
        i = Item.objects.get(public_id=i)
        i.update_selected()
    for i in rebuild_timeline:
        i = Item.objects.get(public_id=i)
        Task.start(i, user)
        update_timeline.delay(i.public_id)

@task(ignore_results=True, queue='default')
def update_info(user, info):
    user = models.User.objects.get(username=user)
    files = models.File.objects.filter(oshash__in=list(info))
    for f in files:
        f.update_info(info[f.oshash], user)
        f.save()
    for i in Item.objects.filter(files__in=files).distinct():
        i.update_selected()
        i.update_wanted()
        if not i.rendered:
            Task.start(i, user)
            update_timeline.delay(i.public_id)

@task(queue="encoding")
def process_stream(fileId):
    '''
        process uploaded stream
    '''
    file = models.File.objects.get(id=fileId)
    streams = file.streams.filter(source=None)
    models.File.objects.filter(id=fileId).update(encoding=True, queued=False, failed=False)
    if streams.count() > 0:
        stream = streams[0]
        stream.make_timeline()
        stream.extract_derivatives()
        file = models.File.objects.get(id=fileId)
        file.encoding = False
        file.save()
    file.item.update_selected()
    if not file.item.rendered \
            and not file.item.files.exclude(id=fileId).filter(Q(queued=True) | Q(encoding=True)).count():
        file.item.update_timeline()
        update_poster(file.item.public_id)
    if file.item.rendered:
        file.item.save()
    models.File.objects.filter(id=fileId).update(encoding=False)
    Task.finish(file.item)
    return True

@task(queue="encoding")
def extract_stream(fileId):
    '''
        extract stream from direct upload
    '''
    models.File.objects.filter(id=fileId).update(encoding=True, queued=False, failed=False)
    file = models.File.objects.get(id=fileId)
    if file.data:
        config = settings.CONFIG['video']
        resolution = file.stream_resolution()
        stream, created = models.Stream.objects.get_or_create(
            file=file, resolution=resolution, format=config['formats'][0]
        )
        if created:
            file.extract_frames()
            stream.media.name = stream.path(stream.name())
            stream = stream.encode()
            if stream.available:
                stream.make_timeline()
                stream.extract_derivatives()
                file.extract_tracks()
                # get current version from db
                file = models.File.objects.get(id=fileId)
                if not file.item.rendered \
                        and not file.item.files.exclude(id=fileId).filter(Q(queued=True) | Q(encoding=True)).count():
                    file.item.update_timeline()
                    update_poster(file.item.public_id)
    models.File.objects.filter(id=fileId).update(encoding=False)
    Task.finish(file.item)

@task(queue="encoding")
def extract_derivatives(fileId, rebuild=False):
    file = models.File.objects.get(id=fileId)
    streams = file.streams.filter(source=None)
    if streams.count():
        streams[0].extract_derivatives(rebuild)
    return True

@task(queue="encoding")
def update_stream(id):
    s = models.Stream.objects.get(pk=id)
    if not glob("%s*" % s.timeline_prefix):
        s.make_timeline()
    if not s.color:
        s.cuts = tuple(extract.cuts(s.timeline_prefix))
        s.color = tuple(extract.average_color(s.timeline_prefix))
        s.save()

    s.file.selected = True
    s.file.save()
    s.file.item.update_timeline()
    # make sure all derivatives exist
    s.extract_derivatives()
    s.file.item.save()

    # update clips
    for c in s.file.item.clips.all():
        c.update_calculated_values()
        c.save()

@task(queue="encoding")
def download_media(item_id, url):
    return external.download(item_id, url)

@task(queue='default')
def move_media(data, user):
    from changelog.models import add_changelog
    from item.models import get_item, Item
    from item.utils import is_imdb_id
    from annotation.models import Annotation

    user = models.User.objects.get(username=user)

    if Item.objects.filter(public_id=data['item']).count() == 1:
        i = Item.objects.get(public_id=data['item'])
    else:
        data['public_id'] = data.pop('item').strip()
        if not is_imdb_id(data['public_id']):
            del data['public_id']
            if 'director' in data and isinstance(data['director'], string_types):
                if data['director'] == '':
                    data['director'] = []
                else:
                    data['director'] = data['director'].split(', ')
            i = get_item(data, user=user)
        else:
            i = get_item({'imdbId': data['public_id']}, user=user)
    changed = [i.public_id]
    old_item = None
    for f in models.File.objects.filter(oshash__in=data['ids']):
        if f.item.public_id != i.public_id and f.editable(user):
            if f.item.public_id not in changed:
                changed.append(f.item.public_id)
            old_item = f.item
            f.item = i
            f.save()

    if old_item:
        data['from'] = old_item.public_id

    # If all files are moved to a new item, keep annotations
    if old_item and old_item.files.count() == 0 and i.files.count() == len(data['ids']):
        for a in old_item.annotations.all().order_by('id'):
            a.item = i
            a.set_public_id()
            Annotation.objects.filter(id=a.id).update(item=i, public_id=a.public_id)
        old_item.clips.all().update(item=i, sort=i.sort)

    for public_id in changed:
        c = Item.objects.get(public_id=public_id)
        if c.files.count() == 0 and settings.CONFIG['itemRequiresVideo']:
            c.delete()
        else:
            c.rendered = False
            c.save()
            if c.files.count():
                Task.start(c, user)
                update_timeline.delay(public_id)
    add_changelog({
        'user': user,
        'action': 'moveMedia'
    }, data, i.public_id)
    return {
        'item': i.public_id
    }
