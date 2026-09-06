# CEEAM Backend — Handoff DevOps

Document de passation pour l'équipe qui reprend l'exploitation du backend après la migration AWS → DigitalOcean (septembre 2026). Complète `deploy.md` (cahier des charges initial) et `backend/README-deploy.md` (aide-mémoire opérations courantes) — celui-ci donne la vue d'ensemble, l'état actuel, et les pièges déjà rencontrés.

---

## 1. Architecture actuelle

```
Internet → Cloudflare (proxy, SSL "Full strict") → Nginx (TLS, cert Origin CA) → Gunicorn → Django/DRF
                                                                                      ├── PostgreSQL (conteneur)
                                                                                      ├── Redis (broker Celery + cache Django)
                                                                                      └── Celery worker (scaffold, pas encore de tâche réelle)
```

Tout tourne en **Docker Compose** sur un unique Droplet DigitalOcean.

| Élément | Valeur |
|---|---|
| Provider | DigitalOcean, Droplet Basic (~$6/mois) |
| OS | Ubuntu 24.04 LTS, **1 GiB RAM** (contrainte forte, voir §6) |
| IP publique | `134.122.68.237` |
| Utilisateur SSH | `deploy` (sudo, clé Ed25519) — `ssh deploy@134.122.68.237` |
| Domaine | `api.ceaam.org`, DNS géré sur **Cloudflare**, proxy activé (nuage orange) |
| Repo Git | `https://github.com/CEEAM-CelluleInfo/preprod.git`, branche `main`, **repo public** |
| Code sur le serveur | `/home/deploy/app` (clone git), app Django dans `/home/deploy/app/backend/backend` |
| Firewall | UFW actif — entrant : `22`, `80`, `443` uniquement ; sortant : `allow` (par défaut) |
| Swap | 2 GiB (`/swapfile`), filet de sécurité mémoire |

---

## 2. Services Docker Compose

Fichier : `backend/backend/docker-compose.yml`. Cinq services, réseau interne `backend_net`, seul `nginx` publie des ports (`80`/`443`).

| Service | Image | Limite RAM | Rôle |
|---|---|---|---|
| `nginx` | `nginx:alpine` | 32m | Reverse proxy TLS, cert Cloudflare Origin CA |
| `web` | build local (`Dockerfile`) | 350m | Django + Gunicorn (2 workers, 2 threads, gthread) |
| `db` | `postgres:16-alpine` | 200m | Base de données (volume nommé `postgres_data`) |
| `redis` | `redis:7-alpine` | 80m | Broker Celery + cache Django (pas de persistance, `--save ""`) |
| `celery` | build local (même image que `web`) | 200m | Worker Celery, pool `solo` — **scaffold, aucune tâche réelle pour l'instant** |

Commandes de base :
```bash
cd /home/deploy/app/backend/backend
docker compose ps                    # état des services
docker compose logs -f web           # logs en direct
docker stats --no-stream             # RAM/CPU instantané
```

---

## 3. Déployer une mise à jour

```bash
cd /home/deploy/app
git pull
cd backend/backend
docker compose build web celery      # seuls ces deux services ont une image à reconstruire
docker compose up -d
```

`migrate` et `collectstatic` tournent **automatiquement** au démarrage de `web` (voir `docker-entrypoint.sh`) — pas besoin de les lancer à la main sauf cas particulier.

### ⚠️ Piège n°1 : `.env.example` ≠ `.env` réel
Le `.env` réel du serveur (`backend/backend/.env`, **jamais commité**, ignoré par git) n'est **pas synchronisé automatiquement** avec `.env.example` (committé). Après un `git pull` qui modifie `.env.example`, vérifier et reporter les nouvelles variables à la main :
```bash
diff <(grep -oE '^[A-Z_]+' .env.example | sort) <(grep -oE '^[A-Z_]+' .env | sort)
nano .env      # ajouter les variables manquantes
docker compose up -d web celery
```
**Incident vécu (2026-09-04)** : une variable `DJANGO_CACHE_URL` (config cache Redis) ajoutée à `.env.example` mais jamais reportée dans le `.env` réel → l'app retombait sur la valeur par défaut du code (`redis://localhost:6379/2`, invalide en conteneur) → toutes les routes utilisant le cache (rate-limiting DRF) renvoyaient une erreur 500, sans traceback visible (Django ne logue pas le détail des 500 par défaut en prod). Diagnostiqué en basculant temporairement `DEBUG=True`, puis confirmé via `manage.py shell` en testant le cache directement. Prendre l'habitude de faire le `diff` ci-dessus après chaque pull qui touche `.env.example`.

