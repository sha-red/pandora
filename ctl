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
    python3 -m venv --system-site-packages .

    # Work around broken venv module in Ubuntu 16.04 / Debian 9
    if [ ! -e bin/pip ]; then
        bin/python3 -m pip install -U --ignore-installed pip
    fi
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
    if [ ! -e pandora/gunicorn_config.py ]; then
        cp pandora/gunicorn_config.py.in pandora/gunicorn_config.py
    fi
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
        if [ -d /etc/systemd/system/ ]; then
            for service in $SERVICES; do
                if [ -e /lib/systemd/system/${service}.service ]; then
                    rm -f /lib/systemd/system/${service}.service \
                          /etc/systemd/system/multi-user.target.wants/${service}.service
                fi
            done

            cp $BASE/etc/systemd/system/*.service /etc/systemd/system/
            cp $BASE/etc/tmpfiles.d/pandora.conf /etc/tmpfiles.d/
            systemd-tmpfiles --create /etc/tmpfiles.d/pandora.conf >/dev/null || true
            systemctl daemon-reload
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
