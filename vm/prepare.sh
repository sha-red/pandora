#!/bin/sh
set -e

rootdir=$1
base=$(dirname $0)
RELEASE=trusty

cat > "$rootdir/root/pandora_install" << EOF
#!/bin/bash
DEBIAN_FRONTEND=noninteractive
sed -i "s/main/main restricted universe multiverse/g" /etc/apt/sources.list.d/base.list
apt-get update
apt-get -y --force-yes dist-upgrade

EOF
cat "$base/pandora_install.sh" >> "$rootdir/root/pandora_install"

#reset install proxy settings
cat >> "$rootdir/root/pandora_install" <<EOF
cat > /etc/apt/sources.list.d/base.list <<EOS
deb http://archive.ubuntu.com/ubuntu $RELEASE main restricted universe multiverse
deb-src http://archive.ubuntu.com/ubuntu $RELEASE main restricted universe multiverse
EOS
apt-get -qq update
sed -i \
    -e 's/GRUB_CMDLINE_LINUX=""/GRUB_CMDLINE_LINUX="silent"/g' \
    /etc/default/grub
update-grub
EOF

chmod +x "$rootdir/root/pandora_install"

test -e "$rootdir/etc/rc.local" && mv "$rootdir/etc/rc.local" "$rootdir/etc/rc.local.orig"
cat > "$rootdir/etc/rc.local" <<EOF
#!/bin/sh -e

#execute pandora_install
if [ -e /root/pandora_install ]; then
    /root/pandora_install 2>&1 | tee /root/pandora_install.log || true
    mv /root/pandora_install /root/pandora_installed
    shutdown -h now
fi

exit 0
EOF
chmod +x "$rootdir/etc/rc.local"

