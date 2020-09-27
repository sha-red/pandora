#!/bin/bash

UBUNTU_CODENAME=bionic
if [ -e /etc/os-release ]; then
    . /etc/os-release
fi

export DEBIAN_FRONTEND=noninteractive
echo 'Acquire::Languages "none";' > /etc/apt/apt.conf.d/99languages
apt-get update -qq
echo "deb http://ppa.launchpad.net/j/pandora/ubuntu ${UBUNTU_CODENAME} main" > /etc/apt/sources.list.d/j-pandora.list
apt-get install -y gnupg2
apt-key add - <<EOF
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: GnuPG v1

mI0ESXYhEgEEALl9jDTdmgpApPbjN+7b85dC92HisPUp56ifEkKJOBj0X5HhRqxs
Wjx/zlP4/XJGrHnxJyrdPxjSwAXz7bNdeggkN4JWdusTkr5GOXvggQnng0X7f/rX
oJwoEGtYOCODLPs6PC0qjh5yPzJVeiRsKUOZ7YVNnwNwdfS4D8RZvtCrABEBAAG0
FExhdW5jaHBhZCBQUEEgZm9yIGpeiLYEEwECACAFAkl2IRICGwMGCwkIBwMCBBUC
CAMEFgIDAQIeAQIXgAAKCRAohRM8AZde82FfA/9OB/64/YLaCpizHZ8f6DK3rGgF
e6mX3rFK8yOKGGL06316VhDzfzMiZSauUZ0t+lKHR/KZYeSaFwEoUoblTG/s4IIo
9aBMHWhVXJW6eifKUmTGqEn2/0UxoWQq2C3F6njMkCaP+ALOD5uzaSYGdjqAUAwS
pAAGSEQ4uz6bYSeM4Q==
=SM2a
-----END PGP PUBLIC KEY BLOCK-----
EOF

apt-get update -qq
apt-get install -y \
    netcat-openbsd \
    sudo \
    iproute2 \
    vim \
    wget \
    pwgen \
    git \
    python3-setuptools \
    python3-pip \
    python3-venv \
    python3-dev \
    python3-pil \
    python3-numpy \
    python3-psycopg2 \
    python3-pyinotify \
    python3-simplejson \
    python3-lxml \
    python3-cssselect \
    python3-html5lib \
    python3-ox \
    python3-elasticsearch \
    oxframe \
    ffmpeg \
    mkvtoolnix \
    gpac \
    imagemagick \
    poppler-utils \
    ipython3 \
    tesseract-ocr \
    tesseract-ocr-eng \
    postfix \
    postgresql-client

apt-get install -y --no-install-recommends youtube-dl rtmpdump
apt-get clean

rm -f /install.sh
