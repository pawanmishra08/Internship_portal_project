from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE core_user DROP COLUMN IF EXISTS avatar_url;",
            reverse_sql="ALTER TABLE core_user ADD COLUMN IF NOT EXISTS avatar_url varchar(500);",
        ),
    ]
