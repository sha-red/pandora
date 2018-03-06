# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2017-12-31 12:33
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '__first__'),
        ('itemlist', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='list',
            name='groups',
            field=models.ManyToManyField(blank=True, related_name='lists', to='auth.Group'),
        ),
    ]