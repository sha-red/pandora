#!/bin/bash
LXC=`grep -q lxc /proc/1/environ && echo 'yes' || echo 'no'`
if [ -e /etc/os-release ]; then
    . /etc/os-release
else
    ID=unknown
fi
UBUNTU_VERSION="$VERSION_ID"
export DEBIAN_FRONTEND=noninteractive
if [ "$ID" == "debian" ]; then
    SYSTEMD="yes"
    echo "deb http://ppa.launchpad.net/j/pandora/ubuntu trusty main" > /etc/apt/sources.list.d/j-pandora.list
    gpg --keyserver keyserver.ubuntu.com --recv-keys 01975EF3
    gpg -a --export 01975EF3 | apt-key add -
else
    SYSTEMD="no"
    if [ "$UBUNTU_VERSION" == "12.04" ]; then
        EXTRA=python-software-properties
    else
        EXTRA=""
    fi
    apt-get install -y \
        update-manager-core \
        software-properties-common \
        $EXTRA

    add-apt-repository -y ppa:j/pandora
fi
apt-get update

if [ "$LXC" == "no" ]; then
apt-get install -y \
    acpid \
    ntp
fi

if [ "$UBUNTU_VERSION" == "12.04" ]; then
    LIBAVCODEC_EXTRA=libavcodec-extra-53
else
    LIBAVCODEC_EXTRA=libavcodec-extra
fi

apt-get install -y \
    openssh-server \
    vim \
    wget \
    pwgen \
    nginx \
    rabbitmq-server \
    bzr \
    git \
    subversion \
    mercurial \
    python-setuptools \
    python-pip \
    python-virtualenv \
    python-imaging \
    python-dev \
    python-imaging \
    python-numpy \
    python-psycopg2 \
    python-pyinotify \
    python-simplejson \
    python-lxml \
    python-html5lib \
    python-ox \
    oxframe \
    $LIBAVCODEC_EXTRA \
    libav-tools \
    ffmpeg2theora \
    melt \
    mkvtoolnix \
    gpac \
    imagemagick \
    poppler-utils \
    ipython \
    postfix \
    postgresql \
    postgresql-contrib

