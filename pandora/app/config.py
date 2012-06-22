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

def get_version():
    info = os.path.join(os.path.dirname(__file__), '..', '..', '.bzr/branch/last-revision')
    if os.path.exists(info):
        f = open(info)
        rev = int(f.read().split()[0])
        f.close()
        if rev:
            return u'%s' % rev
    return u'unknown'

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
        config['site']['version'] = get_version()

        config['keys'] = {}
        for key in config['itemKeys']:
            config['keys'][key['id']] = key

        settings.CONFIG = config
        admin = len(settings.CONFIG['userLevels']) - 1
        if not 'syncdb' in sys.argv and not 'sqldiff' in sys.argv:
            if User.objects.filter(profile__level=admin).count() == 0:
                for u in User.objects.filter(is_superuser=True):
                    p = u.get_profile()
                    p.level = admin
                    p.save()
            settings.ADMIN = tuple([(u.username, u.email)
                              for u in User.objects.filter(profile__level=admin)])
            settings.MANAGERS = settings.ADMINS

def reloader_thread():
    _config_mtime = 0
    while RUN_RELOADER:
        try:
            stat = os.stat(settings.SITE_CONFIG)
            mtime = stat.st_mtime
            if _win:
                mtime -= stat.st_ctime
            if mtime > _config_mtime:
                load_config()
                _config_mtime = mtime
        except:
            sys.stderr.write("reloading config failed\n")
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
            if f.endswith('.js') and len(f.split('.'))  == 2:
                f = os.path.join(root, f)
                fsite = f.replace('.js', '.%s.js' % settings.CONFIG['site']['id'])
                if os.path.exists(fsite):
                    f = fsite
                js.append(f[len(settings.STATIC_ROOT)+1:])
                with open(f) as j:
                    data += j.read() + '\n'
    js += [
        'png/icon.png',
    ]
    print 'write', pandora_js
    with open(pandora_js, 'w') as f:
        data = ox.js.minify(data)
        f.write(data)

    print 'write', pandora_json
    with open(pandora_json, 'w') as f:
        json.dump(sorted(js), f, indent=2)

    for f in (pandora_js, pandora_json):
        os.system('gzip -9 -c "%s" > "%s.gz"' % (f, f))

    for root, folders, files in os.walk(os.path.join(settings.STATIC_ROOT, 'oxjs/build')):
            for f in files:
                if os.path.splitext(f)[-1] in ('.js', '.json'):
                    f = os.path.join(root, f)
                    os.system('gzip -9 -c "%s" > "%s.gz"' % (f, f))
    
    for name in ('logo', 'icon'):
        site = os.path.join(settings.STATIC_ROOT, 'png/%s.%s.png'%(name, settings.CONFIG['site']['id']))
        pandora = os.path.join(settings.STATIC_ROOT, 'png/%s.pandora.png'%name)
        image = os.path.join(settings.STATIC_ROOT, 'png/%s.png'%name)
        if not os.path.exists(image):
            if os.path.exists(site):
                shutil.copyfile(site, image)
            else:
                shutil.copyfile(pandora, image)

    #download geo data
    update_geoip()

    #scripts
    for script in (settings.ITEM_POSTER, settings.ITEM_ICON, settings.LIST_ICON):
        if not os.path.exists(script):
            site_script = script.replace('.py', '.%s.py' % settings.CONFIG['site']['id'])
            default_script = script.replace('.py', '.pandora.py')
            if os.path.exists(site_script):
                os.symlink(site_script, script)
            else:
                os.symlink(default_script, script)

def update_geoip(force=False):
    path = os.path.join(settings.GEOIP_PATH, 'GeoLiteCity.dat')
    if not os.path.exists(path) or force:
        url = 'http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz'
        print 'download', url
        ox.net.saveUrl(url, "%s.gz"%path)
        if os.path.exists(path):
            os.unlink(path)
        os.system('gunzip "%s.gz"' % path)

def init():
    load_config()
    thread.start_new_thread(reloader_thread, ())
