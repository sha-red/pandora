#!/bin/bash
cd `dirname $0`
base=`pwd`
current=`bzr revno`
bzr pull http://code.0x2620.org/pandora/
new=`bzr revno`
cd static/oxjs
current=$current`bzr revno`
bzr pull http://code.0x2620.org/oxjs/
new=$new`bzr revno`
cd $base
if [ -e src/python-ox ]; then
  cd src/python-ox
  current=$current`bzr revno`
  bzr pull http://code.0x2620.org/python-ox/
  new=$new`bzr revno`
fi
cd $base
if [ $current -ne $new ]; then
  cd pandora
  ./manage.py update_static
  ./manage.py compile_pyc
fi
