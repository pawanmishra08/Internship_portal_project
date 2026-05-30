from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0004_studentprofile_degree_preferences_projects'),
    ]

    operations = [
        migrations.AddField(
            model_name='studentprofile',
            name='preferred_work_mode',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='studentprofile',
            name='target_role',
            field=models.CharField(blank=True, max_length=150),
        ),
    ]
