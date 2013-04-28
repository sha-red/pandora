#!/usr/bin/python
import os

root_dir = os.path.normpath(os.path.abspath(os.path.dirname(__file__)))
os.chdir(root_dir)

#using virtualenv's activate_this.py to reorder sys.path
activate_this = os.path.join(root_dir, 'bin', 'activate_this.py')
if os.path.exists(activate_this):
    execfile(activate_this, dict(__file__=activate_this))

import sys
import subprocess
import ox
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

def get_release():
    try:
        return json.loads(ox.net.read_url('https://pan.do/json/release.json'))
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
    print '\nYou might need to restart pandora to finish the update:\n\t"sudo %s/ctl reload"\n' % base

if __name__ == "__main__":
    base = os.path.normpath(os.path.abspath(os.path.dirname(__file__)))
    if len(sys.argv) == 2 and sys.argv[1] == 'database':
        os.chdir(join(base, 'pandora'))
        if get('./manage.py', 'south_installed').strip() == 'yes':
            run('./manage.py', 'syncdb')
            print '\nRunning "./manage.py migrate"\n'
            run('./manage.py', 'migrate')
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
        for repo in repos:
            path = os.path.join(base, repos[repo]['path'])
            if exists(path):
                os.chdir(path)
                revno = get('bzr', 'revno')
                current += revno
                url = repos[repo]['url']
                if 'revision' in repos[repo]:
                    if int(revno) < repos[repo]['revision']:
                        run('bzr', 'pull', url, '-r', '%s' % repos[repo]['revision'])
                else:
                    run('bzr', 'pull', url)
                revno = get('bzr', 'revno')
                new += revno
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
        elif not development:
            print 'pan.do/ra is up to date, run "./update dev" to update to the current development version'
        diff = get('./manage.py', 'sqldiff', '-a').strip()
        if diff != '-- No differences':
            print 'Database has changed, please make a backup and run ./update.py database'
        elif current != new:
            reload_notice(base)
