== Installing pan.do/ra inside LXC ==

1) Install lxc on the host (Ubuntu 12.04 or later):

    $ sudo apt-get install lxc

2) Create a new container, use other name if installing multiple

    $ sudo lxc-create -n pandora-dev -t ubuntu -- -r precise

3) Install pan.do/ra in container

    $ sudo lxc-start -n pandora-dev

    Now login as ubuntu/ubuntu and run the following commands:

    $ sudo su
    $ cd /root
    $ curl 'https://wiki.0x2620.org/browser/pandora/vm/firstboot.sh?format=txt' > firstboot.sh
    $ chmod +x firstboot
    $ apt-get -y install avahi-daemon
    $ sed -i s/ubuntu/pandora/g /etc/passwd /etc/shadow /etc/group
    $ mv /home/ubuntu /home/pandora
    $ echo "pandora:pandora" | chpasswd
    $ locale-gen en_US.UTF-8
    $ dpkg-reconfigure locales
    $ ./firstboot.sh

