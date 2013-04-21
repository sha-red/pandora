#!/bin/sh
if [ `whoami` != 'root' ]; then
    echo you have to be root or run with sudo
    exit 1
fi
if [ -z "$1" ]; then
    action=reload
else
    action="$1"
fi
for service in pandora pandora-tasks pandora-encoding pandora-cron; do
    service $service $action
done
