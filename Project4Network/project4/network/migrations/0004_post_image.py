# Generated by Django 5.1.5 on 2025-03-16 03:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0003_follower'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='post_images/'),
        ),
    ]
