# Generated by Django 4.2.2 on 2023-06-25 11:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0012_listing_lister'),
    ]

    operations = [
        migrations.AddField(
            model_name='listing',
            name='isClosed',
            field=models.BooleanField(default=False),
        ),
    ]
