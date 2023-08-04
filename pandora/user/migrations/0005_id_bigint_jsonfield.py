# Generated by Django 4.2.3 on 2023-07-27 21:28

import django.core.serializers.json
from django.db import migrations, models
import oxdjango.fields


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0004_jsonfield'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sessiondata',
            name='info',
            field=oxdjango.fields.JSONField(default=dict, editable=False, encoder=django.core.serializers.json.DjangoJSONEncoder),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='id',
            field=models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='notes',
            field=models.TextField(default=''),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='preferences',
            field=oxdjango.fields.JSONField(default=dict, editable=False, encoder=django.core.serializers.json.DjangoJSONEncoder),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='ui',
            field=oxdjango.fields.JSONField(default=dict, editable=False, encoder=django.core.serializers.json.DjangoJSONEncoder),
        ),
    ]