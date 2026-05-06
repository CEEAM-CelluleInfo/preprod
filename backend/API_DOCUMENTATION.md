# Documentation API - CEEAM Platform (v2.0)

##  Architecture 

Le backend utilise **Django REST Framework** avec un modèle User personnalisé et 25+ modèles organisés par domaine.

### Caractéristiques principales :
- ✅ **User personnalisé** (AbstractUser) avec email comme identifiant
- ✅ **25+ modèles Django** organisés par section
- ✅ **Système de likes normalisé** (table ActivityLike)
- ✅ **Gestion des pays membres** avec statistiques
- ✅ **Système de vote complet** pour les élections
- ✅ **Notifications et messages** intégrés
- ✅ **Compatibilité frontend** via alias dans les serializers

---

##  Modèles Django

### 1. **Country** (Pays membres)
| Champ | Type | Description |
|-------|------|-------------|
| `name` | CharField | Nom du pays (unique) |
| `code_iso` | CharField | Code ISO 3 lettres (unique) |
| `flag_emoji` | CharField | Emoji du drapeau |
| `continent` | CharField | Continent |
| `is_active` | Boolean | Actif |

### 2. **User** (Utilisateur - AbstractUser)
| Champ | Type | Description |
|-------|------|-------------|
| `email` | EmailField | Email (unique, identifiant de connexion) |
| `phone` | CharField | Téléphone |
| `whatsapp` | CharField | WhatsApp |
| `country` | FK → Country | Pays d'origine |
| `promotion` | CharField | Promotion (ex: "2024") |
| `specialite` | CharField | Spécialité |
| `role` | Choice | student, bureau, admin, laureat |
| `avatar_url` | URLField | URL de l'avatar |
| `biographie` | TextField | Biographie |
| `preferred_language` | Choice | fr, en |

### 3. **LaureatProfile** (Extension lauréat)
| Champ | Type | Description |
|-------|------|-------------|
| `user` | OneToOne → User | Utilisateur |
| `current_position` | CharField | Poste actuel |
| `company` | CharField | Entreprise |
| `work_country` | FK → Country | Pays de travail |
| `work_city` | CharField | Ville |
| `linkedin_url` | URLField | LinkedIn |
| `available_for_mentoring` | Boolean | Disponible pour mentorat |

### 4. **Activity** (Activités)
| Champ | Type | Description |
|-------|------|-------------|
| `title` | CharField | Titre |
| `description` | CharField | Description courte |
| `long_description` | TextField | Description longue |
| `category` | Choice | integration, formation, culture, networking, sport |
| `image_url` | URLField | Image |
| `event_date` | DateTimeField | Date de l'événement |
| `location` | CharField | Lieu |
| `max_participants` | Integer | Nombre max de participants |
| `is_upcoming` | Boolean | À venir |
| `is_published` | Boolean | Publié |
| `likes_count` | Property | Nombre de likes (calculé) |

### 5. **ActivityLike** (Likes normalisés)
| Champ | Type | Description |
|-------|------|-------------|
| `activity` | FK → Activity | Activité |
| `user` | FK → User | Utilisateur |
| **Contrainte** | unique_together | (activity, user) |

### 6. **ActivityRegistration** (Inscriptions)
| Champ | Type | Description |
|-------|------|-------------|
| `activity` | FK → Activity | Activité |
| `user` | FK → User | Utilisateur |
| `status` | Choice | pending, confirmed, cancelled, attended |

### 7. **BureauMember** (Membres du bureau)
| Champ | Type | Description |
|-------|------|-------------|
| `user` | FK → User | Utilisateur |
| `position` | Choice | SG, SGA, tresorier, com, event, sport, culture, integration |
| `mandate_year` | CharField | Année de mandat |
| `is_current` | Boolean | Mandat actuel |

### 8. **ContentSection** (Contenu statique)
| Champ | Type | Description |
|-------|------|-------------|
| `id` | CharField | Clé primaire (mission, vision, valeurs) |
| `title` | CharField | Titre |
| `content` | TextField | Contenu |
| `language` | Choice | fr, en |

