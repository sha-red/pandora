# -*- coding: utf-8 -*-
# Generated by Django 1.9.4 on 2018-06-19 17:23
from __future__ import unicode_literals

import django.contrib.postgres.fields.jsonb
from django.db import migrations, models


def cleanup_sessiondata(apps, schema_editor):
    SessionData = apps.get_model("user", "SessionData")
    for data in SessionData.objects.all():
        changed = False
        plugins = []
        for p in data.info.get('navigator', {}).get('plugins', []):
            if p and '\x00' not in p:
                plugins.append(p)
            else:
                changed = True
        if changed:
            data.info['navigator']['plugins'] = plugins
            data.save()

class Migration(migrations.Migration):

    dependencies = [
        ('user', '0003_sessiondata_numberofcollections')
    ]

    operations = [
        migrations.RunPython(cleanup_sessiondata),
        migrations.RunSQL(
            'ALTER TABLE "user_sessiondata" ALTER COLUMN "info" TYPE jsonb USING "info"::text::jsonb'
        ),
        migrations.RunSQL(
            'ALTER TABLE "user_userprofile" ALTER COLUMN "ui" TYPE jsonb USING "ui"::text::jsonb'
        ),
        migrations.RunSQL(
            'ALTER TABLE "user_userprofile" ALTER COLUMN "preferences" TYPE jsonb USING "preferences"::text::jsonb'
        ),
    ]