# Generated manually for proper data migration

import django.db.models.deletion
from django.db import migrations, models


def clean_specialite_data(apps, schema_editor):
    """Nettoie les données existantes avant la migration FK."""
    User = apps.get_model('api', 'User')
    # Met à NULL les valeurs vides pour éviter les erreurs FK
    User.objects.filter(specialite='').update(specialite=None)


def create_initial_specialites(apps, schema_editor):
    """Crée les spécialités initiales de l'ENSAM."""
    Specialite = apps.get_model('api', 'Specialite')
    
    specialites = [
        ("API-MPT", "Années Préparatoires Intégrées : Mathématique, Physique et Technologie"),
        ("GC24", "Génie Civil"),
        ("GE-DI", "Génie Electromécanique : Digitalisation Industrielle"),
        ("GE-MCI", "Génie Electromécanique : Maintenance et Commande Industrielles"),
        ("GI-ILSI", "Génie Informatique : Ingénierie Logicielle et Systèmes Intelligents"),
        ("GIEO", "Génie Industriel : Excellence Opérationnelle"),
        ("GIP24", "Génie Industriel et Productique"),
        ("GM-CISM", "Génie Mécanique : Conception et Industrialisation des Systèmes Mécaniques"),
        ("GM-IMS", "Génie Mécanique : Ingénierie Mécanique et Structures"),
        ("GM-MPF", "Génie Mécanique : Matériaux et Procédés de Fabrication"),
        ("GME24", "Génie Mécanique : Energétique"),
        ("IATD-SI", "Intelligence Artificielle et Technologies des Données : Systèmes Industriels"),
        ("PEI", "Parcours Electro Industriel"),
        ("PM", "Parcours Mécanique"),
        ("API", "Années Préparatoires Intégrées"),
        ("CPI", "Classes Préparatoires Intégrées"),
        ("TC3A-24", "Tronc Commun 3A - 2024"),
        ("TC4A-24", "Tronc Commun 4A - 2024"),
        ("TC4A", "Tronc Commun 4A"),
        ("TC5A", "Tronc Commun 5A"),
        ("GEC", "Génie Electromécanique : Commande et Management Industriel"),
        ("GEE", "Génie Electromécanique : Energie et Maintenance Electromécanique"),
        ("GIIA", "Génie Industriel : Intelligence Artificielle et Data Science"),
        ("GIPR", "Génie Industriel et Productique"),
        ("GME", "Génie Mécanique : Energétique"),
        ("GMP", "Génie Mécanique : Procédés de Fabrication Industrielle"),
        ("GMS", "Génie Mécanique : Structures et Ingénierie des Produits"),
        ("CIVIL", "Génie Civil"),
        ("DS2M", "Master science des données pour une industrie intelligente"),
        ("EMSI", "Electromécanique et Systèmes Industriels"),
        ("GC", "Génie Civil"),
        ("GIP", "Génie Industriel et Productique"),
        ("GM", "Génie Mécanique"),
        ("GTIER", "Génie Thermique Industrielle et Energies Renouvelables"),
        ("IPP", "Industrialisation des Produits et Procédés"),
        ("TC3A", "Tronc Commun 3A"),
        ("M2I", "Master Modélisation Mathématique en Ingénierie"),
    ]
    
    for code, intitule in specialites:
        Specialite.objects.get_or_create(code=code, defaults={"intitule": intitule})


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        # Étape 1: Créer le modèle Specialite
        migrations.CreateModel(
            name="Specialite",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "code",
                    models.CharField(max_length=20, unique=True, verbose_name="Code"),
                ),
                ("intitule", models.CharField(max_length=200, verbose_name="Intitulé")),
                ("is_active", models.BooleanField(default=True, verbose_name="Actif")),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="Créé le"),
                ),
            ],
            options={
                "verbose_name": "Spécialité",
                "verbose_name_plural": "Spécialités",
                "ordering": ["code"],
            },
        ),
        
        # Étape 2: Insérer les spécialités initiales
        migrations.RunPython(create_initial_specialites, migrations.RunPython.noop),
        
        # Étape 3: Supprimer l'ancien champ texte
        migrations.RemoveField(
            model_name="user",
            name="specialite",
        ),
        
        # Étape 4: Ajouter le nouveau champ FK
        migrations.AddField(
            model_name="user",
            name="specialite",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="users",
                to="api.specialite",
                verbose_name="Spécialité",
            ),
        ),
    ]