### 9. **AcademicDate** (Calendrier)
| Champ | Type | Description |
|-------|------|-------------|
| `date_id` | CharField | ID de la date |
| `label` | CharField | Libellé |
| `value` | CharField | Valeur |
| `semester` | Choice | A, B |
| `academic_year` | CharField | Année académique |

### 10. **VoteSession, Position, Candidate, Vote** (Système de vote)
Système complet pour les élections avec sessions, postes, candidats et votes hashés.

---

## 🔗 Endpoints API

### Authentification
```
POST /api/auth/login/          # Connexion
POST /api/auth/register/       # Inscription
GET  /api/admin/verify/        # Vérifier si admin
```

**POST /api/auth/login/**
```json
// Request
{"email": "admin@ceeam.ac.ma", "password": "ceeam"}

// Response
{
  "user": {
    "id": 1,
    "email": "admin@ceeam.ac.ma",
    "firstName": "Admin",
    "lastName": "CEEAM",
    "role": "admin",
    "avatarUrl": "",
    "joinedAt": "2026-02-11T00:00:00Z"
  },
  "token": "signed_token",
  "refreshToken": "signed_token",
  "expiresIn": 86400
}
```

**POST /api/auth/register/**
```json
// Request
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+212612345678",
  "country": 1,
  "promotion": "2024",
  "specialite": "Génie Industriel"
}
```

---

### Pays
```
GET /api/countries/            # Liste des pays actifs
GET /api/countries/{id}/       # Détail d'un pays
```

---

### Sections de Contenu
```
GET /api/content/              # Liste tout le contenu
GET /api/content/{id}/         # Détail (mission, vision, valeurs)
```

---

### Dates Académiques
```
GET /api/dates/                          # Liste les dates
GET /api/dates/?academicYear=2025-2026   # Filtrer par année
GET /api/dates/{pk}/                     # Détail
```

---

### Activités
```
GET  /api/activities/                    # Liste (publiées)
GET  /api/activities/?category=formation # Filtrer par catégorie
GET  /api/activities/?is_upcoming=true   # Activités à venir
GET  /api/activities/{id}/               # Détail
POST /api/activities/{id}/like/          # Aimer (auth required)
POST /api/activities/{id}/unlike/        # Retirer like (auth required)
POST /api/activities/{id}/register/      # S'inscrire (auth required)
```

---

### Membres du Bureau (Leaders)
```
GET /api/leaders/                        # Liste paginée
GET /api/leaders/?page=0&limit=10        # Pagination
GET /api/leaders/{id}/                   # Détail
```

**Response format:**
```json
{
  "leaders": [...],
  "total": 8,
  "page": 0,
  "totalPages": 1
}
```

---

### Propositions d'activités
```
GET  /api/proposals/                     # Liste (auth required)
POST /api/proposals/                     # Soumettre (auth required)
GET  /api/proposals/{id}/                # Détail
```

---

### Clubs
```
GET /api/clubs/                          # Liste des clubs actifs
GET /api/clubs/{id}/                     # Détail
```

---

## 🔐 Authentification

- **Type:** Token signé (Django signing.dumps)
- **TTL:** 24h (configurable via `AUTH_TOKEN_TTL_SECONDS`)
- **Header:**
  ```
  Authorization: Bearer {token}
  ```

---

## 🎯 Compatibilité Frontend

Les serializers gèrent la conversion des noms pour le frontend JavaScript :

| Backend (Django) | Frontend (JSON) |
|------------------|-----------------|
| `image_url` | `imageUrl` |
| `is_upcoming` | `upcoming` |
| `likes_count` | `likesCount` |
| `event_date` | `date` |
| `long_description` | `longDescription` |

---

## 🛡️ Notes de sécurité

1. **AUTH_USER_MODEL** configuré sur `api.User`
2. **Likes normalisés** (impossible de liker 2 fois)
3. **Votes hashés** pour l'intégrité des élections
4. **CORS** configuré via `django-cors-headers`

---

## 📞 Support

- **Admin Django:** http://localhost:8000/admin/
- **Identifiants dev:** `ceeam-admin` / `ceeam`