# Generated by Django 4.2.3 on 2023-07-27 21:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('annotation', '0003_auto_20160219_1537'),
    ]

    operations = [
        migrations.AlterField(
            model_name='annotation',
            name='id',
            field=models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
    ]