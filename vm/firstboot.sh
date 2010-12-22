#!/bin/sh
#fails in bootstrap
apt-get -y install ipython

#ffmpeg
wget http://firefogg.org/nightly/ffmpeg.linux -O /usr/local/bin/ffmpeg
chmod 755 /usr/local/bin/ffmpeg

wget http://firefogg.org/nightly/ffmpeg2theora.linux -O /usr/local/bin/ffmpeg2theora
chmod 755 /usr/local/bin/ffmpeg2theora

#postgresql
apt-get -y install postgresql
sudo -u postgres createuser -S -D -R pandora
sudo -u postgres createdb -O pandora pandora

#do not start systemwide transmission-daemon
/etc/init.d/transmission-daemon stop
sed -i "s/ENABLE_DAEMON=1/ENABLE_DAEMON=0/g" /etc/default/transmission-daemon

#rabbitmq
RABBITPWD=$(pwgen -n 16 -1)
rabbitmqctl add_user pandora $RABBITPWD
rabbitmqctl add_vhost /pandora
rabbitmqctl set_permissions -p /pandora pandora ".*" ".*" ".*"

#pandora
cat > /srv/pandora/pandora/local_settings.py << EOF
DATABASE_ENGINE = 'postgresql_psycopg2'
DATABASE_NAME = 'pandora'
DATABASE_USER = 'pandora'

POSTER_SERVICES=['http://data.0xdb.org/poster/']

BROKER_PASSWORD = "$RABBITPWD"

XACCELREDIRECT = True
EOF

cd /srv/pandora/pandora
sudo -u pandora python manage.py syncdb --noinput 
sudo -u pandora python manage.py loaddata fixtures/0xdb_properties.json
echo "UPDATE django_site SET domain = 'pandora.local', name = 'pandora.local' WHERE 1=1;" | sudo -u pandora python manage.py dbshell

mkdir /srv/pandora/data
chown -R pandora:pandora /srv/pandora

cp /srv/pandora/etc/init/* /etc/init/

service pandora-encoding start
service pandora-tasks start
service pandora start

#nginx
sed "s/__PREFIX__/\/srv\/pandora/g" "/srv/pandora/nginx/vhost.in" > "/etc/nginx/sites-available/default"
service nginx restart

