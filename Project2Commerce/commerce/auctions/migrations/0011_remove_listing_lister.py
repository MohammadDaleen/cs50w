# Generated by Django 4.2.2 on 2023-06-25 09:21

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0010_listing_lister'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='listing',
            name='lister',
        ),
    ]
