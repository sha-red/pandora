#!/usr/bin/python3
import os
from binascii import hexlify
import string

chars = string.ascii_letters + string.digits

def pwgen(length=16):
    return ''.join(chars[c % len(chars)] for c in os.urandom(length))


print('''SECRET_KEY={SECRET_KEY}

POSTGRES_USER=pandora
POSTGRES_PASSWORD={POSTGRES_PASSWORD}

RABBITMQ_DEFAULT_USER=pandora
RABBITMQ_DEFAULT_PASS={RABBITMQ_PASSWORD}

# required to send out password reset emails
#EMAIL_HOST='example.com'
#EMAIL_USER='mail@example.com'
#EMAIL_PASSWORD='fixme'
#EMAIL_PORT=587
#EMAIL_TLS=true
'''.format(
    SECRET_KEY=hexlify(os.urandom(64)).decode(),
    POSTGRES_PASSWORD=pwgen(),
    RABBITMQ_PASSWORD=pwgen()
))