### ⚠️ Piège n°2 : 502 après redéploiement de `web`
Nginx résout le nom `web` en IP **dynamiquement** (`resolver 127.0.0.11 valid=10s` dans `nginx/default.conf`) — un redéploiement de `web`/`celery` recrée le conteneur avec une nouvelle IP interne. Nginx se remet à jour tout seul sous ~10 secondes. Si un test `curl` juste après un déploiement renvoie `502`, attendre quelques secondes et réessayer avant de chercher plus loin.

---

## 4. Accès & secrets

- **SSH** : clé Ed25519 de l'utilisateur `deploy`. Login root encore actif au moment de la rédaction — à désactiver une fois la stabilité confirmée (`PermitRootLogin no` dans `/etc/ssh/sshd_config`, **en gardant une session ouverte pendant le test**).
- **`.env` réel** (`backend/backend/.env`, jamais commité) contient : `DJANGO_SECRET_KEY`, credentials Postgres (`DB_*`), `RESEND_API_KEY` (email), `CELERY_BROKER_URL`/`CELERY_RESULT_BACKEND`, `DJANGO_CACHE_URL`. Voir `.env.example` pour la liste complète et les valeurs par défaut sûres.
- **Email transactionnel** : [Resend](https://resend.com), domaine `ceaam.org` vérifié (SPF/DKIM en place). Clé API dans `.env` (`RESEND_API_KEY`). Django utilise `django-anymail` — si `RESEND_API_KEY` est vide, l'app retombe automatiquement sur SMTP Gmail classique (ne fonctionnera pas : DigitalOcean bloque le port SMTP sortant par défaut, voir §7).
- **Stockage média** : **stockage local sur le Droplet** (`USE_S3=False`), volume Docker nommé `media_volume` monté sur `/app/media` du conteneur `web` (persiste across redéploiements). L'ancien bucket S3 AWS `ceeam` n'est plus utilisable — le compte AWS qui l'hébergeait a été désactivé (incident du 2026-09-04, découvert via une erreur `InvalidAccessKeyId` lors d'un upload de photo de profil). Le code supporte toujours S3 (`AWS_*` + `USE_S3=True` dans `.env`) si un stockage S3-compatible est reconfiguré plus tard (nouveau bucket AWS, Cloudflare R2, DigitalOcean Spaces) — prévoir alors d'ajouter `AWS_S3_ENDPOINT_URL` dans `.env`/`settings.py` pour un fournisseur non-AWS. **Penser à inclure `media_volume` dans les backups** (pas seulement Postgres, voir §5) puisque les fichiers utilisateurs y vivent maintenant.
- **Certificat HTTPS** : Cloudflare Origin CA (15 ans), stocké **hors du dépôt git** dans `/home/deploy/certs/cloudflare-origin.{pem,key}` (chmod 600), monté en lecture seule dans `nginx`. À régénérer depuis le dashboard Cloudflare (SSL/TLS → Origin Server) si besoin, puis `docker compose restart nginx`.

