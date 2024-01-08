#!/bin/sh
docker run --rm code.0x2620.org/0x2620/pandora docker-compose.yml > docker-compose.yml
if [ ! -e .env ]; then
    docker run --rm code.0x2620.org/0x2620/pandora .env > .env
    echo .env >> .gitignore
fi
if [ ! -e config.jsonc ]; then
    docker run --rm code.0x2620.org/0x2620/pandora config.jsonc > config.jsonc
fi
cat > README.md << EOF
pan.do/ra docker instance

this folder was created with

    docker run --rm code.0x2620.org/0x2620/pandora setup | sh

To start pan.do/ra adjust the files in this folder:

 - add email configuration to .env
 - adjust config.jsonc to customize pan.do/ra
 - add local django settings to settings.py

and to get started run this:

    docker compose up -d

To update pan.do/ra run:

    docker compose run --rm pandora ctl update

To run pan.do/ra manage shell:

    docker compose run --rm pandora ctl manage shell
EOF
touch __init__.py
