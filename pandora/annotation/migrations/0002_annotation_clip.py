# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-02-19 15:37
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('annotation', '0001_initial'),
        ('clip', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='annotation',
            name='clip',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='annotations', to='clip.Clip'),
        ),
    ]
