#!/usr/bin/env python3
import os
import signal
import sys


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


class DelayedSignalHandler(object):
    def __init__(self, managed_signals):
        self.managed_signals = managed_signals
        self.managed_signals_queue = list()
        self.old_handlers = dict()

    def _handle_signal(self, caught_signal, frame):
        #self.managed_signals_queue.append((caught_signal, frame))
        pass

    def __enter__(self):
        for managed_signal in self.managed_signals:
            old_handler = signal.signal(managed_signal, self._handle_signal)
            self.old_handlers[managed_signal] = old_handler

    def __exit__(self, *_):
        for managed_signal, old_handler in self.old_handlers.items():
            signal.signal(managed_signal, old_handler)
        '''
        for managed_signal, frame in self.managed_signals_queue:
            self.old_handlers[managed_signal](managed_signal, frame)
        '''


if __name__ == "__main__":
    root_dir = os.path.normpath(os.path.abspath(os.path.dirname(__file__)))

    # use python3 from venv
    venv_dir = os.path.normpath(os.path.join(root_dir, '..'))
    python3 = os.path.join(venv_dir, 'bin', 'python3')
    if os.path.exists(python3) and sys.version_info[0] == 2:
        import subprocess
        cmd = [python3] + sys.argv
        with DelayedSignalHandler((signal.SIGINT, signal.SIGTERM, signal.SIGHUP)):
            exit_value = subprocess.call(cmd)
        sys.exit(exit_value)

    os.chdir(root_dir)
    activate_venv(venv_dir)

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
    from django.core.management import execute_from_command_line
    import settings
    if not os.path.exists(settings.SITE_CONFIG):
        import sys
        sys.stderr.write("Error: Can't find '%s'.\nBefore you run pan.do/ra you must create it\n" % settings.SITE_CONFIG)
        sys.exit(1)
    execute_from_command_line(sys.argv)
