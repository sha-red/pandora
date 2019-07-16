#!/bin/bash
export LANG=en_US.UTF-8
PANDORA=${PANDORA-pandora}
echo Installing pandora with user: $PANDORA
getent passwd $PANDORA > /dev/null 2>&1 || adduser --disabled-password --gecos "" $PANDORA

HOST=$(hostname -s)
HOST_CONFIG="/srv/pandora/pandora/config.$HOST.jsonc"
SITE_CONFIG="/srv/pandora/pandora/config.jsonc"
test -e $HOST_CONFIG && cp $HOST_CONFIG $SITE_CONFIG
test -e $SITE_CONFIG || cp /srv/pandora/pandora/config.pandora.jsonc $SITE_CONFIG

cat > /srv/pandora/pandora/local_settings.py <<EOF
import os

SECRET_KEY = os.environ.get('SECRET_KEY')
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'postgres',
        'USER': os.environ.get('POSTGRES_USER'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD'),
        'HOST': 'db',
        'PORT': 5432,
    }
}
CELERY_BROKER_URL = "amqp://{0}:{1}@rabbitmq:5672//".format(os.environ.get('RABBITMQ_DEFAULT_USER'), os.environ.get('RABBITMQ_DEFAULT_PASS'))
XACCELREDIRECT = True

DEBUG = False
TEMPLATE_DEBUG = DEBUG
JSON_DEBUG = False
DB_GIN_TRGM = True
WEBSOCKET_ADDRESS = "0.0.0.0"

EMAIL_HOST=os.environ.get('EMAIL_HOST')
EMAIL_HOST_USER=os.environ.get('EMAIL_USER')
EMAIL_HOST_PASSWORD=os.environ.get('EMAIL_PASSWORD')
EMAIL_PORT=int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS=os.environ.get('EMAIL_TLS', 'true').lower() == 'true'

overlay_settings = 'overlay_settings.py'
if os.path.exists(overlay_settings):
    from overlay_settings import *
EOF

cp /srv/pandora/pandora/gunicorn_config.py.in /srv/pandora/pandora/gunicorn_config.py
sed -i s/127.0.0.1/0.0.0.0/g /srv/pandora/pandora/gunicorn_config.py

chown -R $PANDORA:$PANDORA /srv/pandora

cd /srv/pandora
./ctl init
cp /srv/pandora/docker/entrypoint.sh /entrypoint.sh

mv /srv/pandora/ /srv/pandora_base/
mkdir /pandora
ln -s /pandora /srv/pandora
cat > /usr/local/bin/update.py << EOF
#!/bin/sh
exec /srv/pandora/update.py \$@
EOF

cat > /usr/local/bin/manage.py << EOF
#!/bin/sh
exec /srv/pandora/pandora/manage.py \$@
EOF
chmod +x /usr/local/bin/manage.py /usr/local/bin/update.py
