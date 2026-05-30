from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0002_drop_stale_avatar_url'),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE core_user DROP COLUMN IF EXISTS skills;",
            reverse_sql="ALTER TABLE core_user ADD COLUMN IF NOT EXISTS skills jsonb;",
        ),
    ]