### ⚠️ Piège n°3 : `django.conf.urls.static.static()` ne fonctionne pas en prod
`backend/urls.py` sert `/media/` via la vue `django.views.static.serve` branchée directement (pas via le helper `static()` de Django) — **c'est volontaire**. Le helper `django.conf.urls.static.static()` a un garde codé en dur dans Django lui-même : il renvoie une liste de routes **vide** si `settings.DEBUG` est `False`, quelle que soit la condition qui l'entoure dans notre code. Avec `USE_S3=False` et `DEBUG=False` (prod normale), ça faisait qu'**aucune route** n'existait pour `/media/...` → 404 systématique même quand le fichier existait bien sur disque (incident du 2026-09-06, plusieurs heures de diagnostic car le fichier était bien présent et l'URL bien correcte — le bug était l'absence totale de route, pas un souci de fichier ou d'URL). Ne pas réintroduire `static(settings.MEDIA_URL, ...)` sans le garde `if settings.DEBUG` strict — utiliser `re_path(r'^media/(?P<path>.*)$', serve_static, {'document_root': ...})` pour que ça marche aussi en prod.

---

## 5. Backup & restauration

### PostgreSQL
```bash
# Backup manuel
docker compose exec -T db pg_dump -U $DB_USER $DB_NAME | gzip > /home/deploy/backups/ceeam-$(date +%F).sql.gz

# Restauration (arrêter web/celery d'abord pour éviter des écritures concurrentes)
docker compose stop web celery
gunzip -c /home/deploy/backups/ceeam-YYYY-MM-DD.sql.gz | docker compose exec -T db psql -U $DB_USER $DB_NAME
docker compose start web celery
```

### Fichiers média (`media_volume`)
Depuis le passage au stockage local (§4), les fichiers uploadés (photos de profil, etc.) vivent **uniquement** dans le volume Docker `media_volume` — aucune copie externe (S3) contrairement à avant. À sauvegarder aussi :
```bash
docker run --rm -v backend_media_volume:/media -v /home/deploy/backups:/backup alpine \
  tar czf /backup/media-$(date +%F).tar.gz -C /media .
```

Un cron quotidien avec rétention 14 jours est recommandé pour les deux (voir `README-deploy.md` pour la ligne crontab Postgres, à dupliquer pour média). **Pas encore mis en place au moment de la rédaction** — à faire, et désormais plus urgent puisque les médias n'ont plus de copie externe.

---

## 6. Contrainte mémoire (1 GiB) — points de vigilance

Le Droplet est délibérément petit. Chaque service a une limite mémoire dans `docker-compose.yml` (§2) pour qu'un service qui dérape soit isolé plutôt que de risquer un OOM global. Un swapfile de 2 GiB sert de filet de sécurité, mais le swap dégrade les perfs s'il est sollicité en continu.

- `docker stats --no-stream` régulièrement pour surveiller.
- Si saturation récurrente : réduire `--workers`/`--threads` de Gunicorn (`Dockerfile`), ou envisager un **resize du Droplet** ou une **base PostgreSQL managée DigitalOcean** (options payantes — à valider avec le budget avant d'activer).
- Le `docker compose build` (compilation des dépendances Python) est le moment le plus tendu en RAM — éviter de le lancer en même temps qu'un pic de trafic si possible.

---

## 7. Limitations connues / dette technique

- **Port SMTP sortant bloqué par DigitalOcean** (politique anti-spam par défaut sur les nouveaux Droplets) → migration de Gmail SMTP vers Resend (API HTTPS) déjà faite, voir §4. Si un jour DigitalOcean débloque le port sur demande (ticket support), le SMTP Gmail reste en repli automatique mais n'est plus la solution recommandée.
- **Déliverabilité email** : domaine `ceaam.org` tout juste vérifié chez Resend au moment de la rédaction — les emails peuvent atterrir en spam le temps que la réputation d'envoi se construise. Pas d'action requise, ça s'améliore avec le volume d'envois légitimes ; DMARC à vérifier/compléter sur resend.com/domains si ce n'est pas déjà fait.
- **Celery/Redis** : infrastructure en place mais **aucune tâche asynchrone réelle** n'est encore câblée (`backend/celery.py` ne contient qu'une tâche `debug_task` de test). Prévu pour une fonctionnalité future.
- **Ancien compte AWS désactivé, entièrement injoignable** — confirmé sur trois fronts : DNS de l'ancienne RDS ne résout plus, SSH/ping timeout sur l'ancien serveur EC2 (`13.60.99.150`), et la clé S3 (`AWS_ACCESS_KEY_ID`) renvoie `InvalidAccessKeyId` (la clé elle-même n'existe plus, pas juste un problème de droits). Migration des anciennes données/média abandonnée faute d'accès. Le stockage média est passé sur disque local en conséquence (voir §4).
- **`requirements.txt`** : `Django` pinné à `>=4.2,<6.0` (une version non bornée avait cassé la compatibilité avec `djangorestframework==3.17.1` lors d'un build Docker propre — garder ce plafond tant que DRF n'est pas mis à jour en conséquence).
- **Migrations** : une migration manquante historique a été reconstruite (`api/migrations/0021_5_create_classroom_subject_resource.py`) pour que la base puisse être recréée de zéro (modèles `Classroom`/`Subject`/`Resource` qui n'avaient jamais eu leur migration de création committée). Ne pas supprimer ni renommer ce fichier.

---

## 8. Contacts / références

- Repo : `github.com/CEEAM-CelluleInfo/preprod`
- Hébergement DNS/CDN : Cloudflare (compte à obtenir auprès de l'équipe précédente pour gérer domaine + certs)
- Email : Resend (resend.com)
- Media : stockage local sur le Droplet (volume Docker `media_volume`) — plus d'AWS S3 depuis le 2026-09-04
