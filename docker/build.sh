#!/bin/sh
cd `dirname $0`

HOST=`/sbin/ip route | grep docker0 | awk '{ print $9 }'`
PORT=3142
nc -z "$HOST" "$PORT" > /dev/null 2>&1
result=$?
if [ $result -eq 0 ] ; then
    proxy="--build-arg http_proxy=http://$HOST:$PORT"
else
    proxy=
fi

docker build $proxy -t 0x2620/pandora-base base
docker build -t 0x2620/pandora-nginx nginx
cd ..
docker build -t 0x2620/pandora .
