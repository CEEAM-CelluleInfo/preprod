# Déploiement — API Django/DRF sur DigitalOcean (Docker)

> Fichier de contexte pour **Claude Code**. Objectif : conteneuriser ce projet Django/DRF
> et le déployer sur un Droplet DigitalOcean déjà provisionné et sécurisé.
> Lis tout ce fichier avant d'agir. Ne fais rien de destructif sur le serveur sans confirmation.

---

## 1. Contexte serveur (déjà en place)

Le serveur est **déjà créé, sécurisé et prêt**. NE PAS recréer le serveur ni réinstaller Docker.

| Élément | Valeur |
|---|---|
| Fournisseur | DigitalOcean (Droplet Basic, coût fixe ~$6/mois) |
| OS | Ubuntu 24.04 LTS x64 |
| Région / VPC | FRA1 (Francfort) / `default-fra1` |
| IPv4 publique | `134.122.68.237` |
| IP privée (VPC) | `10.114.0.2` |
| Utilisateur de déploiement | `deploy` (sudo, connexion par clé SSH Ed25519) |
| Connexion SSH | `ssh deploy@134.122.68.237` |
| Login root SSH | encore actif (à désactiver en fin de déploiement — voir §9) |

**Déjà installé et configuré :**
- Mises à jour système appliquées, serveur redémarré.
- Utilisateur `deploy` non-root avec droits `sudo`, clé SSH copiée.
- Pare-feu **UFW actif** : ports autorisés = `OpenSSH (22)`, `80/tcp`, `443/tcp`. Rien d'autre n'est ouvert.
- **Docker 29.7.2** et **Docker Compose v5.5.0** installés. `deploy` est dans le groupe `docker`.

**Contraintes à respecter :**
- N'ouvre aucun port supplémentaire dans UFW sans raison. Postgres/Redis NE doivent PAS être exposés publiquement — ils restent sur le réseau Docker interne.
- RAM limitée (**1 GiB**). Garde les conteneurs légers. Si Postgres + Redis + Celery + Django + Nginx saturent la RAM, propose soit un `Resize` du Droplet, soit une **base PostgreSQL managée** DigitalOcean.
- Prix fixe : ne provisionne aucune ressource payante supplémentaire sans me le dire d'abord.

---

## 2. Ce que je veux (objectif)

Déployer cette API Django/DRF en production avec cette architecture (cible du guide) :

```
Internet → Nginx (HTTPS) → Gunicorn → Django/DRF
                                        ├── PostgreSQL
                                        ├── Redis
                                        └── Celery (si le projet en a besoin)
```

Tout doit tourner via **Docker Compose**. Services Compose visés :
`nginx`, `web` (Django+Gunicorn), `db` (postgres), `redis`, et `celery` (worker) si applicable.

---

## 3. À REMPLIR par moi / à demander avant de coder

Ne devine pas ces valeurs — demande-moi ou lis la config du projet :

- **Nom de domaine** : `<À_REMPLIR — ex: api.mondomaine.com, ou "aucun, déployer en HTTP sur l'IP pour l'instant">`
- **Base de données** : PostgreSQL en conteneur (par défaut) **ou** DigitalOcean Managed Postgres ? → `<À_REMPLIR>`
- **Celery/Redis nécessaires ?** → `<À_REMPLIR — regarde s'il y a des tâches async / un celery.py dans le projet>`
- **Version de Python** utilisée par le projet → détecte via `pyproject.toml` / `runtime.txt` / `.python-version`, sinon 3.12.
- **Gestionnaire de dépendances** : `requirements.txt`, `poetry`, ou `pipenv` ? → détecte.
- **Module de settings de prod** : `<À_REMPLIR — ex: config.settings.production>`

---

## 4. Analyse préalable du projet (fais-la en premier)

1. Inspecte l'arborescence du repo. Identifie : le package projet Django (`manage.py`, `wsgi.py`, `asgi.py`, dossier settings), le fichier de dépendances, la présence de `celery.py`.
2. Vérifie s'il existe déjà : `Dockerfile`, `docker-compose.yml`, `.dockerignore`, un fichier `.env.example`, une config Nginx. **Réutilise et améliore l'existant plutôt que d'écraser.**
3. Repère la config `settings` : `ALLOWED_HOSTS`, `DEBUG`, `DATABASES`, `STATIC_ROOT`, `SECRET_KEY`, gestion CORS/CSRF.
4. Résume-moi ce que tu as trouvé AVANT d'écrire du code.

---

## 5. Livrables à créer (adapte au projet)

### `Dockerfile` (image de l'app)
- Base légère (`python:3.x-slim`).
- Installe les deps système minimales (ex: `libpq-dev`, `build-essential` en build stage) ; multi-stage pour garder l'image petite.
- Installe les deps Python selon le gestionnaire détecté.
- Copie le code, crée un user non-root dans l'image, expose le port Gunicorn (8000, interne).
- `CMD` lance Gunicorn (ex: `gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3`). Ajuste `workers` à la RAM (≈ 2×vCPU+1, mais reste prudent avec 1 GiB).

