#!/usr/bin/env python3
import json
import os
import shutil
import subprocess
import sys
try:
    from urllib.request import urlopen
except:
    from urllib2 import urlopen
from os.path import join, exists


repos = {
    "pandora": {
        "url": "https://code.0x2620.org/0x2620/pandora.git",
        "path": ".",
    },
    "oxjs": {
        "url": "https://code.0x2620.org/0x2620/oxjs.git",
        "path": "./static/oxjs",
    },
    "oxtimelines": {
        "url": "https://code.0x2620.org/0x2620/oxtimelines.git",
        "path": "./src/oxtimelines",
    },
    "python-ox": {
        "url": "https://code.0x2620.org/0x2620/python-ox.git",
        "path": "./src/python-ox",
    }
}


def activate_venv(base):
    if os.path.exists(base):
        old_os_path = os.environ.get('PATH', '')
        bin_path = os.path.join(base, 'bin')
        if bin_path not in old_os_path:
            os.environ['PATH'] = os.path.join(base, 'bin') + os.pathsep + old_os_path
        site_packages = os.path.join(base, 'lib', 'python%s' % sys.version[:3], 'site-packages')
        prev_sys_path = list(sys.path)
        import site
        site.addsitedir(site_packages)
        sys.real_prefix = sys.prefix
        sys.prefix = base
        # Move the added items to the front of the path:
        new_sys_path = []
        for item in list(sys.path):
            if item not in prev_sys_path:
                new_sys_path.append(item)
                sys.path.remove(item)
        sys.path[:0] = new_sys_path


def run(*cmd):
    p = subprocess.Popen(cmd)
    p.wait()
    return p.returncode

def get(*cmd):
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, error = p.communicate()
    return stdout.decode()


def get_json(url):
    return json.loads(urlopen(url).read().decode())


def get_release():
    if os.path.exists('.release'):
        url = open('.release').read().strip()
    else:
        url = 'https://pan.do/json/release-stable.json'
    try:
        return get_json(url)
    except:
        print("Failed to load %s check your internet connection." % url)
        sys.exit(1)


def reload_notice(base):
    print('\nPlease restart pan.do/ra to finish the update:\n\tsudo pandoractl reload\n')


def check_services(base):
    services = "pandora pandora-tasks pandora-encoding pandora-cron pandora-websocketd".split()
    for service in services:
        cmd = ['service', service, 'status']
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        p.wait()
        if p.returncode != 0:
            print('Please install init script for "%s" service:' % service)
            if os.path.exists('/etc/init') and not os.path.exists('/bin/systemctl'):
                print('\tsudo cp %s/etc/init/%s.conf /etc/init/' % (base, service))
            if os.path.exists('/bin/systemctl'):
                print('\tsudo cp %s/etc/systemd/system/%s.service /etc/systemd/system/' % (base, service))
                print('\tsudo systemctl daemon-reload')
            print('\tsudo service %s start' % service)
            print('')


def update_service(service):
    print('Please install new init script for "%s" service:' % service)
    if os.path.exists('/etc/init/%s.conf' % service):
        print('\tsudo cp %s/etc/init/%s.conf /etc/init/' % (base, service))
    if os.path.exists('/bin/systemctl'):
        print('\tsudo cp %s/etc/systemd/system/%s.service /etc/systemd/system/' % (base, service))
        print('\tsudo systemctl daemon-reload')
    print('\tsudo service %s restart' % service)


def run_git(path, *args):
    cmd = ['git'] + list(args)
    env = {'GIT_DIR': '%s/.git' % path}
    return subprocess.check_output(cmd, env=env).decode().strip()


def run_sql(sql):
    cmd = [join(base, 'pandora/manage.py'), 'dbshell']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, stdin=subprocess.PIPE)
    stdout, error = p.communicate(input=sql.encode())
    return stdout.decode()

def get_version(path):
    return run_git(path, 'rev-list', 'HEAD', '--count')

def get_branch(path=None):
    if not path:
        path = '.'
    return get('cat', os.path.join(path, '.git/HEAD')).strip().split('/')[-1]


