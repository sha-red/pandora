#!/bin/sh
CH="chroot $1"
$CH bzr branch http://code.0x2620.org/pandora /srv/pandora
$CH bzr branch http://code.0x2620.org/oxjs /srv/pandora/static/oxjs
$CH virtualenv --system-site-packages /srv/pandora
$CH /srv/pandora/bin/pip install -r /srv/pandora/requirements.txt

