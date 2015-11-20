#!/bin/sh
apt-get update -q
apt-get install -y curl
curl -L https://pan.do/ra-install > /root/pandora_install.sh
chmod 755 /root/pandora_install.sh
/root/pandora_install.sh >/root/pandora_install.log 2>&1
rm /root/pandora_install.sh
