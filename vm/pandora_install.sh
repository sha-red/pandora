#!/bin/bash
#
# pan.do/ra installer
# ===================
#

PANDORA=${PANDORA-pandora}

POSTGRES=${POSTGRES-local}
RABBITMQ=${RABBITMQ-local}
NGINX=${NGINX-local}
BRANCH=${BRANCH-stable}

# add a pandora user
echo Installing pandora with user: $PANDORA
getent passwd $PANDORA > /dev/null 2>&1 || adduser --disabled-password --gecos "" $PANDORA

#
# install pan.do/ra ppa
# 
# apt-get install software-properties-common
# add-apt-repository ppa:j/pandora
#
LXC=`grep -q lxc /proc/1/environ && echo 'yes' || echo 'no'`
if [ -e /etc/os-release ]; then
    . /etc/os-release
fi
if [ -z "$UBUNTU_CODENAME" ]; then
    UBUNTU_CODENAME=bionic
fi
export DEBIAN_FRONTEND=noninteractive
echo "deb http://ppa.launchpad.net/j/pandora/ubuntu ${UBUNTU_CODENAME} main" > /etc/apt/sources.list.d/j-pandora.list

apt-get install -y gnupg

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
echo 'Acquire::Languages "none";' > /etc/apt/apt.conf.d/99languages

apt-get update -qq

if [ "$LXC" == "no" ]; then
apt-get install -y acpid
systemctl enable systemd-timesyncd.service
fi

# add postgres, rabbitmq and nginx
# unless they are running on another host
EXTRA=""
if [ "$POSTGRES" == "local" ]; then
    EXTRA="$EXTRA postgresql postgresql-contrib"
fi
if [ "$RABBITMQ" == "local" ]; then
    EXTRA="$EXTRA rabbitmq-server"
fi
if [ "$NGINX" == "local" ]; then
    EXTRA="$EXTRA nginx"
fi

# install all required packages
apt-get install -y \
    sudo \
    openssh-server \
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
    postgresql-client $EXTRA

apt-get install -y --no-install-recommends youtube-dl rtmpdump

# setup database

if [ "$POSTGRES" == "local" ]; then
    sudo -u postgres createuser -S -D -R $PANDORA
    sudo -u postgres createdb  -T template0 --locale=C --encoding=UTF8 -O $PANDORA pandora
    echo "CREATE EXTENSION pg_trgm;" | sudo -u postgres psql pandora
fi

# setup rabbitmq
if [ "$RABBITMQ" == "local" ]; then
    RABBITPWD=$(pwgen -n 16 -1)
    rabbitmqctl add_user pandora $RABBITPWD
    rabbitmqctl add_vhost /pandora
    rabbitmqctl set_permissions -p /pandora pandora ".*" ".*" ".*"
    CELERY_BROKER_URL="amqp://pandora:$RABBITPWD@localhost:5672//pandora"
else
    CELERY_BROKER_URL="$RABBITMQ"
fi

# checkout pandora from git
git clone https://git.0x2620.org/pandora.git /srv/pandora
cd /srv/pandora
git checkout $BRANCH
chown -R $PANDORA:$PANDORA /srv/pandora
./ctl init

# create config.jsonc from templates in git
HOST=$(hostname -s)
HOST_CONFIG="/srv/pandora/pandora/config.$HOST.jsonc"
SITE_CONFIG="/srv/pandora/pandora/config.jsonc"
test -e $HOST_CONFIG && cp $HOST_CONFIG $SITE_CONFIG
test -e $SITE_CONFIG || cp /srv/pandora/pandora/config.pandora.jsonc $SITE_CONFIG

# create local_settings.py
cat > /srv/pandora/pandora/local_settings.py <<EOF
DATABASES = {
    'default': {
        'NAME': 'pandora',
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'USER': '$PANDORA',
        'PASSWORD': '',
    }
}
CELERY_BROKER_URL = '$CELERY_BROKER_URL'
XACCELREDIRECT = True

DEBUG = False
TEMPLATE_DEBUG = DEBUG
JSON_DEBUG = False
DB_GIN_TRGM = True
EOF

MANAGE="sudo -H -u $PANDORA /srv/pandora/pandora/manage.py"

# more sure all files are owned by the pandora user
mkdir /srv/pandora/data
chown -R $PANDORA:$PANDORA /srv/pandora

# initialize the database
echo "Initialize database..."
cd /srv/pandora/pandora
$MANAGE init_db
$MANAGE createcachetable
echo "UPDATE django_site SET domain = '$HOST.local', name = '$HOST.local' WHERE 1=1;" | $MANAGE dbshell

# install pandora systemd services
/srv/pandora/ctl install
if [ "$PANDORA" != "pandora" ]; then
    sed -i \
        -e "s/User=pandora/User=$PANDORA/g" \
        -e "s/Group=pandora/Group=$PANDORA/g" \
        -e "s/home\/pandora/home\/$PANDORA/g" \
        /etc/systemd/system/pandora*.service
    sed -i "s/pandora pandora/$PANDORA $PANDORA/g" /etc/tmpfiles.d/pandora.conf
    systemctl daemon-reload
fi

# if pandora is running inside a container, expose backend at port 2620
if [ "$LXC" == "yes" ]; then
    sed -i s/127.0.0.1/0.0.0.0/g /srv/pandora/pandora/gunicorn_config.py
    echo "WEBSOCKET_ADDRESS = \"0.0.0.0\"" >> /srv/pandora/pandora/local_settings.py
fi
/srv/pandora/ctl start

#logrotate
#cp "/srv/pandora/etc/logrotate.d/pandora" "/etc/logrotate.d/pandora"

# configure nginx
if [ "$NGINX" == "local" ]; then

cp "/srv/pandora/etc/nginx/pandora" "/etc/nginx/sites-available/pandora"
rm /etc/nginx/sites-enabled/default
ln -s ../sites-available/pandora /etc/nginx/sites-enabled/pandora

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

fi

# additional configurations if installed outside of LXD/LXC
if [ "$LXC" == "no" ]; then
echo Servers=pool.ntp.org >> /etc/systemd/timesyncd.conf
cat > /usr/local/bin/genissue <<EOF
#!/bin/sh
HOST=\$(ps ax | grep avahi-daemon | grep local | sed "s/.*\[\(.*\)\].*/\1/g" | sed 's/\.$//')
echo Welcome to pan.do/ra. Connect via one of these URLs:
echo 
if [ -n "\$HOST" ]; then
    echo "  http://\$HOST/"
fi
for ip in \$(ip -4 a | grep inet | grep -v peer | grep -v '127.0.0.1' | cut -f1 -d/ | sed s/inet//g | xargs); do
    echo "  http://\$ip/"
done
echo
EOF
chmod +x /usr/local/bin/genissue
/usr/local/bin/genissue > /etc/issue

cat > /etc/rc.local <<EOF
#!/bin/sh -e
# vm has one network interface and that might change, make sure its not persistent
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
if has('mouse')
  set mouse=
endif
EOF

cat > /etc/vim/vimrc.local <<EOF
runtime! defaults.vim
let g:skip_defaults_vim = 1

set mouse=
EOF
