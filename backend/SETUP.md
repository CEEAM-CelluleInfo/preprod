# 🚀 Setup Backend - CEEAM Platform

## Résumé des changements (v2.0)

### ✅ Améliorations
1. **ModelViewSets + Routers DRF** 
2. **Modèle User personnalisé** (AbstractUser avec email comme identifiant)
3. **25+ modèles Django** organisés par domaine
4. **Interface admin Django enrichie** pour chaque modèle
5. **Système de likes normalisé** (table ActivityLike)
6. **Gestion des pays membres** (Country)
7. **Profils lauréats étendus** (LaureatProfile)
8. **Système de vote complet** (VoteSession, Position, Candidate, Vote)
9. **Notifications et messages** intégrés
10. **Compatibilité totale avec le frontend existant**

---

## Installation & Configuration

### 1. Installer les dépendances
```bash
cd backend
pip install -r requirements.txt
```

### 2. Créer les migrations
```bash
cd backend
python manage.py makemigrations api
python manage.py migrate
```

### 3. Créer un super-utilisateur (admin)
```bash
python manage.py createsuperuser
```

**Identifiants par défaut (dev) :**
| Champ | Valeur |
|-------|--------|
| Username | `ceeam-admin` |
| Email | `admin@ceeam.ac.ma` |
| Password | `ceeam` |

### 4. Initialiser les données de développement
```bash
python manage.py shell
```

```python
from api.models import *
from django.utils import timezone
from datetime import timedelta

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
    Country.objects.get_or_create(name=name, defaults={"code_iso": code, "flag_emoji": emoji, "continent": continent})

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
        date_id=date_id, academic_year="2025-2026",
        defaults={"label": label, "value": value, "semester": semester}
    )
print(f"✅ {AcademicDate.objects.count()} dates académiques créées")

# ===== CLUBS =====
clubs_data = [
    ("Club Robotique", "Robotique & Innovation", "Conception et programmation de robots"),
    ("Club Culturel", "Arts & Culture", "Organisation d'événements culturels"),
    ("Club Sportif", "Sports & Bien-être", "Activités sportives et tournois"),
    ("Club Entrepreneuriat", "Business & Startups", "Accompagnement de projets entrepreneuriaux"),
    ("Club Musique", "Musique & Expression", "Pratique musicale et concerts"),
]
for name, interest, desc in clubs_data:
    Club.objects.get_or_create(name=name, defaults={"interest": interest, "description": desc})
print(f"✅ {Club.objects.count()} clubs créés")

# ===== ACTIVITÉS =====
activities_data = [
    ("Journée d'intégration 2025", "Accueil chaleureux des nouveaux étudiants étrangers", "integration", False),
    ("Soirée culturelle africaine", "Célébration de la diversité culturelle avec musique et danse", "culture", False),
    ("Formation Excel avancé", "Maîtrisez les tableaux croisés dynamiques et macros", "formation", True),
    ("Tournoi de football inter-promos", "Compétition amicale entre les promotions", "sport", True),
    ("Networking avec les lauréats", "Rencontrez nos anciens et développez votre réseau", "networking", True),
    ("Atelier CV et entretien", "Préparez votre insertion professionnelle", "formation", True),
    ("Iftar CEEAM 2026", "Rupture du jeûne collective pendant le Ramadan", "culture", True),
]
for title, desc, cat, upcoming in activities_data:
    Activity.objects.get_or_create(
        title=title,
        defaults={
            "description": desc,
            "category": cat,
            "is_upcoming": upcoming,
            "is_published": True,
            "event_date": timezone.now() + timedelta(days=30) if upcoming else timezone.now() - timedelta(days=60),
            "location": "Campus ENSAM Meknès",
            "max_participants": 100
        }
    )
print(f"✅ {Activity.objects.count()} activités créées")

# ===== FAQ =====
faqs_data = [
    ("Comment s'inscrire à la CEEAM ?", "L'inscription se fait en ligne via notre plateforme. Créez un compte et complétez votre profil.", "association"),
    ("Quels sont les frais d'adhésion ?", "L'adhésion à la CEEAM est gratuite pour tous les étudiants étrangers de l'ENSAM.", "association"),
    ("Comment obtenir un logement ?", "Contactez le bureau de la CEEAM qui vous accompagnera dans vos démarches.", "vie_campus"),
    ("Comment renouveler ma carte de séjour ?", "Rendez-vous à la préfecture avec les documents requis. La CEEAM peut vous accompagner.", "inscription"),
]
for q, a, cat in faqs_data:
    FAQ.objects.get_or_create(question=q, defaults={"answer": a, "category": cat})
print(f"✅ {FAQ.objects.count()} FAQs créées")

print("\n🎉 Données de développement initialisées avec succès !")
exit()
```

### 5. Lancer le serveur
```bash
python manage.py runserver
```

Accédez à :
-  API: http://localhost:8000/api/
-  Admin: http://localhost:8000/admin/

---

## 📊 Structure des modèles (v2.0)

### Utilisateurs & Authentification
| Modèle | Description |
|--------|-------------|
| `Country` | Pays membres (nom, code ISO, emoji, continent) |
| `User` | Utilisateur personnalisé (AbstractUser + profil CEEAM) |
| `LaureatProfile` | Extension pour les lauréats (poste, entreprise, pays de travail) |

### Activités & Interactions
| Modèle | Description |
|--------|-------------|
| `Activity` | Événements et activités |
| `ActivityLike` | Likes (normalisé, 1 user = 1 like/activité) |
| `ActivityRegistration` | Inscriptions aux activités |
| `Media` | Fichiers médias des activités |
| `ActivityProposal` | Propositions d'activités par les membres |
| `Comment` | Commentaires sur les activités |

