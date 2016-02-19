#!/usr/bin/env python
import os
import sys

root_dir = os.path.normpath(os.path.abspath(os.path.dirname(__file__)))
os.chdir(root_dir)

#using virtualenv's activate_this.py to reorder sys.path
activate_this = os.path.join(root_dir, '..', 'bin', 'activate_this.py')
execfile(activate_this, dict(__file__=activate_this))


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
