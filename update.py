#!/usr/bin/python
import os

base = os.path.normpath(os.path.abspath(os.path.dirname(__file__)))
os.chdir(base)

#using virtualenv's activate_this.py to reorder sys.path
activate_this = os.path.join(base, 'bin', 'activate_this.py')
if os.path.exists(activate_this):
    execfile(activate_this, dict(__file__=activate_this))

import sys
import subprocess
import urllib2
import json
from os.path import join, exists

def run(*cmd):
    p = subprocess.Popen(cmd)
    p.wait()
    return p.returncode

def get(*cmd):
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, error = p.communicate()
    return stdout

def get_json(url):
    return json.loads(urllib2.urlopen(url).read())

def get_release():
    try:
        return get_json('https://pan.do/json/release.json')
    except:
        print "failed to load https://pan.do/ra, check your internet connection"
        sys.exit(1)

repos = {
  "pandora": {
    "url": "http://code.0x2620.org/pandora/", 
    "path": ".", 
  }, 
  "oxjs": {
    "url": "http://code.0x2620.org/oxjs/", 
    "path": "./static/oxjs", 
  }, 
  "oxtimelines": {
    "url": "http://code.0x2620.org/oxtimelines/", 
    "path": "./src/oxtimelines", 
  }, 
  "python-ox": {
    "url": "http://code.0x2620.org/python-ox/", 
    "path": "./src/python-ox", 
  }
}

def reload_notice(base):
    print '\nPlease restart pan.do/ra to finish the update:\n\tsudo %s/ctl reload\n' % base

def check_services(base):
    services = "pandora pandora-tasks pandora-encoding pandora-cron pandora-websocketd".split()
    for service in services:
        cmd = ['service', service, 'status']
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        p.wait()
        if p.returncode != 0:
            print 'Please install init script for "%s" service:' % service
            if os.path.exists('/etc/init'):
                print 'sudo cp %s/etc/init/%s.conf /etc/init/' % (base, service)
            if os.path.exists('/lib/systemd/system'):
                print 'sudo cp %s/etc/systemd/%s.service /lib/systemd/system/' % (base, service)
            print ''

if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1] in ('database', 'db'):
        os.chdir(join(base, 'pandora'))
        if get('./manage.py', 'south_installed').strip() == 'yes':
            run('./manage.py', 'syncdb')
            print '\nRunning "./manage.py migrate"\n'
            run('./manage.py', 'migrate')
            run('./manage.py', 'sqlfindindex')
            run('./manage.py', 'sync_itemsort')
            reload_notice(base)
        else:
            print "You are upgrading from an older version of pan.do/ra."
            print "Please use ./manage.py sqldiff -a to check for updates"
            print "and apply required changes. You might have to set defaults too."
            print "Once done run:"
            print "\tcd %s" % os.path.abspath(os.curdir)
            print "\t./manage.py migrate --all --fake"
            print "Check http://wiki.0x2620.org/wiki/pandora/DatabaseUpdate for more information"
    elif len(sys.argv) == 2 and sys.argv[1] == 'static':
        os.chdir(join(base, 'pandora'))
        run('./manage.py', 'update_static')
    elif len(sys.argv) == 4 and sys.argv[1] == 'postupdate':
        os.chdir(base)
        old = int(sys.argv[2])
        new = int(sys.argv[3])
        if old < 3111:
            run('bzr', 'resolved', 'pandora/monkey_patch', 'pandora/monkey_patch/migrations')
            if os.path.exists('pandora/monkey_patch'):
                run('rm', '-r', 'pandora/monkey_patch')
        if old < 3448:
            if os.path.exists('static/pandora'):
                run('bzr', 'resolved', 'static/pandora')
        if old < 3651:
            if os.path.exists('src/django/.git'):
                os.chdir(os.path.join(base, 'src/django'))
                run('git', 'checkout', 'stable/1.4.x')
                run('git', 'pull')
                os.chdir(base)
        if old < 3666:
            run('./bin/pip', 'install', '-r', 'requirements.txt')
        if old < 3770:
            run('./bin/pip', 'install', '-r', 'requirements.txt')
        if old < 4379:
            run('./bin/pip', 'install', '-r', 'requirements.txt')
        if old < 4549:
            import pandora.settings
            with open('pandora/local_settings.py', 'r') as f:
                local_settings = f.read()
            if not 'BROKER_URL' in local_settings:
                broker_url = 'amqp://%s:%s@%s:%s/%s' % (
                    getattr(pandora.settings, 'BROKER_USER', 'pandora'),
                    getattr(pandora.settings, 'BROKER_PASSWORD', 'box'),
                    getattr(pandora.settings, 'BROKER_HOST', '127.0.0.1'),
                    getattr(pandora.settings, 'BROKER_PORT', 5672),
                    getattr(pandora.settings, 'BROKER_VHOST', '/pandora'),
                )
                local_settings = [
                    l for l in local_settings.split('\n') if not l.startswith('BROKER_')
                ] + [
                    'BROKER_URL = "%s"' % broker_url, ''
                ]
                with open('pandora/local_settings.py', 'w') as f:
                    f.write('\n'.join(local_settings))
        if old < 4947:
            run('./bin/pip', 'install', 'tornado==4.1')
            check_services(base)
    else:

        if len(sys.argv) == 1:
            release = get_release()
            repos = release['repositories']
            development = False
        else:
            release = {
                'date': 'development'
            }
            development = True
        os.chdir(base)
        current = ''
        new = ''
        for repo in sorted(repos, key=lambda r: repos[r]['path']):
            path = os.path.join(base, repos[repo]['path'])
            if exists(path):
                os.chdir(path)
                revno = get('bzr', 'revno')
                if repo == 'pandora':
                    pandora_old_revno = revno
                current += revno
                url = repos[repo]['url']
                if 'revision' in repos[repo]:
                    if int(revno) < repos[repo]['revision']:
                        run('bzr', 'pull', url, '-r', '%s' % repos[repo]['revision'])
                else:
                    run('bzr', 'pull', url)
                revno = get('bzr', 'revno')
                new += revno
                if repo == 'pandora':
                    pandora_new_revno = revno
            else:
                os.chdir(os.path.dirname(path))
                cmd = ['bzr', 'branch', repos[repo]['url']]
                if 'revision' in repos[repo]:
                    cmd += ['-r', '%s' % repos[repo]['revision']]
                run(*cmd)
                setup = os.path.join(base, repos[repo]['path'], 'setup.py')
                if repo in ('python-ox', 'oxtimelines') and os.path.exists(setup):
                    os.chdir(os.path.dirname(setup))
                    run(os.path.join(base, 'bin', 'python'), 'setup.py', 'develop')
                new += '+'
        os.chdir(join(base, 'pandora'))
        if current != new:
            run('./manage.py', 'update_static')
            run('./manage.py', 'compile_pyc')
        if pandora_old_revno != pandora_new_revno:
            os.chdir(base)
            run('./update.py', 'postupdate', pandora_old_revno, pandora_new_revno)
        os.chdir(join(base, 'pandora'))
        diff = get('./manage.py', 'sqldiff', '-a').strip()
        if diff != '-- No differences':
            print 'Database has changed, please make a backup and run ./update.py db'
        elif not development:
            print 'pan.do/ra is at the latest stable release,\nyou can run "./update.py dev" to update to the development version'
        elif current != new:
            reload_notice(base)
