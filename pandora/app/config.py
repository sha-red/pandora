# -*- coding: utf-8 -*-
from __future__ import division, print_function, absolute_import

import os
import sys
import shutil
import subprocess
import time
import codecs
from os.path import dirname, exists, join
from glob import glob

from six.moves import _thread as thread
from django.conf import settings
from django.contrib.auth import get_user_model

import ox.jsonc
from ox.utils import json

from archive.extract import supported_formats
from item.utils import get_by_id

User = get_user_model()

_win = (sys.platform == "win32")

RUN_RELOADER = True
NOTIFIER = None

def get_version():
    info = join(dirname(dirname(dirname(__file__))), '.bzr', 'branch', 'last-revision')
    git_dir = join(dirname(dirname(dirname(__file__))), '.git')
    if exists(git_dir):
        env = {'GIT_DIR': git_dir}
        cmd = ['git', 'rev-list', 'HEAD', '--count']
        return subprocess.check_output(cmd, env=env).strip().decode('utf-8')
    elif exists(info):
        f = open(info)
        rev = int(f.read().split()[0])
        f.close()
        if rev:
            return u'%s' % rev
    else:
        return u'unknown'

def load_config(init=False):
    with open(settings.SITE_CONFIG) as f:
        try:
            config = ox.jsonc.load(f)
        except ValueError as e:
            if init:
                print("Failed to parse %s:\n" % settings.SITE_CONFIG)
                print(e)
                sys.exit(1)
            else:
                config = None

    with open(settings.DEFAULT_CONFIG) as f:
        try:
            default = ox.jsonc.load(f)
        except ValueError as e:
            if init:
                print("Failed to default config %s:\n" % settings.DEFAULT_CONFIG)
                print(e)
                sys.exit(1)
            else:
                default = None

    if config:
        settings.SITENAME = config['site']['name']
        if getattr(settings, 'SITEURL', False):
            config['site']['url'] = settings.SITEURL
        settings.URL = config['site']['url']
        settings.EMAIL_SUBJECT_PREFIX = '[%s]' % settings.SITENAME
        settings.DEFAULT_FROM_EMAIL = config['site']['email']['system']
        settings.SERVER_EMAIL = config['site']['email']['system']
        config['site']['videoprefix'] = settings.VIDEO_PREFIX
        config['site']['mediaprefix'] = settings.MEDIA_PREFIX
        config['site']['googleapikey'] = getattr(settings, 'GOOGLE_API_KEY')
        config['site']['version'] = get_version()
        config['site']['dontValidateUser'] = not settings.AUTH_CHECK_USERNAME
        if 'folderdepth' not in config['site']:
            config['site']['folderdepth'] = settings.USE_IMDB and 4 or 3
        if 'sendReferrer' in config and 'sendReferrer' not in config['site']:
            config['site']['sendReferrer'] = config.pop('sendReferrer')

        # enable default filters if needed
        default_filters = [f['id'] for f in config['user']['ui']['filters']]
        available_filters = [key['id'] for key in config['itemKeys'] if key.get('filter')]
        unknown_ids = set(default_filters) - set(available_filters)
        if unknown_ids:
            sys.stderr.write('WARNING: unknown item keys in default filters: %s.\n' % list(unknown_ids))
            unused_filters = [key for key in available_filters if key not in default_filters]
            if len(unused_filters) < len(unknown_ids):
                sys.stderr.write('you need at least 5 item filters')
            else:
                auto_filters = unused_filters[:len(unknown_ids)]
                default_filters += auto_filters
                for key in auto_filters:
                    config['user']['ui']['filters'].append({
                        "id": key, "sort": [{"key": "items", "operator": "-"}]
                    })
                sys.stderr.write('         using the following document filters instead: %s.\n' % auto_filters)
        for key in config['itemKeys']:
            if key['id'] in default_filters and not key.get('filter'):
                key['filter'] = True
                sys.stderr.write('enabled filter for "%s" since its used as default filter.\n' % (key['id']))

        # enable default document filters if needed
        default_filters = [f['id'] for f in config['user']['ui']['documentFilters']]
        available_filters = [key['id'] for key in config['documentKeys'] if key.get('filter')]
        unknown_ids = set(default_filters) - set(available_filters)
        if unknown_ids:
            sys.stderr.write('WARNING: unknown document keys in default filters: %s.\n' % list(unknown_ids))
            unused_filters = [key for key in available_filters if key not in default_filters]
            if len(unused_filters) < len(unknown_ids):
                sys.stderr.write('you need at least 5 item filters')
            else:
                auto_filters = unused_filters[:len(unknown_ids)]
                default_filters += auto_filters
                for key in auto_filters:
                    config['user']['ui']['documentFilters'].append({
                        "id": key, "sort": [{"key": "items", "operator": "-"}]
                    })
                sys.stderr.write('         using the following document filters instead: %s.\n' % auto_filters)

        for key in config['documentKeys']:
            if key['id'] in default_filters and not key.get('filter'):
                key['filter'] = True
                sys.stderr.write('enabled filter for document key "%s" since its used as default filter.\n' % (key['id']))

        config['keys'] = {}
        for key in config['itemKeys']:
            config['keys'][key['id']] = key

        # add missing defaults
        for section in sorted((
            'capabilities', 'cantPlay',
            'documentKeys', 'documentRightsLevels',
            'entities', 'itemName', 'itemTitleKeys', 'itemKeys', 'media', 'posters',
            'site', 'tv', 'user.ui', 'user.ui.part', 'user.ui.showFolder',
            'menuExtras', 'languages',
            'annotations',
        )):
            parts = [p.replace('\0', '\\.') for p in section.replace('\\.', '\0').split('.')]
            # print('checking', section)
            c = config
            d = default
            while len(parts):
                part = parts.pop(0)
                d = d[part]
                if part not in c:
                    if isinstance(d, list):
                        c[part] = []
                    else:
                        c[part] = {}
                c = c[part]
            if isinstance(d, list):
                if not c and section not in ('entities', ):
                    c += d
                    sys.stderr.write("adding default value:\n\t\"%s\": %s,\n\n" % (
                        section, json.dumps(d)))
            else:
                added = []
                for key in sorted(d):
                    if key not in c:
                        added.append("\"%s\": %s," % (key, json.dumps(d[key])))
                        c[key] = d[key]
                if added:
                    sys.stderr.write("adding default %s:\n\t" % section)
                    sys.stderr.write("\n\t".join(added) + '\n\n')

        # add entities if needed
        if len(config.get('entities', [])) and not [k for k in config['documentKeys'] if k['id'] == 'entites']:
            config['documentKeys'].append({
                'id': 'entity',
                'title': 'Entity',
                'type': 'string',
                'find': True
            })

        key = 'documentRightsLevel'
        if key not in config:
            config[key] = {}
        for level in config['userLevels']:
            if level not in config[key]:
                config[key] = default.get(key, 0)

        config['user']['ui']['documentsSort'] = [
            s for s in config['user']['ui']['documentsSort']
            if get_by_id(config['documentKeys'], s['key'])
        ]
        if not config['user']['ui']['documentsSort']:
            sort_key = [k for k in config['documentKeys'] if k['id'] != '*'][0]
            config['user']['ui']['documentsSort'] = [{
                "key": sort_key['id'],
                "operator": sort_key.get('operator', '+')
            }]

        for key in ('language', 'importMetadata'):
            if key not in config:
                sys.stderr.write("adding default value:\n\t\"%s\": %s,\n\n" % (key, json.dumps(default[key])))
                config[key] = default[key]

        key = get_by_id(config['itemKeys'], 'title')
        if not 'autocompleteSort' in key:
            key['autocompleteSort'] = get_by_id(default['itemKeys'], 'title')['autocompleteSort']
            sys.stderr.write("adding default value to itemKeys.title.autocompleteSort:\n\t\"autocompleteSort\": %s,\n\n" % json.dumps(key['autocompleteSort']))

        if 'downloadFormat' not in config['video']:
            config['video']['downloadFormat'] = default['video']['downloadFormat']

        old_formats = getattr(settings, 'CONFIG', {}).get('video', {}).get('formats', [])
        formats = config.get('video', {}).get('formats')
        if set(old_formats) != set(formats):
            sformats = supported_formats()
            settings.FFMPEG_SUPPORTS_VP9 = 'vp9' in sformats
            try:
                settings.CHOP_SUPPORT = int(sformats.get('version', ['0'])[0]) > 2
            except:
                settings.CHOP_SUPPORT = False
            if sformats:
                for f in formats:
                    if f not in sformats or not sformats[f]:
                        sys.stderr.write('''WARNING:
Your configuration contains a video format "%s" that is
not supported by your version of ffmpeg. Make sure you
dont have a local version of ffmpeg in /usr/local/bin
and ffmpeg is installed from ppa:j/pandora:

    sudo add-apt-repository ppa:j/pandora
    sudo apt-get install ffmpeg
''' % f)
            else:
                sys.stderr.write('''WARNING:
You dont have "ffmpeg" installed. To fix this on Ubuntu 14.04, run:

    sudo add-apt-repository ppa:j/pandora
    sudo apt-get install ffmpeg

check the README for further details.

''')

        settings.CONFIG = config
        admin = len(settings.CONFIG['userLevels']) - 1
        if not 'syncdb' in sys.argv \
            and not 'sqldiff' in sys.argv \
            and not 'migrate' in sys.argv:
            try:
                if User.objects.filter(profile__level=admin).count() == 0:
                    for u in User.objects.filter(is_superuser=True):
                        p = u.profile
                        p.level = admin
                        p.save()
                settings.ADMIN = tuple([(u.username, u.email)
                                  for u in User.objects.filter(profile__level=admin)])
                settings.MANAGERS = settings.ADMINS
            except:
                pass



