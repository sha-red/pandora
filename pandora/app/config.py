# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import os
import sys
import shutil
import time
import thread

from django.conf import settings
from django.contrib.auth.models import User

import ox.jsonc
from ox.utils import json


_win = (sys.platform == "win32")

RUN_RELOADER = True

def load_config():
    with open(settings.SITE_CONFIG) as f:
        try:
            config = ox.jsonc.load(f)
        except:
            config = None

    if config:
        settings.SITENAME = config['site']['name']
        settings.URL = config['site']['url']
        settings.EMAIL_SUBJECT_PREFIX = '[%s]'%settings.SITENAME
        settings.DEFAULT_FROM_EMAIL = config['site']['email']['system']
        settings.SERVER_EMAIL = config['site']['email']['system']
        config['site']['videoprefix'] = settings.VIDEO_PREFIX

        config['keys'] = {}
        for key in config['itemKeys']:
            config['keys'][key['id']] = key

        settings.CONFIG = config

        admin = len(settings.CONFIG['userLevels']) - 1
        if not 'syncdb' in sys.argv:
            settings.ADMIN = tuple([(u.username, u.email)
                              for u in User.objects.filter(profile__level=admin)])
            settings.MANAGERS = settings.ADMINS

def reloader_thread():
    _config_mtime = 0
    while RUN_RELOADER:
        stat = os.stat(settings.SITE_CONFIG)
        mtime = stat.st_mtime
        if _win:
            mtime -= stat.st_ctime
        if mtime > _config_mtime:
            load_config()
            _config_mtime = mtime
        time.sleep(1)

def update_static():
    oxjs_build = os.path.join(settings.STATIC_ROOT, 'oxjs/tools/build/build.py')
    if os.path.exists(oxjs_build):
        print 'update oxjs'
        if os.path.exists(os.path.join(settings.STATIC_ROOT, 'oxjs/build/Ox.Geo/json/Ox.Geo.json')):
            geo = '-nogeo'
        else:
            geo = ''
        os.system('%s %s >/dev/null' % (oxjs_build, geo))

    data = ''
    js = []
    pandora_js = os.path.join(settings.STATIC_ROOT, 'js/pandora.min.js')
    pandora_json = os.path.join(settings.STATIC_ROOT, 'json/pandora.json')
    for root, folders, files in os.walk(os.path.join(settings.STATIC_ROOT, 'js/pandora')):
        for f in files:
            if f.endswith('.js'):
                js.append(os.path.join(root, f)[len(settings.STATIC_ROOT)+1:])
                with open(os.path.join(root, f)) as j:
                    data += j.read() + '\n'

    print 'write', pandora_js
    with open(pandora_js, 'w') as f:
        data = ox.js.minify(data)
        f.write(data)

    print 'write', pandora_json
    with open(pandora_json, 'w') as f:
        json.dump(sorted(js), f, indent=2)

    for size in (16, 64, 256):
        pandora = os.path.join(settings.STATIC_ROOT, 'png/pandora/icon%d.png'%size)
        image = os.path.join(settings.STATIC_ROOT, 'png/icon%d.png'%size)
        if not os.path.exists(image):
            shutil.copyfile(pandora, image)

    for size in (256, ):
        pandora = os.path.join(settings.STATIC_ROOT, 'png/pandora/logo%d.png'%size)
        image = os.path.join(settings.STATIC_ROOT, 'png/logo%d.png'%size)
        if not os.path.exists(image):
            shutil.copyfile(pandora, image)

    #download geo data
    path = os.path.join(settings.GEOIP_PATH, 'GeoLiteCity.dat')
    if not os.path.exists(path):
        url = 'http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz'
        print 'download', url
        ox.net.saveUrl(url, "%s.gz"%path)
        os.system('gunzip "%s.gz"' % path)

def init():    
    load_config()
    thread.start_new_thread(reloader_thread, ())
