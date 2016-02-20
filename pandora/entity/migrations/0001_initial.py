# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-02-19 15:37
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import oxdjango.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('document', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DocumentProperties',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('modified', models.DateTimeField(auto_now=True)),
                ('index', models.IntegerField(default=0)),
                ('document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='document.Document')),
            ],
        ),
        migrations.CreateModel(
            name='Entity',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('modified', models.DateTimeField(auto_now=True)),
                ('type', models.CharField(max_length=255)),
                ('name', models.CharField(max_length=255)),
                ('alternativeNames', oxdjango.fields.TupleField(default=[])),
                ('data', oxdjango.fields.DictField(default={}, editable=False)),
                ('matches', models.IntegerField(default=0)),
                ('name_sort', models.CharField(max_length=255, null=True)),
                ('name_find', models.TextField(default=b'')),
                ('documents', models.ManyToManyField(related_name='entities', through='entity.DocumentProperties', to='document.Document')),
                ('user', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='entities', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Find',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(db_index=True, max_length=200)),
                ('value', models.TextField(blank=True, db_index=True)),
                ('entity', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='find', to='entity.Entity')),
            ],
        ),
        migrations.AddField(
            model_name='documentproperties',
            name='entity',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documentproperties', to='entity.Entity'),
        ),
        migrations.AlterUniqueTogether(
            name='find',
            unique_together=set([('entity', 'key')]),
        ),
        migrations.AlterUniqueTogether(
            name='entity',
            unique_together=set([('type', 'name')]),
        ),
        migrations.AlterUniqueTogether(
            name='documentproperties',
            unique_together=set([('entity', 'document')]),
        ),
    ]
