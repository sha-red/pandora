#!/usr/bin/python
import os
import sys
import subprocess
from os.path import join, exists

def run(*cmd):
    p = subprocess.Popen(cmd)
    p.wait()
    return p.returncode

def get(*cmd):
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, error = p.communicate()
    return stdout

repos = {
    "pandora": "http://code.0x2620.org/pandora/",
    "oxjs": "http://code.0x2620.org/oxjs/",
    "python-ox": "http://code.0x2620.org/python-ox/",
    "oxtimelines": "http://code.0x2620.org/oxtimelines/",
}

def reload_notice(base):
    print '\nYou might need to restart pandora to finish the update:\n\t"sudo %s/reload.sh"\n' % base

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
        os.chdir(base)
        current = get('bzr', 'revno')
        run('bzr', 'pull', repos['pandora'])
        new = get('bzr', 'revno')

        if exists(join(base, 'static', 'oxjs')):
            os.chdir(join(base, 'static', 'oxjs'))
            current += get('bzr', 'revno')
            run('bzr', 'pull', repos['oxjs'])
            new += get('bzr', 'revno')
        else:
            os.chdir(join(base, 'static'))
            run('bzr', 'branch', repos['oxjs'])
            new += '+'

        if exists(join(base, 'src', 'python-ox')):
            os.chdir(join(base, 'src', 'python-ox'))
            current += get('bzr', 'revno')
            run('bzr', 'pull', repos['python-ox'])
            new += get('bzr', 'revno')

        if exists(join(base, 'src', 'oxtimelines')):
            os.chdir(join(base, 'src', 'oxtimelines'))
            current += get('bzr', 'revno')
            run('bzr', 'pull', repos['oxtimelines'])
            new += get('bzr', 'revno')
        else:
            print "oxtimelines is missing. please run:\n\n\tcd %s\n\tpip -E . install -r requirements.txt\n" % (base)
        os.chdir(join(base, 'pandora'))
        if current != new:
            run('./manage.py', 'update_static')
            run('./manage.py', 'compile_pyc')
        diff = get('./manage.py', 'sqldiff', '-a').strip()
        if diff != '-- No differences':
            print 'Database has changed, please make a backup and run ./update.py database'
        else:
            reload_notice(base)
