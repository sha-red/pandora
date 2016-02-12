#!/bin/bash
PANDORA=${PANDORA-pandora}
echo Installing pandora with user: $PANDORA
getent passwd $PANDORA > /dev/null 2>&1 || adduser --disabled-password --gecos "" $PANDORA

LXC=`grep -q lxc /proc/1/environ && echo 'yes' || echo 'no'`
if [ -e /etc/os-release ]; then
    . /etc/os-release
else
    ID=unknown
fi
UBUNTU_VERSION="$VERSION_ID"
if [ -d "/run/systemd/system/" ]; then
    SYSTEMD="yes"
else
    SYSTEMD="no"
fi
export DEBIAN_FRONTEND=noninteractive
echo "deb http://ppa.launchpad.net/j/pandora/ubuntu trusty main" > /etc/apt/sources.list.d/j-pandora.list
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

if [ "$LXC" == "no" ]; then
apt-get install -y \
    acpid \
    ntp
fi

apt-get install -y \
    sudo \
    openssh-server \
    vim \
    wget \
    pwgen \
    nginx \
    rabbitmq-server \
    git \
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
    ffmpeg \
    mkvtoolnix \
    gpac \
    imagemagick \
    poppler-utils \
    ipython \
    postfix \
    postgresql \
    postgresql-contrib

sudo -u postgres createuser -S -D -R $PANDORA
sudo -u postgres createdb  -T template0 --locale=C --encoding=UTF8 -O $PANDORA pandora
echo "CREATE EXTENSION pg_trgm;" | sudo -u postgres psql pandora

#rabbitmq
RABBITPWD=$(pwgen -n 16 -1)
rabbitmqctl add_user pandora $RABBITPWD
rabbitmqctl add_vhost /pandora
rabbitmqctl set_permissions -p /pandora pandora ".*" ".*" ".*"

#pandora
git clone --depth 1 https://git.0x2620.org/pandora.git /srv/pandora
git clone --depth 1 https://git.0x2620.org/oxjs.git /srv/pandora/static/oxjs
virtualenv --system-site-packages /srv/pandora
cd /srv/pandora
./bin/pip install -r /srv/pandora/requirements.txt

HOST=$(hostname -s)
HOST_CONFIG="/srv/pandora/pandora/config.$HOST.jsonc"
SITE_CONFIG="/srv/pandora/pandora/config.jsonc"
test -e $HOST_CONFIG && cp $HOST_CONFIG $SITE_CONFIG
test -e $SITE_CONFIG || cp /srv/pandora/pandora/config.pandora.jsonc $SITE_CONFIG

cat > /srv/pandora/pandora/local_settings.py <<EOF
DATABASES = {
    'default': {
        'NAME': 'pandora',
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'USER': '$PANDORA',
        'PASSWORD': '',
    }
}
BROKER_URL = 'amqp://pandora:$RABBITPWD@localhost:5672//pandora'
XACCELREDIRECT = True

DEBUG = False
TEMPLATE_DEBUG = DEBUG
JSON_DEBUG = False
DB_GIN_TRGM = True
EOF

MANAGE="sudo -H -u $PANDORA /srv/pandora/pandora/manage.py"

mkdir /srv/pandora/data
chown -R $PANDORA:$PANDORA /srv/pandora

echo "Initialize database..."
cd /srv/pandora/pandora
$MANAGE init_db
echo "UPDATE django_site SET domain = '$HOST.local', name = '$HOST.local' WHERE 1=1;" | $MANAGE dbshell

/srv/pandora/ctl install
if [ "$PANDORA" != "pandora" ]; then
    sed -i \
        -e "s/USER=pandora/USER=$PANDORA/g" \
        -e "s/home\/pandora/home\/$PANDORA/g" \
        /etc/init/pandora*.conf
fi

if [ "$LXC" == "yes" ]; then
    if [ "$SYSTEMD" == "yes" ]; then
        sed -i s/127.0.0.1/0.0.0.0/g /lib/systemd/system/pandora.service
    else
        sed -i s/127.0.0.1/0.0.0.0/g /etc/init/pandora.conf
    fi
    echo "WEBSOCKET_ADDRESS = \"0.0.0.0\"" >> /srv/pandora/pandora/local_settings.py
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
    if [ "$SYSTEMD" == "yes" ]; then
        echo Servers=pool.ntp.org >> /etc/systemd/timesyncd.conf
    else
cat > /etc/cron.d/ntp_fixtime <<EOF
# /etc/cron.d/ntp_fixtime: vms can go out of sync, run ntpdate to sync time

*/10 * * * *   root /usr/sbin/ntpdate pool.ntp.org >/dev/null
EOF
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

cat > /etc/rc.local <<EOF
#!/bin/sh -e
#vm has one network interface and that might change, make sure its not persistent
rm -f /etc/udev/rules.d/70-persistent-net.rules

#update issue
/usr/local/bin/genissue > /etc/issue
EOF
chmod +x /etc/rc.local
fi

apt-get clean

cat > /home/$PANDORA/.vimrc <<EOF
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
au BufNewFile,BufRead *.jsonc        setf javascript

nmap <C-H> :tabprev<CR>
nmap <C-L> :tabnext<CR>

hi SpellBad ctermbg=0

nnoremap <F2> :set invpaste paste?<CR>
set pastetoggle=<F2>
set showmode

set lcs=tab:→·,trail:·,nbsp:˽
set list
EOF
