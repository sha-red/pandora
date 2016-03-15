#!/bin/bash
cd "`dirname "$0"`"
BASE=`pwd`
VERSION=`cd ..;git rev-list HEAD --count`
TARGET=${BASE}/pandora-r${VERSION}.vdi
SIZE=1T
RELEASE=trusty

if [ "$MIRROR" = "" ]; then
    MIRROR="--mirror http://archive.ubuntu.com/ubuntu/"
fi

if [ -e "$BASE/settings.sh" ]; then
    . "$BASE/settings.sh"
fi

if [ $(id -u) -ne 0 ]; then
    echo "you need to run $0 as root"
    exit 1
fi

# make sure ubuntu-archive-keyring is installed
test -e /usr/share/keyrings/ubuntu-archive-keyring.gpg || apt-get install ubuntu-archive-keyring

vmdebootstrap=`vmdebootstrap --version`
if [[ $vmdebootstrap == "1.4" ]]; then
    EXTRA=--no-systemd-networkd
fi

vmdebootstrap \
    --image ${TARGET}.img \
    --size ${SIZE} \
    --sparse \
    --distribution=${RELEASE} \
    $MIRROR \
    $EXTRA \
    --enable-dhcp \
    --no-serial-console \
    --no-kernel \
    --package "linux-image-generic" \
    --package "avahi-daemon" \
    --package "ssh" \
    --mbr \
    --grub \
    --sudo \
    --lock-root-password \
    --user pandora/pandora \
    --hostname pandora \
    --customize "${BASE}/prepare.sh" \
    --log ${TARGET}.log --log-level debug --verbose

echo "Installing pan.do/ra in VM"
qemu-system-x86_64 -enable-kvm -name pandora -m 1024 -drive "format=raw,file=${TARGET}.img" -vnc :2
rm -rf "${TARGET}"
/usr/bin/VBoxManage convertfromraw -format VDI "${TARGET}.img" "${TARGET}"
rm "${TARGET}.img"