if __name__ == "__main__":
    if os.stat(__file__).st_uid != os.getuid() or os.getuid() == 0:
        print('you must run update.py as the pandora user')
        sys.exit(1)
    base = os.path.normpath(os.path.abspath(os.path.dirname(__file__)))
    os.chdir(base)
    activate_venv(base)

    if len(sys.argv) == 2 and sys.argv[1] in ('database', 'db'):
        os.chdir(join(base, 'pandora'))
        print('\nRunning "./manage.py migrate"\n')
        r = get('./manage.py', 'migrate', '--noinput')
        r = r.replace("Your models have changes that are not yet reflected in a migration, and so won't be applied.", '')
        r = r.replace("Run 'manage.py makemigrations' to make new migrations, and then re-run 'manage.py migrate' to apply them.", '')
        print(r)
        run('./manage.py', 'sqlfindindex')
        run('./manage.py', 'sync_itemsort')
        run('./manage.py', 'sync_documentsort')
        reload_notice(base)
    elif len(sys.argv) == 2 and sys.argv[1] == 'static':
        os.chdir(join(base, 'pandora'))
        run('./manage.py', 'update_static')
    elif len(sys.argv) == 4 and sys.argv[1] == 'postupdate':
        os.chdir(base)
        old = sys.argv[2].strip()
        new = sys.argv[3].strip()
        if old.isdigit():
            old = int(old)
        if new.isdigit():
            new = int(new)
        print('Post Update from %s to %s' % (old, new))
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
            if 'BROKER_URL' not in local_settings:
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
                        'git+https://code.0x2620.org/0x2620/%s.git#egg=%s' % (component, component),
                        '--exists-action', 'w')
            if not os.path.exists('./static/oxjs/.git'):
                if os.path.exists('static/oxjs'):
                    shutil.move('static/oxjs', 'static/oxjs_bzr')
                run('git', 'clone', '--depth', '1', 'https://code.0x2620.org/0x2620/oxjs.git', 'static/oxjs')
                run('./pandora/manage.py', 'update_static')
                if os.path.exists('static/oxjs_bzr'):
                    shutil.rmtree('static/oxjs_bzr')
            if os.path.exists('REPOSITORY_MOVED_TO_GIT'):
                os.unlink('REPOSITORY_MOVED_TO_GIT')
            if os.path.exists('.bzr'):
                shutil.rmtree('.bzr')
            run('git', 'checkout', 'update.py')
        if old <= 5389:
            for path in (
                'lib/python2.7/site-packages/Django.egg-link',
                'lib/python2.7/site-packages/django-extensions.egg-link',
                'lib/python2.7/site-packages/django-devserver.egg-link'
            ):
                if os.path.exists(path):
                    os.unlink(path)
            for path in (
                'src/django',
                'src/django-devserver',
                'src/django-extensions',
            ):
                if os.path.exists(path):
                    shutil.rmtree(path)
            if os.path.exists('contrib'):
                shutil.rmtree('contrib')
            run('./bin/pip', 'install', '-r', 'requirements.txt')
            run('./pandora/manage.py', 'migrate', '--fake-initial', '--noinput')
            update_service('pandora')
        if old <= 5432:
            import pandora.settings
            run('./bin/pip', 'install', '-r', 'requirements.txt')
            path = os.path.join(pandora.settings.GEOIP_PATH, 'GeoLite2-City.mmdb')
            if not os.path.exists(path):
                run('./pandora/manage.py', 'update_geoip')
        if old <= 5443:
            gunicorn_config = 'pandora/gunicorn_config.py'
            if not os.path.exists(gunicorn_config):
                shutil.copy('%s.in' % gunicorn_config, gunicorn_config)
                if os.path.exists('/etc/init/pandora.conf'):
                    with open('/etc/init/pandora.conf') as fd:
                        data = fd.read()
                        if '0.0.0.0:2620' in data:
                            run('sed', '-i', 's/127.0.0.1:2620/0.0.0.0:2620/g', gunicorn_config)
                if old > 5389:
                    update_service('pandora')
        if old <= 5452:
            run('./bin/pip', 'install', '-r', 'requirements.txt')
            update_service('pandora-encoding')
            update_service('pandora-tasks')
        if old < 5975:
            run('./bin/pip', 'install', '-r', 'requirements.txt')
        if old <= 6064:
            run('./bin/pip', 'install', '-r', 'requirements.txt')
            run('./pandora/manage.py', 'createcachetable')
        if old <= 6108:
            run('./bin/pip', 'install', '-r', 'requirements.txt')
        if old <= 6160:
            run('./bin/pip', 'install', '-r', 'requirements.txt')
            with open('pandora/local_settings.py', 'r') as f:
                local_settings = f.read()
            if 'BROKER_URL' in local_settings and 'CELERY_BROKER_URL' not in local_settings:
                local_settings = [
                    'CELERY_' + l if l.startswith('BROKER_URL') else l
                    for l in local_settings.split('\n')
                ]
                with open('pandora/local_settings.py', 'w') as f:
                    f.write('\n'.join(local_settings))
        if old <= 6313:
            if sys.version_info[0:2] < (3, 6):
                print('Python 3.6 or late is required now, upgrade your system and run:')
                print('')
                print('./update.py postupdate %s %s' % (6313, new))
                print('')
                sys.exit(1)
            run('./bin/pip', 'uninstall', 'django-celery', '-y')
            run('./bin/pip', 'install', '-r', 'requirements.txt')
        if old <= 6315:
            for sql in [
                "INSERT INTO django_migrations (app, name, applied) VALUES ('system', '0001_initial', CURRENT_TIMESTAMP)",
                "UPDATE django_content_type SET app_label = 'system' WHERE app_label = 'auth' and model = 'user'",
            ]:
                run_sql(sql)
            run(join(base, 'pandora/manage.py'), 'migrate', 'system')
            run(join(base, 'pandora/manage.py'), 'update_geoip')
        if old < 6442:
            run('./bin/pip', 'install', 'yt-dlp>=2022.3.8.2')
        if old <= 6581:
            run('./bin/pip', 'install', '-U', 'pip')
            run('./bin/pip', 'install', '-r', 'requirements.txt')
    else:
        if len(sys.argv) == 1:
            branch = get_branch()
            development = branch == 'master'
        elif len(sys.argv) == 3 and sys.argv[1] == 'switch':
            branch = sys.argv[2]
            development = branch == 'master'
        else:
            branch = 'master'
            development = True
        os.chdir(base)
        current = ''
        new = ''
        for repo in sorted(repos, key=lambda r: repos[r]['path']):
            path = os.path.join(base, repos[repo]['path'])
            if exists(path):
                os.chdir(path)
                current_branch = get_branch(path)
                revno = get_version(path)
                if repo == 'pandora':
                    print("Pandora Version pre update: ", revno)
                    pandora_old_revno = revno
                current += revno
                if current_branch != branch:
                    run('git', 'remote', 'set-branches', 'origin', '*')
                    run('git', 'fetch', 'origin')
                    run('git', 'checkout', branch)
                url = repos[repo]['url']
                print('Checking', repo)
                run('git', 'pull')
                revno = get_version(path)
                new += revno
                if repo == 'pandora':
                    pandora_new_revno = revno
            else:
                os.chdir(os.path.dirname(path))
                run('git', 'clone', '--depth', '1', repos[repo]['url'])
                setup = os.path.join(base, repos[repo]['path'], 'setup.py')
                if repo in ('python-ox', 'oxtimelines') and os.path.exists(setup):
                    os.chdir(os.path.dirname(setup))
                    run(os.path.join(base, 'bin', 'python'), 'setup.py', 'develop')
                new += '+'
        os.chdir(join(base, 'pandora'))
        if pandora_old_revno != pandora_new_revno:
            print("Pandora Version post update: ", pandora_new_revno)
            os.chdir(base)
            run('./update.py', 'postupdate', pandora_old_revno, pandora_new_revno)
        os.chdir(join(base, 'pandora'))
        if current != new:
            run('./manage.py', 'update_static')
            run('./manage.py', 'compile_pyc', '-p', '.')
        os.chdir(join(base, 'pandora'))
        diff = get('./manage.py', 'sqldiff', '-a').strip().split('\n')
        diff = [
            row for row in diff
            if not row.strip().startswith('ALTER "id" TYPE')
            and not row.startswith('--')
            and not row.startswith('ALTER TABLE')
            and row not in ['BEGIN;', 'COMMIT;']
        ]
        if diff:
            print('Database has changed, please make a backup and run %s db' % sys.argv[0])
        elif branch != 'master':
            print('pan.do/ra is at the latest release,\nyou can run "%s switch master" to switch to the development version' % sys.argv[0])
        elif current != new:
            reload_notice(base)
