# -*- coding: utf-8 -*-

import os
from datetime import timedelta, datetime
import gzip
import random

from six.moves.urllib.parse import quote
from celery.task import task, periodic_task
from django.conf import settings
from django.db import connection, transaction
from django.db.models import Q
from ox.utils import ET

from app.utils import limit_rate
from taskqueue.models import Task


@periodic_task(run_every=timedelta(days=1), queue='encoding')
def cronjob(**kwargs):
    if limit_rate('item.tasks.cronjob', 8 * 60 * 60):
        update_random_sort()
        update_random_clip_sort()
        clear_cache.delay()

def update_random_sort():
    from . import models
    if list(filter(lambda f: f['id'] == 'random', settings.CONFIG['itemKeys'])):
        random.seed()
        ids = [f['item'] for f in models.ItemSort.objects.values('item')]
        random.shuffle(ids)
        n = 1
        for i in ids:
            models.ItemSort.objects.filter(pk=i).update(random=n)
            n += 1

def update_random_clip_sort():
    if list(filter(lambda f: f['id'] == 'random', settings.CONFIG['itemKeys'])):
        with transaction.atomic():
            cursor = connection.cursor()
            for row in (
                'DROP TABLE clip_cliprandom',
                'CREATE TABLE "clip_cliprandom" AS SELECT id AS clip_id, row_number() OVER (ORDER BY random()) AS id FROM "clip_clip"',
                'ALTER TABLE "clip_cliprandom" ADD UNIQUE ("clip_id")',
                'ALTER TABLE "clip_cliprandom" ADD UNIQUE ("id")',
                'ALTER TABLE "clip_cliprandom" ALTER COLUMN "id" SET NOT NULL',
                'ALTER TABLE "clip_cliprandom" ALTER COLUMN "clip_id" SET NOT NULL',

            ):
                cursor.execute(row)


@task(ignore_results=True, queue='default')
def update_clips(public_id):
    from . import models
    try:
        item = models.Item.objects.get(public_id=public_id)
    except models.Item.DoesNotExist:
        return
    item.clips.all().update(user=item.user.id)

@task(ignore_results=True, queue='default')
def update_poster(public_id):
    from . import models
    try:
        item = models.Item.objects.get(public_id=public_id)
    except models.Item.DoesNotExist:
        return
    item.remove_poster()
    item.make_poster()
    item.make_icon()
    if item.poster and os.path.exists(item.poster.path):
        models.Item.objects.filter(pk=item.id).update(
            poster=item.poster.name,
            poster_height=item.poster.height,
            poster_width=item.poster.width,
            icon=item.icon.name
        )

@task(ignore_results=True, queue='default')
def update_file_paths(public_id):
    from . import models
    try:
        item = models.Item.objects.get(public_id=public_id)
    except models.Item.DoesNotExist:
        return
    item.update_file_paths()

@task(ignore_results=True, queue='default')
def update_external(public_id):
    from . import models
    try:
        item = models.Item.objects.get(public_id=public_id)
    except models.Item.DoesNotExist:
        return
    item.update_external()

@task(queue="encoding")
def update_timeline(public_id):
    from . import models
    try:
        item = models.Item.objects.get(public_id=public_id)
    except models.Item.DoesNotExist:
        return
    item.update_timeline(async_=False)
    Task.finish(item)

@task(queue="encoding")
def rebuild_timeline(public_id):
    from . import models
    i = models.Item.objects.get(public_id=public_id)
    for s in i.streams():
        s.make_timeline()
    i.update_timeline(async_=False)

@task(queue="encoding")
def load_subtitles(public_id):
    from . import models
    try:
        item = models.Item.objects.get(public_id=public_id)
    except models.Item.DoesNotExist:
        return
    if item.load_subtitles():
        item.update_find()
        item.update_sort()
        item.update_facets()


@task(queue="encoding")
def extract_clip(public_id, in_, out, resolution, format, track=None):
    from . import models
    try:
        item = models.Item.objects.get(public_id=public_id)
    except models.Item.DoesNotExist:
        return False
    if item.extract_clip(in_, out, resolution, format, track):
        return True
    return False


@task(queue="encoding")
def clear_cache(days=60):
    import subprocess
    path = os.path.join(settings.MEDIA_ROOT, 'media')
    cmd = ['find', path, '-iregex', '.*/frames/.*', '-atime', '+%s' % days, '-type', 'f', '-exec', 'rm', '{}', ';']
    subprocess.check_output(cmd)
    path = os.path.join(settings.MEDIA_ROOT, 'items')
    cmd = ['find', path, '-iregex', '.*/cache/.*', '-atime', '+%s' % days, '-type', 'f', '-exec', 'rm', '{}', ';']
    subprocess.check_output(cmd)
    path = settings.MEDIA_ROOT
    cmd = ['find', path, '-type', 'd', '-size', '0', '-prune', '-exec', 'rmdir', '{}', ';']
    subprocess.check_output(cmd)


