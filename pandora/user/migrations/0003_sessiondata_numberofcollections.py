# -*- coding: utf-8 -*-
# Generated by Django 1.9.4 on 2016-10-08 12:15
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0002_auto_20160219_1734'),
    ]

    operations = [
        migrations.AddField(
            model_name='sessiondata',
            name='numberofcollections',
            field=models.IntegerField(default=0, null=True),
        ),
    ]