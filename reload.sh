#!/bin/sh
for service in pandora pandora-tasks pandora-encoding pandora-cron; do
    service $service reload
done