@task(ignore_results=True, queue='default')
def update_sitemap(base_url):
    from . import models
    sitemap = os.path.abspath(os.path.join(settings.MEDIA_ROOT, 'sitemap.xml.gz'))

    def absolute_url(url):
        return base_url + url

    state = {}
    state['part'] = 1
    state['count'] = 0

    def new_urlset():
        urlset = ET.Element('urlset')
        urlset.attrib['xmlns'] = "http://www.sitemaps.org/schemas/sitemap/0.9"
        urlset.attrib['xmlns:xsi'] = "http://www.w3.org/2001/XMLSchema-instance"
        urlset.attrib['xsi:schemaLocation'] = "http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
        urlset.attrib['xmlns:video'] = "http://www.google.com/schemas/sitemap-video/1.1"
        return urlset

    def save_urlset():
        s = ET.SubElement(sitemap_index, "sitemap")
        loc = ET.SubElement(s, "loc")
        loc.text = absolute_url("sitemap%06d.xml" % state['part'])
        lastmod = ET.SubElement(s, "lastmod")
        lastmod.text = datetime.now().strftime("%Y-%m-%d")
        data = b'<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(state['urlset'])
        path = os.path.abspath(os.path.join(settings.MEDIA_ROOT, 'sitemap%06d.xml.gz' % state['part']))
        with open(path[:-3], 'wb') as f:
            f.write(data)
        with gzip.open(path, 'wb') as f:
            f.write(data)
        state['part'] += 1
        state['count'] = 0
        state['urlset'] = new_urlset()

    def tick():
        state['count'] += 1
        if state['count'] > 40000:
            save_urlset()

    sitemap_index = ET.Element('sitemapindex')
    sitemap_index.attrib['xmlns'] = "http://www.sitemaps.org/schemas/sitemap/0.9"
    sitemap_index.attrib['xmlns:xsi'] = "http://www.w3.org/2001/XMLSchema-instance"
    sitemap_index.attrib['xsi:schemaLocation'] = "http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"

    state['urlset'] = new_urlset()

    url = ET.SubElement(state['urlset'], "url")
    loc = ET.SubElement(url, "loc")
    loc.text = absolute_url('') 
    # always, hourly, daily, weekly, monthly, yearly, never
    changefreq = ET.SubElement(url, "changefreq")
    changefreq.text = 'daily'
    # This date should be in W3C Datetime format, can be %Y-%m-%d
    lastmod = ET.SubElement(url, "lastmod")
    lastmod.text = datetime.now().strftime("%Y-%m-%d")
    # priority of page on site values 0.1 - 1.0
    priority = ET.SubElement(url, "priority")
    priority.text = '1.0'
    tick()

    for page in [s['id'] for s in settings.CONFIG['sitePages']]:
        url = ET.SubElement(state['urlset'], "url")
        loc = ET.SubElement(url, "loc")
        loc.text = absolute_url(page)
        # always, hourly, daily, weekly, monthly, yearly, never
        changefreq = ET.SubElement(url, "changefreq")
        changefreq.text = 'monthly'
        # priority of page on site values 0.1 - 1.0
        priority = ET.SubElement(url, "priority")
        priority.text = '1.0'
        tick()

    allowed_level = settings.CONFIG['capabilities']['canSeeItem']['guest']
    can_play = settings.CONFIG['capabilities']['canPlayVideo']['guest']
    for i in models.Item.objects.filter(level__lte=allowed_level):
        url = ET.SubElement(state['urlset'], "url")
        # URL of the page. This URL must begin with the protocol (such as http)
        loc = ET.SubElement(url, "loc")
        loc.text = absolute_url("%s/info" % i.public_id)
        # This date should be in W3C Datetime format, can be %Y-%m-%d
        lastmod = ET.SubElement(url, "lastmod")
        lastmod.text = i.modified.strftime("%Y-%m-%d")
        # always, hourly, daily, weekly, monthly, yearly, never
        changefreq = ET.SubElement(url, "changefreq")
        changefreq.text = 'monthly'
        # priority of page on site values 0.1 - 1.0
        priority = ET.SubElement(url, "priority")
        priority.text = '1.0'
        if i.rendered and i.level <= can_play:
            video = ET.SubElement(url, "video:video")
            # el = ET.SubElement(video, "video:content_loc")
            # el.text = absolute_url("%s/video" % i.public_id)
            el = ET.SubElement(video, "video:player_loc")
            el.attrib['allow_embed'] = 'no'
            el.text = absolute_url("%s/player" % i.public_id)
            el = ET.SubElement(video, "video:title")
            el.text = i.get('title')
            el = ET.SubElement(video, "video:thumbnail_loc")
            el.text = absolute_url("%s/96p.jpg" % i.public_id)
            description = i.get_item_description()
            if description:
                el = ET.SubElement(video, "video:description")
                el.text = description
            el = ET.SubElement(video, "video:family_friendly")
            el.text = 'Yes'
            duration = i.sort.duration
            if duration and duration > 0:
                el = ET.SubElement(video, "video:duration")
                el.text = "%s" % int(duration)
            el = ET.SubElement(video, "video:live")
            el.text = "no"
        tick()

    # Featured Lists
    from itemlist.models import List
    for l in List.objects.filter(Q(status='featured') | Q(status='public')):
        url = ET.SubElement(state['urlset'], "url")
        # URL of the page. This URL must begin with the protocol (such as http)
        loc = ET.SubElement(url, "loc")
        loc.text = absolute_url("list==%s" % quote(l.get_id()))

        # This date should be in W3C Datetime format, can be %Y-%m-%d
        lastmod = ET.SubElement(url, "lastmod")
        lastmod.text = l.modified.strftime("%Y-%m-%d")
        # always, hourly, daily, weekly, monthly, yearly, never
        changefreq = ET.SubElement(url, "changefreq")
        changefreq.text = 'monthly'
        # priority of page on site values 0.1 - 1.0
        priority = ET.SubElement(url, "priority")
        priority.text = '1.0' if l.status == 'featured' else '0.75'
        tick()

    # Featured Edits
    from edit.models import Edit
    for l in Edit.objects.filter(Q(status='featured') | Q(status='public')):
        url = ET.SubElement(state['urlset'], "url")
        # URL of the page. This URL must begin with the protocol (such as http)
        loc = ET.SubElement(url, "loc")
        loc.text = absolute_url(l.get_absolute_url()[1:])

        # This date should be in W3C Datetime format, can be %Y-%m-%d
        lastmod = ET.SubElement(url, "lastmod")
        lastmod.text = l.modified.strftime("%Y-%m-%d")
        # always, hourly, daily, weekly, monthly, yearly, never
        changefreq = ET.SubElement(url, "changefreq")
        changefreq.text = 'monthly'
        # priority of page on site values 0.1 - 1.0
        priority = ET.SubElement(url, "priority")
        priority.text = '1.0' if l.status == 'featured' else '0.75'
        tick()

    # Featured Collections
    from documentcollection.models import Collection
    for l in Collection.objects.filter(Q(status='featured') | Q(status='public')):
        url = ET.SubElement(state['urlset'], "url")
        # URL of the page. This URL must begin with the protocol (such as http)
        loc = ET.SubElement(url, "loc")
        loc.text = absolute_url("documents/collection==%s" % quote(l.get_id()))

        # This date should be in W3C Datetime format, can be %Y-%m-%d
        lastmod = ET.SubElement(url, "lastmod")
        lastmod.text = l.modified.strftime("%Y-%m-%d")
        # always, hourly, daily, weekly, monthly, yearly, never
        changefreq = ET.SubElement(url, "changefreq")
        changefreq.text = 'monthly'
        # priority of page on site values 0.1 - 1.0
        priority = ET.SubElement(url, "priority")
        priority.text = '1.0' if l.status == 'featured' else '0.75'
        tick()

    from document.models import Document
    for d in Document.objects.filter(rightslevel=0).filter(Q(extension='html') | Q(extension='pdf')):
        url = ET.SubElement(state['urlset'], "url")
        # URL of the page. This URL must begin with the protocol (such as http)
        loc = ET.SubElement(url, "loc")
        loc.text = absolute_url(d.get_id())

        # This date should be in W3C Datetime format, can be %Y-%m-%d
        lastmod = ET.SubElement(url, "lastmod")
        lastmod.text = d.modified.strftime("%Y-%m-%d")
        # always, hourly, daily, weekly, monthly, yearly, never
        changefreq = ET.SubElement(url, "changefreq")
        changefreq.text = 'monthly'
        # priority of page on site values 0.1 - 1.0
        priority = ET.SubElement(url, "priority")
        priority.text = '0.75'
        if d.collections.filter(Q(status='featured') | Q(status='public')).count():
            priority.text = '1.0'
        tick()
    if state['count']:
        save_urlset()
    data = b'<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(sitemap_index)
    with open(sitemap[:-3], 'wb') as f:
        f.write(data)
    with gzip.open(sitemap, 'wb') as f:
        f.write(data)