### `docker-compose.yml`
Services :
- **web** : build depuis le Dockerfile, charge `.env`, dépend de `db` et `redis`, ne publie PAS de port vers l'extérieur (Nginx s'en charge).
- **db** : `postgres:16`, volume nommé pour la persistance, variables depuis `.env`, **aucun port publié**.
- **redis** : `redis:7-alpine`, **aucun port publié**.
- **celery** (si nécessaire) : même image que `web`, commande `celery -A <projet> worker -l info`.
- **nginx** : `nginx:alpine`, publie `80:80` (et `443:443` si domaine+HTTPS), monte la config + les volumes `static` et `media`, reverse-proxy vers `web:8000`.

Volumes nommés : `postgres_data`, `static_volume`, `media_volume`.
Réseau Docker interne pour que les services se parlent par leur nom.

### `.env.example` (+ `.env` réel sur le serveur, jamais commité)
Variables minimales : `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=0`, `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL` (ou `POSTGRES_*`), `REDIS_URL`, `CSRF_TRUSTED_ORIGINS`.
Ajoute `.env` au `.gitignore`.

### Config Nginx (`nginx/default.conf`)
- Reverse proxy vers `web:8000` (headers `X-Forwarded-For`, `X-Forwarded-Proto`, `Host`).
- Sert `/static/` et `/media/` depuis les volumes.
- Taille max de body raisonnable pour une API.
- Si domaine : bloc HTTPS + redirection 80→443 (voir §7).

### Ajustements Django `settings` (prod)
- `DEBUG=False`, `ALLOWED_HOSTS` et `CSRF_TRUSTED_ORIGINS` depuis l'environnement.
- `SECRET_KEY` depuis l'environnement.
- `DATABASES` pointant vers le service `db` (ou l'URL managée).
- `STATIC_ROOT` défini (ex: `/app/staticfiles`) pour `collectstatic`.
- `SECURE_PROXY_SSL_HEADER` = `("HTTP_X_FORWARDED_PROTO", "https")` si HTTPS via Nginx.
- Vérifie CORS (`django-cors-headers`) si l'API est appelée par un front séparé.

---

## 6. Procédure de déploiement sur le serveur

1. **Récupérer le code sur le serveur** : la méthode dépend de ma réponse (§3). Options :
   - Git : `git clone` dans `/home/deploy/app` (si repo accessible ; pour un repo privé, on configure une deploy key SSH).
   - Sinon `rsync`/`scp` depuis mon PC.
2. Créer le `.env` réel à partir de `.env.example` (générer un `SECRET_KEY` fort).
3. `docker compose build`
4. `docker compose up -d`
5. Migrations : `docker compose exec web python manage.py migrate`
6. Static : `docker compose exec web python manage.py collectstatic --noinput`
7. Créer un superuser : `docker compose exec web python manage.py createsuperuser`
8. Vérifier : `docker compose ps`, logs `docker compose logs -f web nginx`, puis tester l'API via `http://134.122.68.237/` (ou le domaine).

---

## 7. HTTPS (seulement si un domaine est fourni)

- Le DNS du domaine doit d'abord pointer (enregistrement **A**) vers `134.122.68.237`. Vérifie la propagation avant.
- Utilise **Certbot** (image `certbot/certbot`) avec le challenge webroot via Nginx, OU la voie `nginx` classique. Configure le **renouvellement automatique**.
- Après émission : bloc `443 ssl` dans Nginx + redirection permanente `80 → 443`.
- Sans domaine : reste en HTTP sur l'IP pour l'instant, et prévois d'ajouter le HTTPS plus tard.

---

## 8. Sauvegardes & monitoring (après mise en ligne)

- **Backup Postgres** : script `pg_dump` planifié (cron) vers un fichier daté ; idéalement copié hors serveur (DigitalOcean Spaces ou autre). Documente la commande de restauration.
- Activer éventuellement les **DigitalOcean Backups** du Droplet (option payante — me demander avant).
- Logs : garde `docker compose logs` accessibles ; envisage une rotation.
- Healthcheck simple sur un endpoint de l'API.

---

## 9. Durcissement final (à la toute fin, après validation que tout marche)

Uniquement quand la connexion `deploy` par clé est confirmée stable :
- Désactiver l'auth SSH par mot de passe et le login `root` : dans `/etc/ssh/sshd_config` → `PermitRootLogin no`, `PasswordAuthentication no`, puis `sudo systemctl restart ssh`.
- **Garder une session ouverte pendant le test** pour ne pas se verrouiller dehors.

---

## 10. Règles de travail pour Claude Code

- Commence par **§4 (analyse)** et présente un **plan** avant d'écrire/modifier des fichiers.
- Ne commite jamais de secrets (`.env`, clés). Mets-les dans `.gitignore`.
- Explique chaque commande exécutée sur le serveur ; ne lance rien de destructif sans confirmation.
- Préfère des images Docker légères (RAM limitée à 1 GiB).
- Quand une valeur `<À_REMPLIR>` est nécessaire, **demande-moi** au lieu de deviner.
- À la fin, laisse un court `README` de déploiement (comment redéployer, voir les logs, restaurer un backup).