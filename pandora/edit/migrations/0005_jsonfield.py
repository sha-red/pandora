# -*- coding: utf-8 -*-
# Generated by Django 1.9.4 on 2018-06-19 17:23
from __future__ import unicode_literals

import django.contrib.postgres.fields.jsonb
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('edit', '0004_edit_groups'),
    ]

    operations = [
        migrations.RunSQL(
            'ALTER TABLE "edit_edit" ALTER COLUMN "query" TYPE jsonb USING "query"::text::jsonb'
        ),
        migrations.RunSQL(
            'ALTER TABLE "edit_edit" ALTER COLUMN "poster_frames" TYPE jsonb USING "poster_frames"::text::jsonb'
        ),
    ]
