# Generated by Django 4.2.2 on 2023-06-22 06:30

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0008_alter_listing_category'),
    ]

    operations = [
        migrations.CreateModel(
            name='Watchlist',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('auction', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='listingWatchlists', to='auctions.listing')),
                ('watcher', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='userWatchlists', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]