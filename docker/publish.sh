#!/bin/bash
# push new version of pan.do/ra to code.0x2620.org
set -e

cd /tmp
git clone https://code.0x2620.org/0x2620/pandora
cd pandora
./docker/build.sh

docker push code.0x2620.org/0x2620/pandora-base:latest
docker push code.0x2620.org/0x2620/pandora-nginx:latest
docker push code.0x2620.org/0x2620/pandora:latest
