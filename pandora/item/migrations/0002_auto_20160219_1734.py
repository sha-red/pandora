# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-02-19 17:34
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('item', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='annotationsequence',
            name='item',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='_annotation_sequence', to='item.Item'),
        ),
    ]
