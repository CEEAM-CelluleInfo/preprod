# Gestion des fichiers média (photos, uploads)

Les fichiers média (photos de profil, images de propositions d'activités, etc.) sont stockés **localement sur le Droplet**, dans le volume Docker nommé `media_volume`, monté sur `/app/media` dans le conteneur `web`. Voir `DEVOPS-HANDOFF.md` §4 pour le contexte (l'ancien stockage S3 AWS n'est plus utilisable).

Les URLs de ces fichiers suivent le format : `https://api.ceaam.org/media/<chemin>`, par exemple `https://api.ceaam.org/media/avatars/16_9b817844.jpg`.

---

## Voir un fichier

**Dans le navigateur** (le plus simple) :
```
https://api.ceaam.org/media/avatars/16_9b817844.jpg
```

## Lister les fichiers présents (sur le Droplet, via SSH)

```bash
cd /home/deploy/app/backend/backend
docker compose exec web ls -la /app/media/avatars/
```
(remplacer `avatars` par un autre sous-dossier si besoin, ex. `activity_proposals/`)

Espace disque total utilisé par les médias :
```bash
docker compose exec web du -sh /app/media/
```

## Télécharger un fichier précis sur sa machine locale

En deux étapes, depuis le Droplet puis depuis sa machine locale.

**1. Sur le Droplet**, sortir le fichier du conteneur vers le système de fichiers du serveur :
```bash
cd /home/deploy/app/backend/backend
docker compose cp web:/app/media/avatars/16_9b817844.jpg /home/deploy/16_9b817844.jpg
```

**2. Depuis sa machine locale (PowerShell)**, récupérer le fichier via `scp` (déjà disponible sur Windows 10+) :
```powershell
scp deploy@134.122.68.237:/home/deploy/16_9b817844.jpg C:\Users\<utilisateur>\Downloads\
```

Penser à supprimer la copie temporaire sur le Droplet une fois récupérée, si elle n'est plus utile :
```bash
rm /home/deploy/16_9b817844.jpg
```

## Accéder directement au dossier du volume sur le disque du serveur

Utile pour une exploration plus poussée (recherche, copie en masse) sans passer par le conteneur :
```bash
docker volume inspect backend_media_volume --format '{{ .Mountpoint }}'
```
Renvoie un chemin du type `/var/lib/docker/volumes/backend_media_volume/_data`, utilisable avec `sudo ls`/`sudo find` directement sur le serveur.

## Sauvegarde des médias

Le volume `media_volume` n'a **aucune copie externe** (contrairement à l'ancien S3). Voir `DEVOPS-HANDOFF.md` §5 pour la commande de backup (`docker run ... tar czf ...`) — à mettre en place en cron au même titre que le backup PostgreSQL, sans quoi une perte du Droplet entraînerait la perte de tous les fichiers uploadés par les utilisateurs.
