#!/bin/sh
SERVICES="pandora pandora-tasks pandora-encoding pandora-cron pandora-websocketd"
if [ -z "$1" ]; then
    echo "Usage: $0 (start|stop|restart|reload|status)"
    exit 1
else
    action="$1"
fi
self=`readlink "$0"`
if [ -z $self ]; then
    self="$0"
fi

if [ "$action" = "init" ]; then
    cd "`dirname "$self"`"
    BASE=`pwd`
    SUDO=""
    PANDORA_USER=`ls -l update.py | cut -f3 -d" "`
    if [ `whoami` != $PANDORA_USER ]; then
        SUDO="sudo -E -H -u $PANDORA_USER"
    fi
    $SUDO python3 -m venv --system-site-packages .
    branch=`cat .git/HEAD  | sed 's@/@\n@g' | tail -n1`

    # Work around broken venv module in Ubuntu 16.04 / Debian 9
    if [ ! -e bin/pip ]; then
        $SUDO bin/python3 -m pip install -U --ignore-installed "pip<9"
    fi
    if [ ! -d static/oxjs ]; then
        $SUDO git clone -b $branch https://git.0x2620.org/oxjs.git static/oxjs
    fi
    $SUDO mkdir -p src
    if [ ! -d src/oxtimelines ]; then
        $SUDO git clone -b $branch https://git.0x2620.org/oxtimelines.git src/oxtimelines
    fi
    for package in oxtimelines python-ox; do
        cd ${BASE}
        if [ ! -d src/${package} ]; then
            $SUDO git clone -b $branch https://git.0x2620.org/${package}.git src/${package}
        fi
        cd ${BASE}/src/${package}

        $SUDO ${BASE}/bin/pip install -e .

    done
    cd ${BASE}
    $SUDO ./bin/pip install -r requirements.txt
    for template in gunicorn_config.py encoding.conf tasks.conf; do
        if [ ! -e pandora/$template ]; then
            $SUDO cp pandora/${template}.in pandora/$template
        fi
    done
    exit 0
fi

if [ "$action" = "manage" ]; then
    cmd="pandora/manage.py"
fi
if [ "$action" = "update" ]; then
    cmd="update.py"
fi

if [ ! -z $cmd ]; then
    cd "`dirname "$self"`"
    BASE=`pwd`
    SUDO=""
    PANDORA_USER=`ls -l update.py | cut -f3 -d" "`
    if [ `whoami` != $PANDORA_USER ]; then
        SUDO="sudo -E -H -u $PANDORA_USER"
    fi
    shift
    exec $SUDO "$BASE/$cmd" $@
fi

if [ `whoami` != 'root' ]; then
    echo you have to be root or run $0 with sudo
    exit 1
fi
if [ "$action" = "install" ]; then
    cd "`dirname "$self"`"
    BASE=`pwd`
    if [ -x /bin/systemctl ]; then
        if [ -d /etc/systemd/system/ ]; then
            for template in gunicorn_config.py encoding.conf tasks.conf; do
                if [ ! -e pandora/$template ]; then
                    $SUDO cp pandora/${template}.in pandora/$template
                fi
            done
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
        test -e /usr/local/bin/pandoractl || ln -s /srv/pandora/ctl /usr/local/bin/pandoractl
    else
        if [ -d /etc/init ]; then
            cp $BASE/etc/init/* /etc/init/
        fi
    fi
    exit 0
fi
if [ "status" = "$action" ]; then
    export SYSTEMD_PAGER=
fi
for service in $SERVICES; do
    if [ -x /bin/systemctl ]; then
        /bin/systemctl $action $service
    else
        service $service $action
    fi
done
