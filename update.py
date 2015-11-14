#!/usr/bin/python
import os

base = os.path.normpath(os.path.abspath(os.path.dirname(__file__)))
os.chdir(base)

#using virtualenv's activate_this.py to reorder sys.path
activate_this = os.path.join(base, 'bin', 'activate_this.py')
if os.path.exists(activate_this):
    execfile(activate_this, dict(__file__=activate_this))

import sys
import shutil
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
    if os.path.exists('.release'):
        url = open('.release').read().strip()
    else:
        url = 'https://pan.do/json/release-stable.json'
    try:
        return get_json(url)
    except:
        print "Failed to load %s check your internet connection." % url
        sys.exit(1)

repos = {
  "pandora": {
    "url": "https://git.0x2620.org/pandora.git",
    "path": ".",
  }, 
  "oxjs": {
    "url": "https://git.0x2620.org/oxjs.git",
    "path": "./static/oxjs",
  }, 
  "oxtimelines": {
    "url": "https://git.0x2620.org/oxtimelines.git",
    "path": "./src/oxtimelines",
  }, 
  "python-ox": {
    "url": "https://git.0x2620.org/python-ox.git",
    "path": "./src/python-ox",
  }
}

def reload_notice(base):
    print '\nPlease restart pan.do/ra to finish the update:\n\tsudo %s/ctl reload\n' % base

def check_services(base):
    services = "pandora pandora-tasks pandora-encoding pandora-cron pandora-websocketd".split()
    for service in services:
        cmd = ['service', service, 'status']
        if subprocess.check_call(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE) != 0:
            print 'Please install init script for "%s" service:' % service
            if os.path.exists('/etc/init'):
                print '\tsudo cp %s/etc/init/%s.conf /etc/init/' % (base, service)
            if os.path.exists('/lib/systemd/system'):
                print '\tsudo cp %s/etc/systemd/%s.service /lib/systemd/system/' % (base, service)
            print '\tsudo service %s start' % service
            print ''

def run_git(path, *args):
    cmd = ['git'] + list(args)
    env = {'GIT_DIR': '%s/.git' % path}
    return subprocess.check_output(cmd, env=env).strip()

def get_version(path):
    return run_git(path, 'rev-list', 'HEAD', '--count')

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
        old = sys.argv[2]
        new = sys.argv[3]
        if old.isdigit():
            old = int(old)
        if new.isdigit():
            new = int(new)
        print 'Post Update from %s to %s' % (old, new)
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
        if old < 5074:
            for component in ('oxtimelines', 'python-ox'):
                if not os.path.exists('./src/%s/.git' % component):
                    run('./bin/pip', 'install', '-e',
                        'git+https://git.0x2620.org/%s.git#egg=%s' % (component, component),
                        '--exists-action', 'w')
            if not os.path.exists('./static/oxjs/.git'):
                if os.path.exists('static/oxjs'):
                    shutil.move('static/oxjs', 'static/oxjs_bzr')
                run('git', 'clone', 'https://git.0x2620.org/oxjs.git', 'static/oxjs')
                run('./pandora/manage.py', 'update_static')
                if os.path.exists('static/oxjs_bzr'):
                    shutil.rmtree('static/oxjs_bzr')
            if os.path.exists('REPOSITORY_MOVED_TO_GIT'):
                os.unlink('REPOSITORY_MOVED_TO_GIT')
            if os.path.exists('.bzr'):
                shutil.rmtree('.bzr')
            run('git', 'checkout', 'update.py')
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
                revno = get_version(path)
                if repo == 'pandora':
                    pandora_old_revno = revno
                current += revno
                url = repos[repo]['url']
                if 'revision' in repos[repo]:
                    if revno != repos[repo]['revision']:
                        run('git', 'fetch')
                        run('git', 'checkout', repos[repo]['commit'])
                else:
                    print 'Checking', repo
                    run('git', 'checkout', 'master', '-q')
                    run('git', 'pull')
                revno = get_version(path)
                new += revno
                if repo == 'pandora':
                    pandora_new_revno = revno
            else:
                os.chdir(os.path.dirname(path))
                cmd = ['git', 'clone', repos[repo]['url']]
                run(*cmd)
                if 'revision' in repos[repo]:
                    run_git(path, 'checkout', repos[repo]['commit'])
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
            print 'Database has changed, please make a backup and run %s db' % sys.argv[0]
        elif not development:
            print 'pan.do/ra is at the latest release,\nyou can run "%s dev" to update to the development version' % sys.argv[0]
        elif current != new:
            reload_notice(base)
