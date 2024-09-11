# pan.do/ra - open media archive

  for more information about pan.do/ra visit our website at https://pan.do/ra

## Installing pan.do/ra

  We recommend to run pan.do/ra inside of LXD or LXC or dedicated VM or server.
  You will need at least 2GB of free disk space

  pan.do/ra is known to work with Debian/12 (bookworm) and Ubuntu 20.04,
  other distributions might also work, let us know if it works for you.

  Use the following commands as root to install pan.do/ra and all dependencies:

```
cd /root
curl -sL https://pan.do/ra-install > pandora_install.sh
chmod +x pandora_install.sh
export BRANCH=master # change to 'stable' to get the latest release (sometimes outdated)
./pandora_install.sh 2>&1 | tee pandora_install.log
```

 For step by step installation, look at [pandora_install.sh](vm/pandora_install.sh)


## Configuration

  pan.do/ra is mostly configured in two places:

### /srv/pandora/pandora/local_settings.py

  this file contains local Django configuration overwrites,
  like database configuration, email backend and more.


### /srv/pandora/pandora/config.jsonc

  config.jsonc can be used in configure the pan.do/ra related
  settings. From title to item keys to video resolutions.

  More info at
  https://code.0x2620.org/0x2620/pandora/wiki/Configuration


## Customization

  pan.do/ra can be customized, this is mostly done by adding
  JavaScript files that replace or enhance parts of pan.do/ra

  More info at
  https://code.0x2620.org/0x2620/pandora/wiki/Customization

## Update

  To update your existing instlalation run

  pandoractl update

