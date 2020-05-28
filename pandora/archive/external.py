# -*- coding: utf-8 -*-

import json
import subprocess
import shutil
import tempfile
import os

import ox
from django.conf import settings

from item.models import Item
from item.tasks import load_subtitles

from . import models

info_keys = [
    'title',
    'description',
    'webpage_url',
    'display_id',
    'uploader',
    'tags',

    'duration',
    'width',
    'height',
    'ext',
    'thumbnail',
    'subtitles',
]

info_key_map = {
    'webpage_url': 'url',
    'ext': 'extension',
    'display_id': 'id',
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
                if 'tags' not in info[-1]:
                    info[-1]['tags'] = []
                if 'upload_date' in i and i['upload_date']:
                    info[-1]['date'] = '-'.join([i['upload_date'][:4], i['upload_date'][4:6], i['upload_date'][6:]])
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
    if not len(info):
        return '%s contains no videos' % url
    media = info[0]
    cdir = os.path.abspath(os.curdir)
    tmp = tempfile.mkdtemp()
    if isinstance(tmp, bytes):
        tmp = tmp.decode('utf-8')
    os.chdir(tmp)
    cmd = ['youtube-dl', '-q', media['url']]
    if settings.CONFIG['video'].get('reuseUload', False):
        max_resolution = max(settings.CONFIG['video']['resolutions'])
        format = settings.CONFIG['video']['formats'][0]
        if format == 'mp4':
            cmd += [
                '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio',
                '--merge-output-format', 'mp4'
            ]
        elif format == 'webm':
            cmd += ['--merge-output-format', 'webm']

    p = subprocess.Popen(cmd,
                         stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE, close_fds=True)
    stdout, stderr = p.communicate()
    parts = list(os.listdir(tmp))
    if parts:
        part = 1
        for name in parts:
            name = os.path.join(tmp, name)
            oshash = ox.oshash(name)
            f, created = models.File.objects.get_or_create(oshash=oshash)
            if created:
                f.data.name = f.get_path('data.' + name.split('.')[-1])
                ox.makedirs(os.path.dirname(f.data.path))
                shutil.move(name, f.data.path)
                f.item = item
                f.info = ox.avinfo(f.data.path)
                f.info['extension'] = media['extension']
                f.info['url'] = url
                f.path = '%(title)s.%(extension)s' % media
                f.parse_info()
                f.selected = True
                f.queued = True
                if len(parts) > 1:
                    f.part = part
                    part += 1
                f.save()
                f.item.save()
                f.extract_stream()
                status = True
            else:
                status = 'file exists'
        if len(parts) == 1:
            add_subtitles(f.item, media, tmp)
    else:
        status = 'download failed'
    os.chdir(cdir)
    shutil.rmtree(tmp)
    return status
