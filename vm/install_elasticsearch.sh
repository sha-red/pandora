#!/bin/sh
curl -sL https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" > /etc/apt/sources.list.d/elasticsearch.list
apt-get update -qq
apt-get -y install elasticsearch
cat >> /etc/elasticsearch/elasticsearch.yml << EOF
xpack.security.enabled: false
discovery.type: single-node
EOF
cat > /etc/elasticsearch/jvm.options.d/mem.options << EOF
-Xms8g
-Xmx8g
EOF
systemctl enable elasticsearch.service
systemctl start elasticsearch.service
#curl -X GET "http://localhost:9200/?pretty"
