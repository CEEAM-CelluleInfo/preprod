from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    """Migration manquante reconstruite : crée Classroom/Subject/Resource,
    absents de l'historique git alors qu'ils existent déjà dans models.py
    et étaient déjà en place sur l'ancienne base (créés hors migrations).
    Insérée avant 0022_classroom_semester_refactor, qui suppose leur
    existence (Subject.classroom, Resource sans "category")."""

    dependencies = [
        ('api', '0021_leader_image_to_filefield'),
    ]

    operations = [
        migrations.CreateModel(
            name='Classroom',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, verbose_name='Nom de la classe')),
                ('code', models.CharField(blank=True, max_length=50, verbose_name='Code (optionnel)')),
                ('description', models.TextField(blank=True, verbose_name='Description')),
                ('is_active', models.BooleanField(default=True, verbose_name='Actif')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Créé le')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Mis à jour le')),
            ],
            options={
                'verbose_name': 'Classe',
                'verbose_name_plural': 'Classes',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Subject',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200, verbose_name='Intitulé de la matière')),
                ('code', models.CharField(blank=True, max_length=50, verbose_name='Code (optionnel)')),
                ('description', models.TextField(blank=True, verbose_name='Description')),
                ('display_order', models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Créé le')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Mis à jour le')),
                ('classroom', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='subjects',
                    to='api.classroom',
                )),
            ],
            options={
                'verbose_name': 'Matière',
                'verbose_name_plural': 'Matieres',
                'ordering': ['display_order', 'title'],
            },
        ),
        migrations.CreateModel(
            name='Resource',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=300, verbose_name='Titre')),
                ('resource_type', models.CharField(
                    choices=[('link', 'Lien'), ('drive_folder', 'Drive (dossier)'), ('document', 'Document')],
                    default='link',
                    max_length=30,
                )),
                ('url', models.CharField(max_length=1000, verbose_name='URL / lien')),
                ('description', models.TextField(blank=True, verbose_name='Description')),
                ('allow_preview', models.BooleanField(default=True, verbose_name="Autoriser l'aperçu")),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Créé le')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Mis à jour le')),
                ('subject', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='resources',
                    to='api.subject',
                )),
            ],
            options={
                'verbose_name': 'Ressource',
                'verbose_name_plural': 'Ressources',
                'ordering': ['-created_at'],
            },
        ),
    ]