### Bureau & Leadership
| Modèle | Description |
|--------|-------------|
| `BureauMember` | Membres du bureau exécutif (lié à User) |

### Contenu & Ressources
| Modèle | Description |
|--------|-------------|
| `ContentSection` | Sections de contenu (mission, vision, valeurs) |
| `AcademicDate` | Dates du calendrier académique |
| `Club` | Clubs de l'école |

### Système de Vote
| Modèle | Description |
|--------|-------------|
| `VoteSession` | Sessions d'élection |
| `Position` | Postes à pourvoir |
| `Candidate` | Candidatures |
| `Vote` | Votes (avec hash unique) |

### Communication
| Modèle | Description |
|--------|-------------|
| `Announcement` | Annonces et actualités |
| `ContactMessage` | Messages entre membres |
| `Notification` | Notifications utilisateur |

### Documentation
| Modèle | Description |
|--------|-------------|
| `SchoolGuide` | Guides pratiques |
| `Document` | Documents téléchargeables |
| `FAQ` | Questions fréquentes |

### Audit
| Modèle | Description |
|--------|-------------|
| `AuditLog` | Journal d'audit |

---

## 🔗 Endpoints principaux

### Test de l'API

**1. Connexion (login)**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ceeam.ac.ma", "password": "ceeam"}'
```

**2. Lister les pays**
```bash
curl http://localhost:8000/api/countries/
```

**3. Lister le contenu**
```bash
curl http://localhost:8000/api/content/
```

**4. Lister les dates académiques**
```bash
curl http://localhost:8000/api/dates/
curl http://localhost:8000/api/dates/?academicYear=2025-2026
```

**5. Lister les activités**
```bash
curl http://localhost:8000/api/activities/
curl http://localhost:8000/api/activities/?category=formation
curl http://localhost:8000/api/activities/?is_upcoming=true
```

**6. Aimer une activité (authentifié)**
```bash
curl -X POST http://localhost:8000/api/activities/1/like/ \
  -H "Authorization: Bearer {token}"
```

**7. S'inscrire à une activité (authentifié)**
```bash
curl -X POST http://localhost:8000/api/activities/1/register/ \
  -H "Authorization: Bearer {token}"
```

**8. Lister les membres du bureau (Leaders)**
```bash
curl http://localhost:8000/api/leaders/
```

**9. Lister les clubs**
```bash
curl http://localhost:8000/api/clubs/
```

**10. Soumettre une proposition d'activité**
```bash
curl -X POST http://localhost:8000/api/proposals/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"title": "Ma proposition", "description": "...", "category": "culture", "contact_email": "user@example.com"}'
```

---

## 📁 Structure des fichiers

```
backend/
├── api/
│   ├── models.py              ← 25+ modèles Django (User, Activity, Vote, etc.)
│   ├── views.py               ← ViewSets & vues API
│   ├── serializers.py         ← Sérializers DRF avec alias frontend
│   ├── urls.py                ← Routers et URLs API
│   ├── admin.py               ← Interface d'administration enrichie
│   └── migrations/            ← Migrations de base de données
├── backend/
│   ├── settings.py            ← Configuration (AUTH_USER_MODEL, CORS, etc.)
│   ├── urls.py                ← URL racine incluant /api/ et /admin/
│   └── ...
├── requirements.txt           ← Dépendances Python
├── db.sqlite3                 ← Base de données SQLite (dev)
└── manage.py
```

---

##  Authentification

Le système utilise des **tokens signés** (Django signing.dumps) :

```
Authorization: Bearer {token_signe}
```

- **TTL:** 24 heures (configurable)
- **Rôles:** admin, membre
- **Vérification:** GET /api/admin/verify/

---

##  Commandes utiles

```bash
# Créer les migrations
python manage.py makemigrations api

# Appliquer les migrations
python manage.py migrate

# Vider la BD et tout réinitialiser
python manage.py flush

# Créer un super-utilisateur
python manage.py createsuperuser

# Entrer dans le shell Django
python manage.py shell

# Lancer le serveur
python manage.py runserver

# Exécuter les tests
python manage.py test
```

---

##  Configuration importante

### CORS (déjà configuré)
```python
CORS_ALLOW_ALL_ORIGINS = True
```

### Clé secrète (à changer en production)
```python
SECRET_KEY = 'django-insecure-...'  #  À remplacer en prod
```

### Base de données (SQLite en dev)
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

---

## 🚀 Déploiement en production

Avant le déploiement :

1. ✅ Changer `DEBUG = False`
2. ✅ Générer une clé secrète forte
3. ✅ Ajouter les domaines à `ALLOWED_HOSTS`
4. ✅ Configurer une vraie base de données (PostgreSQL)
5. ✅ Utiliser Gunicorn + Nginx
6. ✅ Activer HTTPS

---

##  Dashboard d'administration

Accédez à http://localhost:8000/admin/ pour :
-  Créer/éditer les sections de contenu
-  Gérer les dates académiques
-  Créer/modifier les activités
-  Gérer les utilisateurs

---

##  Troubleshooting

**Erreur : No module named 'corsheaders'**
```bash
pip install django-cors-headers
```

**Erreur : No module named 'rest_framework'**
```bash
pip install djangorestframework
```

**Les migrations ne s'appliquent pas**
```bash
python manage.py migrate --run-syncdb
```

**Réinitialiser la BD complètement**
```bash
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

---

##  Documentation complète

Voir : [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)

---

##  Notes

- L'interface est supposée être en **français** d'où les modèles francisés
- Le frontend continue à fonctionner sans modification grâce aux serializers
- Tous les endpoints sont compatibles CORS
- Les tokens n'ont pas besoin d'être souvent rafraîchis
