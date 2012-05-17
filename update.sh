#!/bin/bash
pandora_repos=http://code.0x2620.org/pandora/
oxjs_repos=http://code.0x2620.org/oxjs/
python_ox_repos=http://code.0x2620.org/python-ox/
oxtimelines_repos=http://code.0x2620.org/oxtimelines/

cd `dirname $0`
base=`pwd`
current=`bzr revno`
bzr pull $pandora_repos
new=`bzr revno`
cd $base
if [ -e static/oxjs ]; then
  cd static/oxjs
  current=$current`bzr revno`
  bzr pull $oxjs_repos
  new=$new`bzr revno`
else
  cd static
  bzr branch $oxjs_repos
  cd oxjs
  new=$new`bzr revno`
fi

cd $base
if [ -e src/python-ox ]; then
  cd src/python-ox
  current=$current`bzr revno`
  bzr pull $python_ox_repos
  new=$new`bzr revno`
fi
cd $base
if [ -e src/oxtimelines ]; then
  cd src/oxtimelines
  bzr pull $oxtimelines_repos
fi
cd $base
if [ $current -ne $new ]; then
  cd pandora
  ./manage.py update_static
  ./manage.py compile_pyc
  ./manage.py sqldiff -a | grep -v BEGIN | grep -v COMMIT | grep -v "\-\- No differences"
fi
