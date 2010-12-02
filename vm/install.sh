#!/bin/sh
CH="chroot $1"
$CH bzr branch http://code.0x2620.org/pandora /srv/pandora
$CH bzr branch http://code.0x2620.org/oxjs /srv/pandora/static/oxjs
$CH virtualenv /srv/pandora
$CH pip -E /srv/pandora install -r /srv/pandora/requirements.txt

