from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0020_remove_guestactivityregistration_whatsapp"),
    ]

    operations = [
        migrations.AlterField(
            model_name="leader",
            name="image",
            field=models.FileField(blank=True, null=True, upload_to="leaders/"),
        ),
    ]
