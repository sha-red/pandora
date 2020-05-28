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

def apply_patch():
    from django.db import connection, transaction
    cursor = connection.cursor()
    table = connection.introspection.get_table_description(cursor, User._meta.db_table)
    sql = []
    for row in table:
        if row.name in NEW_LENGTH and row.internal_size != NEW_LENGTH[row.name]:
            sql.append('ALTER TABLE "%s" ALTER "%s" TYPE varchar(%d)' % (User._meta.db_table, row.name, NEW_LENGTH[row.name]))

    for q in sql:
        cursor.execute(q)
    if sql:
        transaction.commit()


monkey_patch_username()
