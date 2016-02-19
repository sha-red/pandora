# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os
from datetime import timedelta, datetime
import gzip
import random
random

from django.conf import settings
from django.db import connection, transaction
from django.db.models import Q
from ox.utils import ET
from celery.task import task, periodic_task

import models
from text.models import Text

@periodic_task(run_every=timedelta(days=1), queue='encoding')
def cronjob(**kwargs):
    update_random_sort()
    update_random_clip_sort()

def update_random_sort():
    if filter(lambda f: f['id'] == 'random', settings.CONFIG['itemKeys']):
        random.seed()
        ids = [f['item'] for f in models.ItemSort.objects.values('item')]
        random.shuffle(ids)
        n = 1
        for i in ids:
            models.ItemSort.objects.filter(pk=i).update(random=n)
            n += 1

def update_random_clip_sort():
    if filter(lambda f: f['id'] == 'random', settings.CONFIG['itemKeys']):
        with transaction.atomic():
            cursor = connection.cursor()
            cursor.execute('DROP TABLE clip_random;')
            cursor.execute('CREATE TABLE "clip_random" AS SELECT id AS clip_id, row_number() OVER (ORDER BY random()) AS random FROM "clip_clip"')
            cursor.execute('ALTER TABLE "clip_random" ADD UNIQUE ("clip_id")')
            cursor.execute('CREATE INDEX "clip_random_random" ON "clip_random" ("random")')

@task(ignore_results=True, queue='default')
def update_clips(public_id):
    item = models.Item.objects.get(public_id=public_id)
    item.clips.all().update(user=item.user.id)

@task(ignore_results=True, queue='default')
def update_poster(public_id):
    item = models.Item.objects.get(public_id=public_id)
    item.make_poster(True)
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
    item = models.Item.objects.get(public_id=public_id)
    for f in item.files.all():
        if f.normalize_path() != f.path:
            f.save()

@task(ignore_results=True, queue='default')
def update_external(public_id):
    item = models.Item.objects.get(public_id=public_id)
    item.update_external()

@task(queue="encoding")
def update_timeline(public_id):
    item = models.Item.objects.get(public_id=public_id)
    item.update_timeline(async=False)

@task(queue="encoding")
def rebuild_timeline(public_id):
    i = models.Item.objects.get(public_id=public_id)
    for s in i.streams():
        s.make_timeline()
    i.update_timeline(async=False)

@task(queue="encoding")
def load_subtitles(public_id):
    item = models.Item.objects.get(public_id=public_id)
    if item.load_subtitles():
        item.update_find()
        item.update_sort()
        item.update_facets()

@task(ignore_results=True, queue='default')
def update_sitemap(base_url):
    sitemap = os.path.abspath(os.path.join(settings.MEDIA_ROOT, 'sitemap.xml.gz'))

    def absolute_url(url):
        return base_url + url

    urlset = ET.Element('urlset')
    urlset.attrib['xmlns'] = "http://www.sitemaps.org/schemas/sitemap/0.9"
    urlset.attrib['xmlns:xsi'] = "http://www.w3.org/2001/XMLSchema-instance"
    urlset.attrib['xsi:schemaLocation'] = "http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
    urlset.attrib['xmlns:video']= "http://www.google.com/schemas/sitemap-video/1.1"

    url = ET.SubElement(urlset, "url")
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

    for page in [s['id'] for s in settings.CONFIG['sitePages']]:
        url = ET.SubElement(urlset, "url")
        loc = ET.SubElement(url, "loc")
        loc.text = absolute_url(page)
        # always, hourly, daily, weekly, monthly, yearly, never
        changefreq = ET.SubElement(url, "changefreq")
        changefreq.text = 'monthly'
        # priority of page on site values 0.1 - 1.0
        priority = ET.SubElement(url, "priority")
        priority.text = '1.0'

    allowed_level = settings.CONFIG['capabilities']['canSeeItem']['guest']
    can_play = settings.CONFIG['capabilities']['canPlayVideo']['guest']
    for i in models.Item.objects.filter(level__lte=allowed_level):
        url = ET.SubElement(urlset, "url")
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
            #el = ET.SubElement(video, "video:content_loc")
            #el.text = absolute_url("%s/video" % i.public_id)
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
            if duration > 0:
                el = ET.SubElement(video, "video:duration")
                el.text = "%s" % int(duration)
            el = ET.SubElement(video, "video:live")
            el.text = "no"

    if Text.objects.filter(name='').exclude(text='').exists():
        t = Text.objects.filter(name='')[0]
        url = ET.SubElement(urlset, "url")
        # URL of the page. This URL must begin with the protocol (such as http)
        loc = ET.SubElement(url, "loc")
        loc.text = absolute_url('/texts')
        # This date should be in W3C Datetime format, can be %Y-%m-%d
        lastmod = ET.SubElement(url, "lastmod")
        lastmod.text = t.modified.strftime("%Y-%m-%d")
        # always, hourly, daily, weekly, monthly, yearly, never
        changefreq = ET.SubElement(url, "changefreq")
        changefreq.text = 'monthly'
        # priority of page on site values 0.1 - 1.0
        priority = ET.SubElement(url, "priority")
        priority.text = '1.0'

    for t in Text.objects.filter(Q(status='featured')|Q(status='public')):
        url = ET.SubElement(urlset, "url")
        # URL of the page. This URL must begin with the protocol (such as http)
        loc = ET.SubElement(url, "loc")
        loc.text = absolute_url(t.get_absolute_url()[1:])

        # This date should be in W3C Datetime format, can be %Y-%m-%d
        lastmod = ET.SubElement(url, "lastmod")
        lastmod.text = t.modified.strftime("%Y-%m-%d")
        # always, hourly, daily, weekly, monthly, yearly, never
        changefreq = ET.SubElement(url, "changefreq")
        changefreq.text = 'monthly'
        # priority of page on site values 0.1 - 1.0
        priority = ET.SubElement(url, "priority")
        priority.text = '1.0' if t.status == 'featured' else '0.75'

    data = '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(urlset)
    with open(sitemap[:-3], 'wb') as f:
        f.write(data)
    with gzip.open(sitemap, 'wb') as f:
        f.write(data)
