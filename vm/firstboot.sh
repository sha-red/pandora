#!/bin/sh
apt-get update -q
apt-get install -y curl
curl https://wiki.0x2620.org/browser/pandora/vm/pandora_install.sh?format=txt > /root/pandora_install.sh
chmod 755 /root/pandora_install.sh
/root/pandora_install.sh >/root/pandora_install.log 2>&1
rm /root/pandora_install.sh
