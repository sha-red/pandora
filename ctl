#!/bin/sh
if [ -z "$1" ]; then
    echo "Usage: $0 (start|stop|restart|reload)"
    exit 1
else
    action="$1"
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
            for service in pandora pandora-tasks pandora-encoding pandora-cron; do
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
for service in pandora pandora-tasks pandora-encoding pandora-cron; do
    service $service $action
done
