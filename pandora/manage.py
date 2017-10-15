#!/usr/bin/env python
import os
import signal
import sys

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


root_dir = os.path.normpath(os.path.abspath(os.path.dirname(__file__)))
os.chdir(root_dir)

# use python3 from virtualenv
python3 = os.path.normpath(os.path.join(root_dir, '..', 'bin', 'python3'))
if os.path.exists(python3) and sys.version_info[0] == 2:
    import subprocess
    cmd = [python3] + sys.argv
    with DelayedSignalHandler((signal.SIGINT, signal.SIGTERM, signal.SIGHUP)):
        exit_value = subprocess.call(cmd)
    sys.exit(exit_value)

# using virtualenv's activate_this.py to reorder sys.path
activate_this = os.path.normpath(os.path.join(root_dir, '..', 'bin', 'activate_this.py'))
with open(activate_this) as f:
    code = compile(f.read(), activate_this, 'exec')
    exec(code, dict(__file__=activate_this))


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
    from django.core.management import execute_from_command_line
    import settings
    if not os.path.exists(settings.SITE_CONFIG):
        import sys
        sys.stderr.write("Error: Can't find '%s'.\nBefore you run pan.do/ra you must create it\n" % settings.SITE_CONFIG)
        sys.exit(1)
    execute_from_command_line(sys.argv)
    import app.config
    app.config.shutdown()
