from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0016_aboutcontent_aboutstat_leader_practicalinfo_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="LaureatJoinRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nom", models.CharField(max_length=100, verbose_name="Nom complet")),
                ("promotion", models.CharField(max_length=20, verbose_name="Promotion")),
                ("specialite", models.CharField(max_length=200, verbose_name="Specialite")),
                ("poste", models.CharField(max_length=150, verbose_name="Poste")),
                ("entreprise", models.CharField(max_length=150, verbose_name="Entreprise")),
                ("ville", models.CharField(max_length=100, verbose_name="Ville")),
                ("pays", models.CharField(max_length=100, verbose_name="Pays")),
                ("contact", models.EmailField(max_length=254, verbose_name="Contact")),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "En attente"), ("approved", "Approuvee"), ("rejected", "Rejetee")],
                        default="pending",
                        max_length=20,
                        verbose_name="Statut",
                    ),
                ),
                ("submitted_at", models.DateTimeField(auto_now_add=True, verbose_name="Soumis le")),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.SET_NULL,
                        related_name="laureat_join_requests",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Utilisateur",
                    ),
                ),
            ],
            options={
                "verbose_name": "Demande d'inscription laureat",
                "verbose_name_plural": "Demandes d'inscription laureat",
                "ordering": ["-submitted_at"],
            },
        ),
    ]
