# Preparations

    you will need at least 2GB of free disk space to install pan.do/ra

# Installing pan.do/ra inside LXC

1) Install lxc on the host (Ubuntu 18.04):

    sudo apt-get install lxc

1.1) On Debian you have to configure the a network for LXC before creating a container

    Simplest setup is this one here:
        https://wiki.debian.org/LXC/SimpleBridge#Using_lxc-net

2) Create a new container, use different names if installing multiple instances:

    sudo lxc-create -n pandora -t ubuntu-cloud -- -r focal

    or

    sudo lxc-create -n pandora -t debian -- -r buster

3) Install pan.do/ra in container:

    sudo lxc-start -n pandora -d

4) Attach to container and install pan.do/ra

    sudo lxc-attach -n pandora --clear-env
    sed -i s/ubuntu/pandora/g /etc/passwd /etc/shadow /etc/group
    mv /home/ubuntu /home/pandora
    echo "pandora:pandora" | chpasswd
    echo PasswordAuthentication no >> /etc/ssh/sshd_config
    apt-get update -qq && apt-get upgrade -y
    apt-get -y install curl ca-certificates
    locale-gen en_US.UTF-8
    update-locale LANG=en_US.UTF-8
    export LANG=en_US.UTF-8

    cd /root
    curl -sL https://pan.do/ra-install > pandora_install.sh
    chmod +x pandora_install.sh
    export BRANCH=stable # or master
    ./pandora_install.sh 2>&1 | tee pandora_install.log

