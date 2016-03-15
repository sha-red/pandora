#!/bin/sh
set -e

rootdir=$1
BASE=$(dirname $0)
RELEASE=trusty

if [ -e "$BASE/settings.sh" ]; then
    . "$BASE/settings.sh"
fi

SOURCE_LIST="/etc/apt/sources.list.d/base.list"
if [ ! -e "$rootdir/$SOURCE_LIST" ]; then
    SOURCE_LIST="/etc/apt/sources.list"
fi

cat > "$rootdir/root/pandora_install" << EOF
#!/bin/bash
DEBIAN_FRONTEND=noninteractive
sed -i "s/main\$/main restricted universe multiverse/g" $SOURCE_LIST
apt-get update
apt-get -y --force-yes dist-upgrade

EOF
cat "$BASE/pandora_install.sh" >> "$rootdir/root/pandora_install"

#reset install proxy settings
cat >> "$rootdir/root/pandora_install" <<EOF
cat > $SOURCE_LIST <<EOS
deb http://archive.ubuntu.com/ubuntu $RELEASE main restricted universe multiverse
deb-src http://archive.ubuntu.com/ubuntu $RELEASE main restricted universe multiverse
EOS

apt-get -qq update
sed -i \
    -e 's/GRUB_CMDLINE_LINUX=""/GRUB_CMDLINE_LINUX="silent"/g' \
    /etc/default/grub
update-grub
rm -f /etc/init/pandora_install.conf /pandora_install
shutdown -h now
EOF

chmod +x "$rootdir/root/pandora_install"

cat >> "$rootdir/pandora_install" <<EOF
#!/bin/bash
/root/pandora_install >/root/pandora_install.log 2>&1 &
$INSTALL_EXTRA
EOF
chmod +x "$rootdir/pandora_install"

cat > "$rootdir/etc/init/pandora_install.conf" << EOF
description	"install pan.do/ra"
start on (local-filesystems and net-device-up IFACE=eth0)
stop on [!12345]
task
exec /pandora_install
EOF
