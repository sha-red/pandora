# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-02-19 17:34
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tv', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='channel',
            name='list',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='channel', to='itemlist.List'),
        ),
    ]