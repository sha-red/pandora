# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, print_function

import json
import subprocess
import shutil
import tempfile
import os

import ox
from django.conf import settings

from item.models import Item
from item.tasks import load_subtitles

import models

info_keys = [
    'title',
    'description',
    'duration',
    'width',
    'height',
    'webpage_url',
    'thumbnail',
    'ext',
    'uploader',
    'subtitles',
    'tags'
]

info_key_map = {
    'webpage_url': 'url',
    'ext': 'extension',
}

def get_info(url):
    cmd = ['youtube-dl', '-j', '--all-subs', url]
    p = subprocess.Popen(cmd,
                         stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE, close_fds=True)
    stdout, stderr = p.communicate()
    stdout = stdout.decode().strip()
    info = []
    if stdout:
        for line in stdout.split('\n'):
            i = json.loads(line)
            if not i.get('is_live'):
                info.append({
                    info_key_map.get(k, k): i[k]
                    for k in info_keys
                    if k in i and i[k]
                })
    return info

def add_subtitles(item, media, tmp):
    for language in media.get('subtitles', {}):
        for subtitle in media['subtitles'][language]:
            if subtitle['ext'] in ('vtt', 'srt'):
                data = ox.cache.read_url(subtitle['url'])
                srt = os.path.join(tmp, 'media.' + subtitle['ext'])
                with open(srt, 'wb') as fd:
                    fd.write(data)
                oshash = ox.oshash(srt)
                sub, created = models.File.objects.get_or_create(oshash=oshash)
                if created:
                    sub.item = item
                    sub.data.name = sub.get_path('data.' + subtitle['ext'])
                    ox.makedirs(os.path.dirname(sub.data.path))
                    shutil.move(srt, sub.data.path)
                    sub.path = '.'.join([media['title'], language, subtitle['ext']])
                    sub.info = ox.avinfo(sub.data.path)
                    if 'path' in sub.info:
                        del sub.info['path']
                    sub.info['extension'] = subtitle['ext']
                    sub.info['language'] = language
                    sub.parse_info()
                    sub.selected = True
                    sub.save()

def download(item_id, url):
    item = Item.objects.get(public_id=item_id)
    info = get_info(url)
    if len(info) != 1:
        return '%s contains %d videos' % (url, len(info))
    media = info[0]
    cdir = os.path.abspath(os.curdir)
    tmp = tempfile.mkdtemp().decode('utf-8')
    os.chdir(tmp)
    cmd = ['youtube-dl', '-q', media['url']]
    p = subprocess.Popen(cmd,
                         stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE, close_fds=True)
    stdout, stderr = p.communicate()
    fname = list(os.listdir(tmp))
    if fname:
        fname = os.path.join(tmp, fname[0])
        oshash = ox.oshash(fname)
        f, created = models.File.objects.get_or_create(oshash=oshash)
        if created:
            f.data.name = f.get_path('data.' + fname.split('.')[-1])
            ox.makedirs(os.path.dirname(f.data.path))
            shutil.move(fname, f.data.path)
            f.item = item
            f.info = ox.avinfo(f.data.path)
            f.info['extension'] = media['extension']
            f.path = '%(title)s.%(extension)s' % media
            f.parse_info()
            f.selected = True
            f.save()
            f.item.save()
            f.extract_stream()
            status = True
        else:
            status = 'file exists'
        add_subtitles(f.item, media, tmp)
    else:
        status = 'download failed'
    os.chdir(cdir)
    shutil.rmtree(tmp)
    return status
