cd `dirname $0`
base=`pwd`
bzr pull http://code.0x2620.org/pandora/
cd static/oxjs
bzr pull http://code.0x2620.org/oxjs/
test -e src/python-ox && cd src/python-ox && bzr pull http://code.0x2620.org/python-ox/
cd $base
cd pandora && ./manage.py update_static
