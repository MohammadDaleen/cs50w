# Generated by Django 4.2.2 on 2023-06-20 08:17

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0004_rename_commenter_comment_commenter'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='comment',
            name='auction',
        ),
        migrations.RemoveField(
            model_name='comment',
            name='commenter',
        ),
        migrations.DeleteModel(
            name='bid',
        ),
        migrations.DeleteModel(
            name='comment',
        ),
        migrations.DeleteModel(
            name='listing',
        ),
    ]