mkdir -p /home/pandora/.ox/bin
wget -O /home/pandora/.ox/bin/ffmpeg https://firefogg.org/bin/ffmpeg.linux
wget -O /home/pandora/.ox/bin/ffmpeg2theora https://firefogg.org/bin/ffmpeg2theora.linux
chmod +x /home/pandora/.ox/bin/*
chown -R pandora.pandora /home/pandora/.ox


sudo -u postgres createuser -S -D -R pandora
sudo -u postgres createdb  -T template0 --locale=C --encoding=UTF8 -O pandora pandora
echo "CREATE EXTENSION pg_trgm;" | sudo -u postgres psql pandora

#rabbitmq
RABBITPWD=$(pwgen -n 16 -1)
rabbitmqctl add_user pandora $RABBITPWD
rabbitmqctl add_vhost /pandora
rabbitmqctl set_permissions -p /pandora pandora ".*" ".*" ".*"

#pandora
bzr branch http://code.0x2620.org/pandora /srv/pandora
bzr branch http://code.0x2620.org/oxjs /srv/pandora/static/oxjs
virtualenv --system-site-packages /srv/pandora
/srv/pandora/bin/pip install -r /srv/pandora/requirements.txt

HOST=$(hostname -s)
HOST_CONFIG="/srv/pandora/pandora/config.$HOST.jsonc"
SITE_CONFIG="/srv/pandora/pandora/config.jsonc"
test -e $HOST_CONFIG && cp $HOST_CONFIG $SITE_CONFIG
test -e $SITE_CONFIG || cp /srv/pandora/pandora/config.pandora.jsonc $SITE_CONFIG

cat > /srv/pandora/pandora/local_settings.py << EOF
DATABASES = {
    'default': {
        'NAME': 'pandora',
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'USER': 'pandora',
        'PASSWORD': '',
    }
}
BROKER_PASSWORD = "$RABBITPWD"
XACCELREDIRECT = True

DEBUG = False
TEMPLATE_DEBUG = DEBUG
JSON_DEBUG = False
EOF

MANAGE="sudo -H -u pandora python manage.py"

cd /srv/pandora/pandora
$MANAGE syncdb --noinput
$MANAGE migrate
echo "DB_GIN_TRGM = True" >> /srv/pandora/pandora/local_settings.py
$MANAGE sqlfindindex
$MANAGE sync_itemsort
echo "UPDATE django_site SET domain = '$HOST.local', name = '$HOST.local' WHERE 1=1;" | $MANAGE dbshell

mkdir /srv/pandora/data
chown -R pandora:pandora /srv/pandora
$MANAGE update_static
$MANAGE collectstatic -l --noinput

if [ "$SYSTEMD" == "yes" ]; then
    cp /srv/pandora/etc/systemd/*.service /lib/systemd/system/
    cp /srv/pandora/etc/tmpfiles.d/pandora.conf /usr/lib/tmpfiles.d/
    if [ "$LXC" == "yes" ]; then
        sed -i s/127.0.0.1/0.0.0.0/g /lib/systemd/system/pandora.service
    fi
    systemd-tmpfiles --create /usr/lib/tmpfiles.d/pandora.conf >/dev/null || true
    for service in pandora pandora-tasks pandora-encoding pandora-cron; do
        systemctl enable ${service}.service
    done
else
    cp /srv/pandora/etc/init/* /etc/init/
    if [ "$LXC" == "yes" ]; then
        sed -i s/127.0.0.1/0.0.0.0/g /etc/init/pandora.conf
    fi
fi
/srv/pandora/ctl start

#logrotate
cp "/srv/pandora/etc/logrotate.d/pandora" "/etc/logrotate.d/pandora"

#nginx
cp "/srv/pandora/etc/nginx/pandora" "/etc/nginx/sites-available/default"

read -r -d '' GZIP <<EOI
gzip_static  on;\\
\tgzip_http_version 1.1;\\
\tgzip_vary on;\\
\tgzip_comp_level 6;\\
\tgzip_proxied any;\\
\tgzip_types text/plain text/css application/json text/json application/x-javascript text/xml application/xml application/xml+rss text/javascript application/javascript text/x-js;\\
\tgzip_buffers 16 8k;\\
\tgzip_disable "MSIE [1-6]\.(?!.*SV1)";
EOI

sed -i -e "s#gzip_disable \"msie6\";#${GZIP}#g" /etc/nginx/nginx.conf

service nginx restart

if [ "$LXC" == "yes" ]; then
    test -e /etc/init/avahi-daemon.conf && sed -i "s/-D/--no-rlimits -D/g" /etc/init/avahi-daemon.conf
fi

if [ "$LXC" == "no" ]; then
cat > /usr/local/bin/fixtime <<EOF
#!/bin/bash
while [ 1 ]; do
    /usr/sbin/ntpdate pool.ntp.org >/dev/null
    sleep 600
done
EOF
chmod +x /usr/local/bin/fixtime
fi

cat > /usr/local/bin/genissue <<EOF
#!/bin/sh
HOST=\$(ps ax | grep avahi-daemon | grep local | sed "s/.*\[\(.*\)\].*/\1/g" | sed 's/\.$//')
echo Welcome to pan.do/ra. Connect via one of these URLs:
echo 
if [ -n "\$HOST" ]; then
    echo "  http://\$HOST/"
fi
for ip in \$(ifconfig  | grep 'inet addr:'| grep -v '127.0.0.1' | cut -d: -f2 | awk '{ print \$1 }'); do
    echo "  http://\$ip/"
done
echo
EOF
chmod +x /usr/local/bin/genissue
/usr/local/bin/genissue > /etc/issue

cat > /etc/rc.local << EOF
#!/bin/sh -e
#vm has one network interface and that might change, make it not persistent
rm -f /etc/udev/rules.d/70-persistent-net.rules

#update issue
/usr/local/bin/genissue > /etc/issue
EOF

if [ "$LXC" == "no" ]; then
cat >> /etc/rc.local << EOF

#vm can be suspended, this help to keep the time in sync
/usr/local/bin/fixtime &
EOF
fi

chmod +x /etc/rc.local

cat > /home/pandora/.vimrc <<EOF
set nocompatible
set encoding=utf-8
set showcmd
set autochdir

set tabstop=4 shiftwidth=4
set expandtab

set si
set sw=4
set sts=4
set backspace=indent,eol,start

set hlsearch
set incsearch
set ignorecase
set smartcase

set modeline

nmap <C-V> "+gP
imap <C-V> <ESC><C-V>i
vmap <C-C> "+y

filetype plugin indent on
syntax on

nmap <C-H> :tabprev<CR>
nmap <C-L> :tabnext<CR>

hi SpellBad ctermbg=0

nnoremap <F2> :set invpaste paste?<CR>
set pastetoggle=<F2>
set showmode
EOF
apt-get clean
