#!/bin/sh
if [ `whoami` != 'root' ]; then
    echo you have to be root or run with sudo
    exit 1
fi
for service in pandora pandora-tasks pandora-encoding pandora-cron; do
    service $service reload
done
