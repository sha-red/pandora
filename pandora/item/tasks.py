# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os
from datetime import timedelta, datetime
import gzip
import random
random

from django.conf import settings
from ox.utils import ET
from celery.task import task, periodic_task

import models


@periodic_task(run_every=timedelta(days=1))
def cronjob(**kwargs):
    update_random_sort()

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
        random.seed()
        from clip.models import Clip
        ids = [f['id'] for f in Clip.objects.values('id')]
        random.shuffle(ids)
        n = 1
        for i in ids:
            Clip.objects.filter(pk=i).update(random=n)
            n += 1

@task(ignore_resulsts=True, queue='default')
def update_poster(itemId):
    item = models.Item.objects.get(itemId=itemId)
    item.make_poster(True)
    item.make_icon()
    item.save()

@task(ignore_resulsts=True, queue='default')
def update_external(itemId):
    item = models.Item.objects.get(itemId=itemId)
    item.update_external()

@task(queue="default")
def update_timeline(itemId):
    item = models.Item.objects.get(itemId=itemId)
    item.update_timeline()

@task(queue="default")
def load_subtitles(itemId):
    item = models.Item.objects.get(itemId=itemId)
    item.load_subtitles()
    item.update_find()
    item.update_sort()
    item.update_facets()

@task(ignore_resulsts=True, queue='default')
def update_sitemap(base_url):
    sitemap = os.path.abspath(os.path.join(settings.MEDIA_ROOT, 'sitemap.xml.gz'))

    def absolute_url(url):
        return base_url + url

    urlset = ET.Element('urlset')
    urlset.attrib['xmlns'] = "http://www.sitemaps.org/schemas/sitemap/0.9"
    urlset.attrib['xmlns:xsi'] = "http://www.w3.org/2001/XMLSchema-instance"
    urlset.attrib['xsi:schemaLocation'] = "http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
    urlset.attrib['xmlns:video']= "http://www.google.com/schemas/sitemap-video/1.0"

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
    for i in models.Item.objects.filter(level__lte=allowed_level):
        url = ET.SubElement(urlset, "url")
        # URL of the page. This URL must begin with the protocol (such as http)
        loc = ET.SubElement(url, "loc")
        loc.text = absolute_url("%s" % i.itemId)
        # This date should be in W3C Datetime format, can be %Y-%m-%d
        lastmod = ET.SubElement(url, "lastmod")
        lastmod.text = i.modified.strftime("%Y-%m-%d")
        # always, hourly, daily, weekly, monthly, yearly, never
        changefreq = ET.SubElement(url, "changefreq")
        changefreq.text = 'monthly'
        # priority of page on site values 0.1 - 1.0
        priority = ET.SubElement(url, "priority")
        priority.text = '1.0'
        video = ET.SubElement(url, "video:video")
        #el = ET.SubElement(video, "video:content_loc")
        #el.text = absolute_url("%s/video" % i.itemId)
        el = ET.SubElement(video, "video:player_loc")
        el.attrib['allow_embed'] = 'no'
        el.text = absolute_url("%s/video" % i.itemId)
        el = ET.SubElement(video, "video:title")
        el.text = i.get('title')
        el = ET.SubElement(video, "video:thumbnail_loc")
        icon = settings.CONFIG['user']['ui']['icons'] == 'frames' and 'icon' or 'poster'
        el.text = absolute_url("%s/%s256.jpg" %(i.itemId, icon))
        description = i.get('description', i.get('summary', ''))
        if description:
            el = ET.SubElement(video, "video:description")
            el.text = i.get('description', i.get('summary', ''))
        el = ET.SubElement(video, "video:family_friendly")
        el.text = 'Yes'
        duration = i.sort.duration
        if duration > 0:
            el = ET.SubElement(video, "video:duration")
            el.text = "%s" % int(duration)

    with open(sitemap[:-3], 'wb') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(urlset))
    with gzip.open(sitemap, 'wb') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(urlset))
