# -*- coding: utf-8 -*-
# Generated by Django 1.9.4 on 2018-06-19 17:23
from __future__ import unicode_literals

import django.contrib.postgres.fields.jsonb
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            'ALTER TABLE "home_item" ALTER COLUMN "data" TYPE jsonb USING "data"::text::jsonb'
        ),
    ]