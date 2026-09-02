# Déploiement backend — Droplet DigitalOcean

Contexte complet : voir `../deploy.md`. Ce fichier couvre les opérations courantes une fois le déploiement initial fait.

## Redéployer une nouvelle version

```bash
cd /home/deploy/app
git pull
cd backend/backend
docker compose build web celery
docker compose up -d
```

`migrate` et `collectstatic` tournent automatiquement au démarrage de `web` (voir `docker-entrypoint.sh`).

## Voir les logs

```bash
docker compose logs -f web
docker compose logs -f nginx
docker compose logs -f db
docker compose logs -f celery
docker stats            # usage mémoire/CPU en direct — RAM du Droplet limitée à 1 GiB
```

## Backup PostgreSQL

Sauvegarde manuelle :

```bash
docker compose exec -T db pg_dump -U $DB_USER $DB_NAME | gzip > /home/deploy/backups/ceeam-$(date +%F).sql.gz
```

À planifier via cron (ex. tous les jours à 3h, rétention 14 jours) :

```cron
0 3 * * * cd /home/deploy/app/backend/backend && docker compose exec -T db pg_dump -U $DB_USER $DB_NAME | gzip > /home/deploy/backups/ceeam-$(date +\%F).sql.gz && find /home/deploy/backups -name '*.sql.gz' -mtime +14 -delete
```

## Restaurer un backup

```bash
docker compose stop web celery
gunzip -c /home/deploy/backups/ceeam-YYYY-MM-DD.sql.gz | docker compose exec -T db psql -U $DB_USER $DB_NAME
docker compose start web celery
```

## Changer une valeur du `.env`

```bash
nano .env
docker compose up -d web celery   # recrée les conteneurs concernés avec les nouvelles variables
```

## Certificat Cloudflare Origin CA

Généré depuis le dashboard Cloudflare (SSL/TLS → Origin Server), valable 15 ans. Stocké en dehors du dépôt git, dans `/home/deploy/certs/cloudflare-origin.{pem,key}` (chmod 600), monté en lecture seule dans le conteneur `nginx`. En cas de régénération, remplacer les deux fichiers puis `docker compose restart nginx`.

## Contrainte mémoire (1 GiB)

Chaque service a une limite mémoire dans `docker-compose.yml` (`nginx` 32m, `web` 350m, `db` 200m, `redis` 80m, `celery` 200m) pour qu'un service qui dérape soit isolé plutôt que de risquer un OOM global. Un swapfile de 2 GiB est en place comme filet de sécurité. Si `docker stats` montre une saturation récurrente : réduire `--workers`/`--threads` de Gunicorn, ou envisager un resize du Droplet / une base Postgres managée (options payantes, à valider avant de les activer).
