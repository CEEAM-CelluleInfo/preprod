"""
Script d'initialisation des données de développement - CEEAM Platform
Usage: python manage.py shell < init_dev_data.py ou Get-Content init_dev_data.py | python manage.py shell
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import *
from django.utils import timezone
from datetime import timedelta

print("🚀 Initialisation des données de développement...")

# ===== PAYS MEMBRES =====
pays_data = [
    ("Maroc", "MAR", "🇲🇦", "Afrique"),
    ("Sénégal", "SEN", "🇸🇳", "Afrique"),
    ("Côte d'Ivoire", "CIV", "🇨🇮", "Afrique"),
    ("Cameroun", "CMR", "🇨🇲", "Afrique"),
    ("Gabon", "GAB", "🇬🇦", "Afrique"),
    ("Mali", "MLI", "🇲🇱", "Afrique"),
    ("Guinée", "GIN", "🇬🇳", "Afrique"),
    ("Bénin", "BEN", "🇧🇯", "Afrique"),
    ("Togo", "TGO", "🇹🇬", "Afrique"),
    ("Burkina Faso", "BFA", "🇧🇫", "Afrique"),
    ("Niger", "NER", "🇳🇪", "Afrique"),
    ("RD Congo", "COD", "🇨🇩", "Afrique"),
    ("Congo", "COG", "🇨🇬", "Afrique"),
    ("Mauritanie", "MRT", "🇲🇷", "Afrique"),
    ("Tchad", "TCD", "🇹🇩", "Afrique"),
]
for name, code, emoji, continent in pays_data:
    Country.objects.get_or_create(
        name=name, 
        defaults={"code_iso": code, "flag_emoji": emoji, "continent": continent}
    )
print(f"✅ {Country.objects.count()} pays créés")

# ===== SECTIONS DE CONTENU =====
ContentSection.objects.update_or_create(
    id="mission",
    defaults={
        "title": "Notre Mission",
        "content": "La CEEAM a pour mission d'accompagner et de soutenir les étudiants étrangers de l'ENSAM dans leur parcours académique et leur intégration au Maroc. Nous offrons un cadre d'entraide, d'échange culturel et de développement personnel.",
        "language": "fr"
    }
)
ContentSection.objects.update_or_create(
    id="vision",
    defaults={
        "title": "Notre Vision",
        "content": "Notre vision est de devenir la référence incontournable en matière d'accompagnement des étudiants internationaux au Maroc, en créant un réseau solide de solidarité et d'excellence.",
        "language": "fr"
    }
)
ContentSection.objects.update_or_create(
    id="valeurs",
    defaults={
        "title": "Nos Valeurs",
        "content": "Solidarité : Nous croyons en l'entraide et le soutien mutuel.\nDiversité : Nous célébrons nos différences culturelles.\nExcellence : Nous visons l'excellence académique et personnelle.\nIntégrité : Nous agissons avec honnêteté et transparence.",
        "language": "fr"
    }
)
print(f"✅ {ContentSection.objects.count()} sections de contenu créées")

# ===== DATES ACADÉMIQUES 2025-2026 =====
dates_data = [
    ("a1", "Début des cours :", "15 Septembre 2025", "A"),
    ("a2", "Début des contrôles :", "15 Novembre 2025", "A"),
    ("a3", "Fin des contrôles :", "30 Novembre 2025", "A"),
    ("a4", "Vacances d'hiver :", "20 Déc - 5 Jan", "A"),
    ("a5", "Examens finaux :", "10 - 25 Janvier 2026", "A"),
    ("b1", "Début semestre B :", "1 Février 2026", "B"),
    ("b2", "Début des contrôles :", "1 Avril 2026", "B"),
    ("b3", "Vacances de printemps :", "15 - 25 Avril", "B"),
    ("b4", "Examens finaux :", "1 - 15 Juin 2026", "B"),
    ("b5", "Fin d'année :", "30 Juin 2026", "B"),
]
for date_id, label, value, semester in dates_data:
    AcademicDate.objects.update_or_create(
        date_id=date_id, 
        academic_year="2025-2026",
        defaults={"label": label, "value": value, "semester": semester}
    )
print(f"✅ {AcademicDate.objects.count()} dates académiques créées")

# ===== CLUBS =====
clubs_data = [
    ("Club Robotique", "Robotique & Innovation", "Conception et programmation de robots autonomes"),
    ("Club Culturel", "Arts & Culture", "Organisation d'événements culturels et artistiques"),
    ("Club Sportif", "Sports & Bien-être", "Activités sportives, tournois et compétitions"),
    ("Club Entrepreneuriat", "Business & Startups", "Accompagnement de projets entrepreneuriaux"),
    ("Club Musique", "Musique & Expression", "Pratique musicale, concerts et événements"),
]
for name, interest, desc in clubs_data:
    Club.objects.get_or_create(
        name=name, 
        defaults={"interest": interest, "description": desc}
    )
print(f"✅ {Club.objects.count()} clubs créés")

# ===== ACTIVITÉS =====
activities_data = [
    ("Journée d'intégration 2025", "Accueil chaleureux des nouveaux étudiants étrangers", "Bienvenue aux nouveaux étudiants ! Venez découvrir le campus, rencontrer vos camarades et profiter d'une journée festive.", "integration", False, 200),
    ("Soirée culturelle africaine", "Célébration de la diversité culturelle avec musique et danse", "Une soirée haute en couleurs pour découvrir les cultures africaines à travers la musique, la danse et la gastronomie.", "culture", False, 150),
    ("Formation Excel avancé", "Maîtrisez les tableaux croisés dynamiques et macros", "Formation pratique pour devenir un expert d'Excel. Au programme : TCD, formules avancées, macros VBA.", "formation", True, 30),
    ("Tournoi de football inter-promos", "Compétition amicale entre les promotions", "Rejoignez votre équipe de promo et participez au tournoi annuel de football !", "sport", True, 80),
    ("Networking avec les lauréats", "Rencontrez nos anciens et développez votre réseau", "Une occasion unique de rencontrer des lauréats travaillant dans différents secteurs.", "networking", True, 50),
    ("Atelier CV et entretien", "Préparez votre insertion professionnelle", "Conseils pratiques pour rédiger un CV impactant et réussir vos entretiens d'embauche.", "formation", True, 40),
    ("Iftar CEEAM 2026", "Rupture du jeûne collective pendant le Ramadan", "Partageons ensemble ce moment de convivialité et de partage.", "culture", True, 120),
]

for title, desc, long_desc, cat, upcoming, max_p in activities_data:
    Activity.objects.get_or_create(
        title=title,
        defaults={
            "description": desc,
            "long_description": long_desc,
            "category": cat,
            "is_upcoming": upcoming,
            "is_published": True,
            "event_date": timezone.now() + timedelta(days=30) if upcoming else timezone.now() - timedelta(days=60),
            "location": "Campus ENSAM Meknès",
            "max_participants": max_p
        }
    )
print(f"✅ {Activity.objects.count()} activités créées")

# ===== FAQ =====
faqs_data = [
    ("Comment s'inscrire à la CEEAM ?", "L'inscription se fait en ligne via notre plateforme. Créez un compte et complétez votre profil.", "association"),
    ("Quels sont les frais d'adhésion ?", "L'adhésion à la CEEAM est gratuite pour tous les étudiants étrangers de l'ENSAM.", "association"),
    ("Comment obtenir un logement ?", "Contactez le bureau de la CEEAM qui vous accompagnera dans vos démarches de recherche de logement.", "vie_campus"),
    ("Comment renouveler ma carte de séjour ?", "Rendez-vous à la préfecture avec les documents requis. La CEEAM peut vous accompagner dans cette démarche.", "inscription"),
    ("Où trouver les emplois du temps ?", "Les emplois du temps sont disponibles sur le portail étudiant de l'ENSAM.", "vie_campus"),
]
for q, a, cat in faqs_data:
    FAQ.objects.get_or_create(
        question=q, 
        defaults={"answer": a, "category": cat}
    )
print(f"✅ {FAQ.objects.count()} FAQs créées")

print("\n🎉 Données de développement initialisées avec succès !")
print(f"""
📊 Résumé:
   - {Country.objects.count()} pays
   - {ContentSection.objects.count()} sections de contenu
   - {AcademicDate.objects.count()} dates académiques
   - {Club.objects.count()} clubs
   - {Activity.objects.count()} activités
   - {FAQ.objects.count()} FAQs
   - {User.objects.count()} utilisateur(s)
""")
