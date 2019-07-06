#!/bin/bash
set -e

action="$1"
user=pandora

export LANG=en_US.UTF-8
mkdir -p /run/pandora
chown -R ${user}.${user} /run/pandora

# pan.do/ra services
if [ "$action" = "pandora" ]; then
    if [ ! -e /srv/pandora/initialized ]; then
        echo "Setting up Pan.do/ra:"
        echo "Waiting for database connection..."
        /srv/pandora_base/docker/wait-for db 5432
        echo "Installing pan.do/ra..."
        rsync -a /srv/pandora_base/ /srv/pandora/

        if [ ! -e /overlay/install.py ]; then
            rsync -a /srv/pandora_base/docker/overlay/ /overlay/
            if [ ! -e /overlay/config.jsonc ]; then
                mv /srv/pandora/pandora/config.jsonc /overlay/config.jsonc
            fi
        fi
        /overlay/install.py

        echo "Initializing database..."
        echo "CREATE EXTENSION pg_trgm;" | /srv/pandora/pandora/manage.py dbshell
        /srv/pandora/pandora/manage.py init_db
        /srv/pandora/update.py db
        echo "Generating static files..."
        /srv/pandora/update.py static
        chown -R ${user}.${user} /srv/pandora/
        touch /srv/pandora/initialized
    fi
    /srv/pandora_base/docker/wait-for db 5432
    /srv/pandora_base/docker/wait-for rabbitmq 5672
    cd /srv/pandora/pandora
    exec /usr/bin/sudo -u $user -E -H \
        /srv/pandora/bin/gunicorn wsgi:application -c gunicorn_config.py
fi
if [ "$action" = "encoding" ]; then
    /srv/pandora_base/docker/wait-for-file /srv/pandora/initialized
    /srv/pandora_base/docker/wait-for rabbitmq 5672
    name=pandora-encoding-$(hostname)
    exec /usr/bin/sudo -u $user -E -H \
        /srv/pandora/bin/python \
        /srv/pandora/pandora/manage.py \
        celery worker \
        -c 1 \
        -Q encoding -n $name \
        -l INFO
fi
if [ "$action" = "tasks" ]; then
    /srv/pandora_base/docker/wait-for-file /srv/pandora/initialized
    /srv/pandora_base/docker/wait-for rabbitmq 5672
    name=pandora-default-$(hostname)
    exec /usr/bin/sudo -u $user -E -H \
        /srv/pandora/bin/python \
        /srv/pandora/pandora/manage.py \
        celery worker \
        -Q default,celery -n $name \
        --maxtasksperchild 1000 \
        -l INFO
fi
if [ "$action" = "cron" ]; then
    /srv/pandora_base/docker/wait-for-file /srv/pandora/initialized
    /srv/pandora_base/docker/wait-for rabbitmq 5672
    exec /usr/bin/sudo -u $user -E -H \
        /srv/pandora/bin/python \
        /srv/pandora/pandora/manage.py \
        celerybeat -s /run/pandora/celerybeat-schedule \
        --pidfile /run/pandora/cron.pid \
        -l INFO
fi
if [ "$action" = "websocketd" ]; then
    /srv/pandora_base/docker/wait-for-file /srv/pandora/initialized
    /srv/pandora_base/docker/wait-for rabbitmq 5672
    exec /usr/bin/sudo -u $user -E -H \
        /srv/pandora/bin/python \
        /srv/pandora/pandora/manage.py websocketd
fi

# pan.do/ra management and update
if [ "$action" = "manage.py" ]; then
    shift
    exec /usr/bin/sudo -u $user -E -H \
        /srv/pandora/pandora/manage.py "$@"
fi
if [ "$action" = "update.py" ]; then
    shift
    exec /usr/bin/sudo -u $user -E -H \
        /srv/pandora/update.py "$@"
fi
if [ "$action" = "bash" ]; then
    shift
    cd /
    exec /bin/bash "$@"
fi

# pan.do/ra setup hooks
if [ "$action" = "docker-compose.yml" ]; then
    cat /srv/pandora_base/docker-compose.yml | \
        sed "s#build: \.#image: 0x2620/pandora:latest#g" | \
        sed "s#\./overlay:#.:#g" | \
        sed "s#build: docker/nginx#image: 0x2620/pandora-nginx:latest#g"
    exit
fi
if [ "$action" = ".env" ]; then
    exec /srv/pandora_base/docker/dot.env.sample.py
fi
if [ "$action" = "config.jsonc" ]; then
    cat /srv/pandora_base/pandora/config.pandora.jsonc
    exit
fi
if [ "$action" = "setup" ]; then
    cat /srv/pandora_base/docker/setup-docker-compose.sh
    exit
fi

# pan.do/ra info
echo pan.do/ra docker container - https://pan.do/ra
echo
echo use this container with docker-compose,
echo to setup a new docker-compose envrionment run:
echo 
echo "  mkdir <sitename> && cd <sitename>"
echo "  docker run 0x2620/pandora setup | sh"
echo
echo adjust created files to match your needs and run:
echo
echo "  docker-compose up"
echo
