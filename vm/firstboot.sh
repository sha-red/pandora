#!/bin/sh
#fails in bootstrap
apt-get -y install ipython ntp

#ffmpeg installed as apt package
#wget http://firefogg.org/nightly/ffmpeg.linux -O /usr/local/bin/ffmpeg
#chmod 755 /usr/local/bin/ffmpeg
#wget http://firefogg.org/nightly/ffmpeg2theora.linux -O /usr/local/bin/ffmpeg2theora
#chmod 755 /usr/local/bin/ffmpeg2theora

#postgresql
apt-get -y install postgresql postgresql-contrib
sudo -u postgres createuser -S -D -R pandora
sudo -u postgres createdb  -T template0 --locale=C --encoding=UTF8 -O pandora pandora
echo "CREATE EXTENSION pg_trgm;" | sudo -u postgres psql pandora

#rabbitmq
RABBITPWD=$(pwgen -n 16 -1)
rabbitmqctl add_user pandora $RABBITPWD
rabbitmqctl add_vhost /pandora
rabbitmqctl set_permissions -p /pandora pandora ".*" ".*" ".*"

#pandora
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

cd /srv/pandora/pandora
sudo -u pandora python manage.py syncdb --noinput
sudo -u pandora python manage.py sqlfindindex | sudo -u pandora python manage.py dbshell
echo "UPDATE django_site SET domain = '$HOST.local', name = '$HOST.local' WHERE 1=1;" | sudo -u pandora python manage.py dbshell
echo "DB_GIN_TRGM = True" >> /srv/pandora/pandora/local_settings.py

mkdir /srv/pandora/data
chown -R pandora:pandora /srv/pandora
sudo -u pandora python manage.py update_static
sudo -u pandora python manage.py collectstatic -l --noinput

cp /srv/pandora/etc/init/* /etc/init/

service pandora-encoding start
service pandora-tasks start
service pandora start

#nginx
sed "s/__PREFIX__/\/srv\/pandora/g" "/srv/pandora/etc/nginx/vhost.in" > "/etc/nginx/sites-available/default"
service nginx restart

cat > /usr/local/bin/fixtime <<EOF
#!/bin/bash
while [ 1 ]; do
    /usr/sbin/ntpdate pool.ntp.org >/dev/null
    sleep 600
done
EOF
chmod +x /usr/local/bin/fixtime
cat > /usr/local/bin/genissue <<EOF
#!/bin/bash
HOST=\$(rgrep .local /var/log/syslog | grep "Host name is" | tail -n 1 | awk '{print \$12}' | sed 's/\.$//')
echo Welcome to pan.do/ra. Connect via one of these URLs:
echo 
echo "  http://\$HOST/"
for ip in \$(ifconfig  | grep 'inet addr:'| grep -v '127.0.0.1' | cut -d: -f2 | awk '{ print \$1 }'); do
    echo "  http://\$ip/"
done
echo
EOF
chmod +x /usr/local/bin/genissue

cat > /etc/rc.local << EOF
#!/bin/sh -e
#vm has one network interface and that might change, make it not persistent
rm -f /etc/udev/rules.d/70-persistent-net.rules

#vm can be suspended, this help to keep the time in sync
/usr/local/bin/fixtime &

#update issue
/usr/local/bin/genissue > /etc/issue
EOF
chmod +x /etc/rc.local
