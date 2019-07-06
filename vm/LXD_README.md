# Preparations

    you will need at least 2GB of free disk space to install pan.do/ra

# Installing pan.do/ra inside LXD

1) Install lxd on the host (Ubuntu 16.04 or later):

    sudo apt-get install lxd

[on debian you can use snap install lxd]

2) Create a new container, use different names if installing multiple instances:

    sudo lxc launch ubuntu:18.04 pandora

    or

    sudo lxc launch images:debian/stretch pandora

3) Attach to container and install pan.do/ra

    sudo lxc exec pandora bash
    apt-get update -qq && apt-get upgrade -y
    apt-get -y install curl ca-certificates
    sed -i s/ubuntu/pandora/g /etc/passwd /etc/shadow /etc/group
    mv /home/ubuntu /home/pandora
    echo "pandora:pandora" | chpasswd
    echo PasswordAuthentication no >> /etc/ssh/sshd_config
    locale-gen en_US.UTF-8
    update-locale LANG=en_US.UTF-8
    export LANG=en_US.UTF-8

    cd /root
    curl -sL https://pan.do/ra-install > pandora_install.sh
    chmod +x pandora_install.sh
    ./pandora_install.sh 2>&1 | tee pandora_install.log

