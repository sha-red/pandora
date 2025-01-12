# Generated by Django 4.2.3 on 2023-07-27 21:24

import django.core.serializers.json
from django.db import migrations, models
import oxdjango.fields


class Migration(migrations.Migration):

    dependencies = [
        ('changelog', '0002_jsonfield'),
    ]

    operations = [
        migrations.AlterField(
            model_name='changelog',
            name='id',
            field=models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
        migrations.AlterField(
            model_name='changelog',
            name='value',
            field=oxdjango.fields.JSONField(default=dict, editable=False, encoder=django.core.serializers.json.DjangoJSONEncoder),
        ),
        migrations.AlterField(
            model_name='log',
            name='data',
            field=oxdjango.fields.JSONField(default=dict, editable=False, encoder=django.core.serializers.json.DjangoJSONEncoder),
        ),
        migrations.AlterField(
            model_name='log',
            name='id',
            field=models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
    ]
