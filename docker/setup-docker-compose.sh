#!/bin/sh
docker run 0x2620/pandora docker-compose.yml > docker-compose.yml
if [ ! -e .env ]; then
    docker run 0x2620/pandora .env > .env
    echo .env >> .gitignore
fi
if [ ! -e config.jsonc ]; then
    docker run 0x2620/pandora config.jsonc > config.jsonc
fi
cat > README.md << EOF
pan.do/ra docker instance

this folder was created with

    docker run 0x2620/pandora setup | sh

To start pan.do/ra adjust the files in this folder:

 - add email configuration to .env
 - adjust config.jsonc to customize pan.do/ra
 - add local django settings to settings.py

and to get started run this:

    docker-compose up -d

To update pan.do/ra run:

    docker-compose run pandora ctl update

EOF
touch __init__.py
