# Generated by Django 4.2.2 on 2023-06-21 08:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0007_alter_listing_category'),
    ]

    operations = [
        migrations.AlterField(
            model_name='listing',
            name='category',
            field=models.CharField(blank=True, choices=[('fshn', 'Fashion'), ('tys', 'Toys'), ('elc', 'Electronics'), ('hom', 'Home'), ('etc', 'Etc'), ('', 'N/A')], max_length=4, null=True),
        ),
    ]