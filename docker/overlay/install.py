#!/usr/bin/python3

import os
from os.path import join, abspath, basename, dirname

# change this
name = 'placeholder'
overwrite = (
    #('home', 'indiancinema'),
    #('infoView', 'indiancinema'),
)

base = abspath(dirname(__file__))
os.chdir(base)

for root, folders, files in os.walk(join(base, 'static')):
    for f in files:
        src = join(root, f)
        target = src.replace(base, '/srv/pandora')
        rel_src = os.path.relpath(src, dirname(target))
        if os.path.exists(target):
            os.unlink(target)
        os.symlink(rel_src, target)

if overwrite:
    os.chdir('/srv/pandora/static/js')
    for filename, sitename in overwrite:
        src = '%s.%s.js' % (filename, sitename)
        target = '%s.%s.js' % (filename, name)
        if os.path.exists(target):
            os.unlink(target)
        os.symlink(src, target)

os.chdir(base)
src = join(base, 'config.jsonc')
target = '/srv/pandora/pandora/config.%s.jsonc' % name
rel_src = os.path.relpath(src, dirname(target))
if os.path.exists(target):
    os.unlink(target)
os.symlink(rel_src, target)
t = '/srv/pandora/pandora/config.jsonc'
if os.path.exists(t):
    os.unlink(t)
os.symlink(basename(target), t)

for root, folders, files in os.walk(join(base, 'scripts')):
    for f in files:
        src = join(root, f)
        target = src.replace(base, '/srv/pandora')
        rel_src = os.path.relpath(src, dirname(target))
        if os.path.exists(target):
            os.unlink(target)
        os.symlink(rel_src, target)
        if f == 'poster.%s.py' % name:
            t = os.path.join(dirname(target), 'poster.py')
            if os.path.exists(t):
                os.unlink(t)
            os.symlink(f, os.path.join(dirname(target), t))

if os.path.exists('settings.py'):
    target = os.path.join('/srv/pandora/pandora/overlay_settings.py',)
    rel_src = os.path.relpath(os.path.join(base, 'settings.py'), dirname(target))
    if os.path.exists(target):
        os.unlink(target)
    os.symlink(rel_src, target)

if os.path.exists('__init__.py'):
    # make module available to pandora
    target = os.path.join('/srv/pandora/pandora/', name)
    rel_src = os.path.relpath(base, dirname(target))
    if os.path.exists(target):
        os.unlink(target)
    os.symlink(rel_src, target)

    # include module in local settings
    local_settings_py = '/srv/pandora/pandora/local_settings.py'
    with open(local_settings_py) as fd:
        local_settings_changed = False
        local_settings = fd.read()
        if 'LOCAL_APPS' not in local_settings:
            local_settings += '\nLOCAL_APPS = ["%s"]\n' % name
            local_settings_changed = True
        else:
            apps = re.compile('(LOCAL_APPS.*?)\]', re.DOTALL).findall(local_settings)[0]
            if name not in apps:
                new_apps = apps.strip() + ',\n"%s"\n' % name
                local_settings = local_settings.replace(apps, new_apps)
                local_settings_changed = True
    if local_settings_changed:
        with open(local_settings_py, 'w') as fd:
            fd.write(local_settings)
