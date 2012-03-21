#!/bin/sh
base=$(pwd)
sudo  vmbuilder vbox ubuntu --suite=oneiric \
    --verbose --debug \
    --arch i386 \
    --dest $base/pandora \
    --hostname pandora \
    --swapsize 512 \
    --rootsize 1048576 \
    --user pandora \
    --pass pandora \
    --components main,universe,multiverse \
    --ppa j/pandora \
    --addpkg openssh-server \
    --addpkg acpid \
    --addpkg vim \
    --addpkg wget \
    --addpkg pwgen \
    --addpkg nginx \
    --addpkg rabbitmq-server \
    --addpkg bzr \
    --addpkg git \
    --addpkg subversion \
    --addpkg mercurial \
    --addpkg avahi-daemon \
    --addpkg python-setuptools \
    --addpkg python-pip \
    --addpkg python-virtualenv \
    --addpkg python-imaging \
    --addpkg python-dev \
    --addpkg python-imaging \
    --addpkg python-numpy \
    --addpkg python-psycopg2 \
    --addpkg python-simplejson \
    --addpkg python-lxml \
    --addpkg python-html5lib \
    --addpkg oxtimeline \
    --addpkg oxframe \
    --addpkg mkvtoolnix \
    --execscript=$base/install.sh \
    --firstboot=$base/firstboot.sh

#kvm-img  convert -O vdi pandora/*.qcow2 pandora.vdi
