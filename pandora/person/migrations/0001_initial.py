# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-02-19 15:37
from __future__ import unicode_literals

from django.db import migrations, models
import oxdjango.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Person',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, unique=True)),
                ('sortname', models.CharField(max_length=200)),
                ('sortsortname', models.CharField(max_length=200)),
                ('edited', models.BooleanField(default=False)),
                ('numberofnames', models.IntegerField(default=0)),
                ('aliases', oxdjango.fields.TupleField(default=[])),
                ('imdbId', models.CharField(blank=True, max_length=7)),
                ('wikipediaId', models.CharField(blank=True, max_length=1000)),
            ],
        ),
    ]