def reloader_thread():
    global NOTIFIER
    settings.RELOADER_RUNNING=True
    _config_mtime = 0
    try:
        import pyinotify
        INOTIFY = True
    except:
        INOTIFY = False
    if INOTIFY:
        def add_watch():
            name = os.path.realpath(settings.SITE_CONFIG)
            wm.add_watch(name, pyinotify.IN_CLOSE_WRITE, reload_config)

        def reload_config(event):
            load_config()
            add_watch()

        wm = pyinotify.WatchManager()
        add_watch()
        notifier = pyinotify.Notifier(wm)
        NOTIFIER = notifier
        notifier.loop()
    else:
        while RUN_RELOADER:
            try:
                stat = os.stat(settings.SITE_CONFIG)
                mtime = stat.st_mtime
                if _win:
                    mtime -= stat.st_ctime
                if mtime > _config_mtime:
                    load_config()
                    _config_mtime = mtime
                time.sleep(10)
            except:
                #sys.stderr.write("reloading config failed\n")
                pass

def update_static():
    oxjs_build = os.path.join(settings.STATIC_ROOT, 'oxjs/tools/build/build.py')
    if os.path.exists(oxjs_build):
        print('update oxjs')
        os.system('%s >/dev/null' % oxjs_build)

    data = ''
    js = []
    pandora_js = os.path.join(settings.STATIC_ROOT, 'js/pandora.min.js')
    pandora_json = os.path.join(settings.STATIC_ROOT, 'json/pandora.json')
    for root, folders, files in os.walk(os.path.join(settings.STATIC_ROOT, 'js')):
        for f in files:
            if f.startswith('._'):
                continue
            f = os.path.join(root, f)
            #ignore old embed js file
            if 'js/embed/' in f:
                continue
            if len(f.split('.')) == 2:
                fsite = f.replace('.js', '.%s.js' % settings.CONFIG['site']['id'])
            else:
                fsite = f
            basefile = f.split('.')[0] + '.js'
            if f.split('/')[-1] not in (
                'pandora.js', 'pandora.min.js'
            ) and f.endswith('.js') and (
                len(f.split('.')) == 2 or
                not os.path.exists(basefile) and fsite == f
            ):
                if os.path.exists(fsite):
                    f = fsite
                js.append(f[len(settings.STATIC_ROOT)+1:])
                with open(f) as j:
                    data += j.read() + '\n'
    js += [
        'png/icon.png',
    ]
    print('write', pandora_js)
    data = ox.js.minify(data)
    with open(pandora_js, 'w') as f:
        f.write(data)

    print('write', pandora_json)
    with open(pandora_json, 'w') as f:
        json.dump(sorted(js), f, indent=2)

    for f in (pandora_js, pandora_json):
        os.system('gzip -9 -c "%s" > "%s.gz"' % (f, f))

    for root, folders, files in os.walk(os.path.join(settings.STATIC_ROOT, 'oxjs/min')):
            for f in files:
                if os.path.splitext(f)[-1] in ('.js', '.json'):
                    f = os.path.join(root, f)
                    os.system('gzip -9 -c "%s" > "%s.gz"' % (f, f))

    for name in ('logo', 'icon', 'document'):
        site = os.path.join(settings.STATIC_ROOT, 'png/%s.%s.png' % (name, settings.CONFIG['site']['id']))
        pandora = os.path.join(settings.STATIC_ROOT, 'png/%s.pandora.png' % name)
        image = os.path.join(settings.STATIC_ROOT, 'png/%s.png' % name)
        if not os.path.exists(image):
            if os.path.exists(site):
                shutil.copyfile(site, image)
            else:
                shutil.copyfile(pandora, image)
    #locale
    for f in sorted(glob(os.path.join(settings.STATIC_ROOT, 'json/locale.pandora.*.json'))):
        with open(f) as fd:
            locale = json.load(fd)
        site_locale = f.replace('locale.pandora', 'locale.' + settings.CONFIG['site']['id'])
        locale_file = f.replace('locale.pandora', 'locale')
        print('write', locale_file)
        print('    adding', f)
        if os.path.exists(site_locale):
            with open(site_locale) as fdl:
                print('    adding', site_locale)
                locale.update(json.load(fdl))
        with codecs.open(locale_file, "w", "utf-8") as fd:
            json.dump(locale, fd, ensure_ascii=False)
        os.system('gzip -9 -c "%s" > "%s.gz"' % (locale_file, locale_file))


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
    path = os.path.join(settings.GEOIP_PATH, 'GeoLite2-City.mmdb')
    if not os.path.exists(path) or force:
        url = 'http://geolite.maxmind.com/download/geoip/database/GeoLite2-City.mmdb.gz'
        url = 'https://download.db-ip.com/free/dbip-city-lite-2020-01.mmdb.gz'
        print('download', url)
        ox.net.save_url(url, "%s.gz" % path)
        if os.path.exists(path):
            os.unlink(path)
        os.system('gunzip "%s.gz"' % path)

def init():
    if not settings.RELOADER_RUNNING:
        load_config(True)
        if settings.RELOAD_CONFIG:
            thread.start_new_thread(reloader_thread, ())

def shutdown():
    if settings.RELOADER_RUNNING:
        RUN_RELOADER = False
        settings.RELOADER_RUNNING = False
        if NOTIFIER:
            NOTIFIER.stop()



