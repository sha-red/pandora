# Create virtual disk of pan.do/ra

## Preparations

Pan.do/ra VM are based on cloud images.
You also qemu to run the vm and virtualbox to convert the image

    apt-get install virtualbox qemu qemu-utils
    apt-get install kvm cloud-utils


## Building

You can configure some of the arguments in build.sh once done run:

    ./build.sh

this will create a vdi image in pandora-r{REVISON}.vdi


## VirtualBox Usage

Now you can create a new VirtualBox machine,
select Linux/Ubuntu and use vdi image as existing hard disk.

Before starting up:

 In Network -> Adpater 1 set to Bridged Adapter with your connected controller


## Use for development

Login via ssh or in terminal as pandora with password pandora

    ssh pandora@pandora.local

Pan.do/ra is installed in /srv/pandora and is served with nginx on http://pandora.local


## Update

to get the latest version of pan.do/ra

    cd /srv/pandora
    pandoractl update

