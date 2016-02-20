# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-02-19 15:37
from __future__ import unicode_literals

from django.db import migrations, models
import oxdjango.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('annotation', '0002_annotation_clip'),
    ]

    operations = [
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('modified', models.DateTimeField(auto_now=True)),
                ('defined', models.BooleanField(default=False)),
                ('name', models.CharField(max_length=255, null=True, unique=True)),
                ('name_sort', models.CharField(db_index=True, max_length=255, null=True)),
                ('name_find', models.TextField(default=b'')),
                ('wikipediaId', models.CharField(blank=True, max_length=1000)),
                ('alternativeNames', oxdjango.fields.TupleField(default=[])),
                ('start', models.CharField(default=b'', max_length=255)),
                ('startTime', models.BigIntegerField(default=None, null=True)),
                ('end', models.CharField(default=b'', max_length=255)),
                ('endTime', models.BigIntegerField(default=None, null=True)),
                ('duration', models.CharField(default=b'', max_length=255)),
                ('durationTime', models.BigIntegerField(default=None, null=True)),
                ('type', models.CharField(default=b'', max_length=255)),
                ('matches', models.IntegerField(default=0)),
                ('annotations', models.ManyToManyField(blank=True, related_name='events', to='annotation.Annotation')),
            ],
        ),
    ]
