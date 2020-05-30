# -*- coding: utf-8 -*-

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from django.core.validators import MaxLengthValidator

User = get_user_model()

# load config from json
from . import config
config.init()

NEW_LENGTH = {
    'username': 255,
    'email': 255,
    'password': 255,
}

def monkey_patch_username():
    for field in NEW_LENGTH:
        f = User._meta.get_field(field)
        f.max_length = NEW_LENGTH[field]
        for v in f.validators:
            if isinstance(v, MaxLengthValidator):
                v.limit_value = NEW_LENGTH[field]

    f = Group._meta.get_field('name')
    f.max_length = 255
    for v in f.validators:
        if isinstance(v, MaxLengthValidator):
            v.limit_value = 255

monkey_patch_username()
