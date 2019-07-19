#!/bin/bash
# apt-get install kvm cloud-utils qemu-utils curl

BASE=`pwd`
VERSION=`cd ..;git rev-list HEAD --count`
TARGET=${BASE}/pandora-r${VERSION}.vdi

img=bionic-server-cloudimg-amd64.img

if [ ! -e $img ]; then
    echo downloading $img
    curl -s -O https://cloud-images.ubuntu.com/bionic/current/$img
fi
echo preparing ${TARGET}.img
cp -a $img ${TARGET}.img

cloud-localds seed.img cloud-config
qemu-img resize ${TARGET}.img +998G

echo boot image and install pandora
kvm -m 1024 \
    -smp 2 \
    -cdrom seed.img \
    -device e1000,netdev=user.0 \
    -netdev user,id=user.0,hostfwd=tcp::5555-:22,hostfwd=tcp::2620-:80 \
    -drive file=${TARGET}.img,if=virtio,cache=writeback,index=0 \
    -vnc :2

echo convert qcow2 to vdi
rm -rf "${TARGET}"
qemu-img convert -f qcow2 -O vdi "${TARGET}.img" "${TARGET}"
rm "${TARGET}.img"
