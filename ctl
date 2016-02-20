#!/bin/sh
SERVICES="pandora pandora-tasks pandora-encoding pandora-cron pandora-websocketd"
if [ -z "$1" ]; then
    echo "Usage: $0 (start|stop|restart|reload)"
    exit 1
else
    action="$1"
fi
if [ "$action" = "init" ]; then
    cd "`dirname "$0"`"
    BASE=`pwd`
    virtualenv --system-site-packages .
    if [ ! -d static/oxjs ]; then
        git clone --depth 1 https://git.0x2620.org/oxjs.git static/oxjs
    fi
    mkdir -p src
    if [ ! -d src/oxtimelines ]; then
        git clone --depth 1 https://git.0x2620.org/oxtimelines.git src/oxtimelines
    fi
    for package in oxtimelines python-ox; do
        cd ${BASE}
        if [ ! -d src/${package} ]; then
            git clone --depth 1 https://git.0x2620.org/${package}.git src/${package}
        fi
        cd ${BASE}/src/${package}
        ${BASE}/bin/python setup.py develop
    done
    cd ${BASE}
    ./bin/pip install -r requirements.txt
    exit 0
fi
if [ `whoami` != 'root' ]; then
    echo you have to be root or run $0 with sudo
    exit 1
fi
if [ "$action" = "install" ]; then
    cd "`dirname "$0"`"
    BASE=`pwd`
    if [ -x /bin/systemctl ]; then
        if [ -d /lib/systemd/system/ ]; then
            cp $BASE/etc/systemd/*.service /lib/systemd/system/
            cp $BASE/etc/tmpfiles.d/pandora.conf /usr/lib/tmpfiles.d/
            systemd-tmpfiles --create /usr/lib/tmpfiles.d/pandora.conf >/dev/null || true
            for service in $SERVICES; do
                systemctl enable ${service}.service
            done
        fi
    else
        if [ -d /etc/init ]; then
            cp $BASE/etc/init/* /etc/init/
        fi
    fi
    exit 0
fi
for service in $SERVICES; do
    service $service $action
done
