# Generated by Django 5.1.5 on 2025-04-27 14:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0007_rename_profile_picture_user_profilepicture'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_announcer',
            field=models.BooleanField(default=False),
        ),
    ]
