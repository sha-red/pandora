Create virtual disk of pan.do/ra

== ubuntu-vm-builder setup ==

on ubuntu 11.10 you need to install python-vm-builder

  apt-get install python-vm-builder

due to https://bugs.launchpad.net/vmbuilder/+bug/683614
building vbox images does not work. install virtualbox_vm.py:
    sudo cp virtualbox_vm.py /usr/lib/python2.6/dist-packages/VMBuilder/plugins/virtualbox/vm.py

(or change vbox to kvm to build kvm image)

with that installed build image:

 ./build.sh

this will create a vdi image in pandora/

== VirtualBox Usage ==
Now you can create a new VirtualBox machine, use vdi image as existing hard disk.
Before starting up you have to adjust some settings:
 In System -> Processor enable PAE/NX
 In Storage remove disk from SATA Controller
            add disk to IDE Controler and enable "Use host I/O cache"
    
 In Network -> Adpater 1 set to Bridged Adapter with your connected controller

== Use for development ==
Login via ssh or in terminal as pandora with password pandora

Adjust your bzr configuration with bzr whoami:
 bzr whoami "Pando the Panda <pan.do@pan.do>"

Pan.do/ra is installed in /srv/pandora and is served with nginx on http://pandora.local


== Update ==
to get the latest version of pan.do/ra
 cd /srv/pandora
 ./update.sh

you might have to adjust the database at this point. now restart pandora daemons

 service pandora restart
 service pandora-tasks restart
 service pandora-encoding restart

