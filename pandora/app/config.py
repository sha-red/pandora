
# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import os
import sys
import time
import thread

from django.conf import settings
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
        config['site']['id'] = settings.SITEID
        config['site']['name'] = settings.SITENAME
        config['site']['sectionName'] = settings.SITENAME
        config['site']['url'] = settings.URL
        config['site']['videoprefix'] = settings.VIDEO_PREFIX

        config['keys'] = {}
        for key in config['itemKeys']:
            config['keys'][key['id']] = key

        settings.CONFIG = config

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
        os.system(oxjs_build)

    data = ''
    js = []
    pandora_js = os.path.join(settings.STATIC_ROOT, 'js/pandora.js')
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

def init():    
    load_config()
    thread.start_new_thread(reloader_thread, ())
