from django.db import migrations, models
import django.db.models.deletion


def create_semesters_and_migrate_subjects(apps, schema_editor):
    Classroom = apps.get_model('api', 'Classroom')
    Semester = apps.get_model('api', 'Semester')
    Subject = apps.get_model('api', 'Subject')

    for classroom in Classroom.objects.all():
        s1, _ = Semester.objects.get_or_create(classroom=classroom, number=1)
        Semester.objects.get_or_create(classroom=classroom, number=2)
        Subject.objects.filter(classroom=classroom).update(semester=s1)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0021_leader_image_to_filefield'),
    ]

    operations = [
        # 1. Create Semester model
        migrations.CreateModel(
            name='Semester',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('number', models.PositiveSmallIntegerField(verbose_name='Numéro du semestre')),
                ('classroom', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='semesters',
                    to='api.classroom',
                )),
            ],
            options={
                'verbose_name': 'Semestre',
                'verbose_name_plural': 'Semestres',
                'ordering': ['number'],
                'unique_together': {('classroom', 'number')},
            },
        ),

        # 2. Add semester FK to Subject as nullable
        migrations.AddField(
            model_name='subject',
            name='semester',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='subjects',
                to='api.semester',
            ),
        ),

        # 3. Populate semesters and assign existing subjects to S1
        migrations.RunPython(create_semesters_and_migrate_subjects, migrations.RunPython.noop),

        # 4. Make semester non-nullable
        migrations.AlterField(
            model_name='subject',
            name='semester',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='subjects',
                to='api.semester',
            ),
        ),

        # 5. Remove old classroom FK from Subject
        migrations.RemoveField(
            model_name='subject',
            name='classroom',
        ),

        # 6. Add category to Resource
        migrations.AddField(
            model_name='resource',
            name='category',
            field=models.CharField(
                choices=[('cours', 'Cours'), ('td', 'TD'), ('tp', 'TP'), ('examen', 'Examen')],
                default='cours',
                max_length=20,
                verbose_name='Catégorie',
            ),
        ),
    ]
