# Fonctionnement de la plateforme CEEAM — Rôles et actions

Ce document explique, en langage simple, qui peut faire quoi sur la plateforme, et comment fonctionnent les grands processus métier (élections, passage au statut Lauréat, activités). Il est destiné aux membres du Bureau et à toute personne souhaitant comprendre le fonctionnement de l'application sans lire le code.

*Établi le 8 septembre 2026, à partir d'une analyse complète du code backend.*

---

## 1. Les rôles disponibles

Chaque compte a un **rôle** parmi :

| Rôle | Nom affiché | Description |
|---|---|---|
| `student` | Étudiant | Rôle par défaut à l'inscription |
| `bureau` | Membre du Bureau | Gère la vie associative courante |
| `admin` | Administrateur | Rôle le plus élevé côté application |
| `adminpromo` | Admin de Promotion | Gère le module Classroom (cours/ressources) |
| `laureat` | Lauréat | Ancien étudiant diplômé, avec un profil enrichi |

**⚠️ Point important à comprendre** : il existe en réalité **deux systèmes de "pouvoir" séparés et indépendants** sur cette plateforme :

1. **Le rôle** (`student`, `bureau`, `admin`, `adminpromo`, `laureat`) — contrôle ce qu'on peut faire **dans l'application web** (ceaam.org).
2. **Le statut technique "Staff/Superuser" de Django** — contrôle l'accès au **panneau d'administration technique** (`api.ceaam.org/admin/`), un panneau bas-niveau qui permet de tout modifier directement dans la base de données (utilisateurs, activités, votes, etc.), sans passer par les règles métier de l'application.

Ces deux systèmes **ne sont pas synchronisés automatiquement**. Donner le rôle `admin` à quelqu'un dans l'application ne lui donne **pas** accès au panneau `/admin/`, et inversement. Le panneau `/admin/` reste le plus puissant des deux — un compte "Staff" y a accès à tout, quel que soit son rôle applicatif. Seul un développeur/l'équipe technique peut accorder ce statut Staff (ce n'est pas possible depuis l'interface web).

---

## 2. Ce que chaque rôle peut faire

### Étudiant (`student`) — le rôle par défaut
- Consulter et modifier son propre profil, changer sa photo, son mot de passe.
- Voir/s'inscrire/aimer les activités, s'inscrire à un événement.
- Proposer une nouvelle activité (soumise à validation, voir §3.3).
- Participer aux élections : se porter candidat à un poste du Bureau, voter.
- Demander à devenir Lauréat (voir §3.2).
- Consulter le module Classroom (cours/ressources) — lecture seule.
- Voir/gérer ses notifications.

### Membre du Bureau (`bureau`)
Tout ce que peut faire un étudiant, **plus** :
- Gérer les élections : créer une session de vote annuelle, configurer les postes et candidats, approuver/rejeter les candidatures, démarrer et clôturer le vote.
- Examiner les demandes "devenir Lauréat" : approuver ou rejeter (l'approbation transforme automatiquement le compte en Lauréat, voir §3.2).
- Examiner les propositions d'activités des étudiants et invités : approuver (l'activité est alors publiée) ou rejeter.
- Consulter et rechercher la liste de tous les utilisateurs (panneau de gestion interne).
- Modifier le rôle d'un autre utilisateur — **sauf** attribuer ou retirer le rôle `admin` (réservé à un administrateur, voir ci-dessous).

**Limite importante** : un membre du Bureau **ne peut pas** directement créer/modifier/supprimer une activité déjà publiée, ni modifier la liste des membres du Bureau affichée sur le site, ni les dates académiques — ces actions nécessitent le statut technique "Staff" (voir §1). Le Bureau agit surtout via l'**approbation de propositions**, pas par édition directe.

### Administrateur (`admin`)
Tout ce que peut faire un membre du Bureau, **plus** :
- C'est le **seul rôle** habilité à attribuer ou retirer le rôle `admin` à un autre compte (le Bureau peut changer les autres rôles, mais pas celui-ci).

En dehors de ce point précis, un `admin` et un `bureau` ont exactement les mêmes capacités dans l'application. Le rôle `admin` **ne donne pas** automatiquement accès au panneau technique `/admin/` (voir §1).

### Admin de Promotion (`adminpromo`)
Ce rôle est **exclusivement dédié au module Classroom** (l'espace de ressources pédagogiques par classe) :
- Créer/modifier/supprimer des classes, semestres, matières et ressources de cours.

En dehors du Classroom, un compte `adminpromo` est traité comme un simple étudiant (pas de pouvoir particulier sur les votes, activités, ou demandes Lauréat). Si l'intention métier était que ce rôle gère plus largement les étudiants d'une promotion donnée (annonces, suivi, etc.), **ce n'est pas ce qui est codé actuellement** — à clarifier avec l'équipe si besoin.

### Lauréat (`laureat`)
Tout ce que peut faire un étudiant, **plus**, sur son propre profil uniquement :
- Compléter son profil Lauréat étendu (poste actuel, entreprise, ville, LinkedIn, citation).
- Ajouter des entrées à son historique (parcours académique/professionnel).
- Ajouter des compétences.
- Activer/désactiver sa disponibilité pour du mentorat.

**Comment devient-on Lauréat ?** Voir §3.2 — c'est **automatique** dès qu'un membre du Bureau ou un administrateur approuve la demande.

### Staff/Superuser technique (panneau `/admin/`)
Accès total et sans restriction à toutes les données de la plateforme, indépendamment du rôle applicatif. Réservé à l'équipe technique. C'est aussi la seule façon de gérer certains contenus qui n'ont **aucune interface dans l'application** : messages de contact reçus, FAQ, documents (voir §3.5).

---

## 3. Les grands processus métier

### 3.1 Inscription et connexion
N'importe qui peut créer un compte (rôle `student` par défaut). La connexion se fait par email/mot de passe, avec vérification d'email et réinitialisation de mot de passe par lien envoyé par email.

### 3.2 Devenir Lauréat
1. Un étudiant (ou toute personne connectée) soumet une demande via le formulaire "Rejoindre les Lauréats" (une seule demande active à la fois).
2. Il peut suivre le statut de sa demande depuis son espace.
3. Un membre du Bureau ou un administrateur examine la demande et l'**approuve** ou la **rejette**.
4. **Dès l'approbation** :
   - Le compte passe automatiquement au rôle `laureat`.
   - Son profil Lauréat est créé/complété avec les informations fournies (poste, entreprise, ville).
   - Un email de confirmation est envoyé, avec un lien de connexion et de réinitialisation de mot de passe.

Il n'y a **pas d'étape manuelle supplémentaire** — l'approbation suffit à tout déclencher.

### 3.3 Proposer et publier une activité
- **Deux façons de proposer** une activité : un membre connecté via le formulaire standard, ou une personne extérieure (invité, non connectée) via un formulaire nécessitant au moins une adresse email de contact.
- La proposition reste en attente jusqu'à ce qu'un membre du Bureau ou un administrateur l'**approuve** (elle devient alors une activité publiée et visible/réservable par tous) ou la **rejette**.
- Une fois publiée, l'inscription à une activité est ouverte à tous, y compris aux personnes non connectées (avec nom/email/téléphone/niveau d'étude).

Un bug empêchait auparavant l'approbation/le rejet des propositions d'activités soumises par des invités (non-membres) de fonctionner correctement ; il a été corrigé (voir §4).

### 3.4 Élections du Bureau
1. Un membre du Bureau ou un administrateur **crée une session de vote** pour une année donnée. Les 11 postes officiels du Bureau (Secrétaire Général, SG Adjoint, Trésorier, Chargé Communication, etc.) sont générés automatiquement, avec leurs dates de candidature et de vote.
2. **Ouverture de la période de candidature** : le Bureau/admin ouvre cette phase.
3. **N'importe quel membre connecté** peut se porter candidat à un poste (une seule candidature par personne, tous postes confondus). Les postes de Secrétaire Général et Trésorier exigent d'avoir complété au moins un an dans l'école.
4. Le Bureau/admin approuve les candidatures.
5. Le Bureau/admin **démarre le vote** (nécessite au moins un candidat approuvé). **N'importe quel membre connecté** peut voter — une voix par poste (donc jusqu'à 11 votes au total, un par poste).
6. Le Bureau/admin **clôture le vote**.
7. **Attribution des résultats et renouvellement du Bureau** : le Bureau/admin déclenche cette étape (qui calcule les gagnants et crée les nouveaux membres du Bureau) — ce n'est **pas automatique** à la clôture du vote, c'est une action séparée à déclencher explicitement.

Le Bureau peut donc désormais gérer une élection de bout en bout (création de la session jusqu'au renouvellement du Bureau) sans intervention technique — une incohérence de permissions sur les étapes 2 et 7, qui les réservait auparavant aux seuls comptes techniques "Staff", a été corrigée (voir §4).

### 3.5 Ce qui n'est gérable que via le panneau technique `/admin/`
Certains contenus n'ont **aucune interface dans l'application web** — ils ne sont accessibles que par l'équipe technique via le panneau `/admin/` :
- Les **messages reçus via le formulaire de contact**.
- La **FAQ**.
- Les **documents** (modèle "Document").

Si le Bureau doit pouvoir consulter/gérer ces éléments sans passer par un développeur, il faudrait ajouter une interface dédiée dans l'application.

### 3.6 Module Classroom (ressources pédagogiques)
Tout membre connecté peut **consulter** les classes, semestres, matières et ressources. Seuls `admin`, `bureau`, `adminpromo` (et les comptes techniques Staff) peuvent **créer/modifier/supprimer** ces contenus.

---

## 4. Points vérifiés avec l'équipe technique

Les 6 points suivants ont été vérifiés directement dans le code le 8 septembre 2026. Les deux premiers étaient de vrais bugs et ont été **corrigés** ; les quatre suivants sont des clarifications/limitations actuelles à connaître (pas des bugs).

1. ✅ **Corrigé** — Bug sur l'approbation des propositions d'activités (§3.3) : le code contenait deux définitions de la même fonction (la seconde écrasait la première) et référençait une variable jamais définie, ce qui faisait planter l'action (l'activité était bien créée en base, mais l'utilisateur recevait quand même une erreur). La correction restaure aussi le traitement des propositions soumises par des invités (non-membres), qui avait disparu. Testé (approbation membre, approbation invité, rejet invité) — fonctionne.
2. ✅ **Corrigé** — Incohérence de permissions sur les élections (§3.4, étapes 2 et 7 : ouverture des candidatures et renouvellement du Bureau) : ces deux actions étaient réservées aux comptes techniques "Staff" par erreur (confusion entre `IsAdminUser` de Django et notre propre règle de rôle métier), alors que le reste du processus électoral est accessible à tout membre du Bureau. Alignées sur la même règle que le reste du processus.
3. **Le rôle "Admin de Promotion" a un périmètre plus étroit que son nom ne le suggère** — uniquement le module Classroom aujourd'hui, rien sur la gestion d'une promotion d'étudiants au sens large.
4. **Deux pages de détail Lauréat semblent nécessiter une connexion** alors que le reste de l'annuaire des Lauréats est public — à vérifier si c'est voulu.
5. **Le rôle applicatif `admin` et le statut technique "Staff" sont indépendants** (§1) — à garder en tête pour éviter toute confusion lors de la gestion des comptes.
6. **Un champ "résultats publiés" existe sur les sessions de vote** mais aucune action de l'application ne semble permettre de l'activer — peut-être réservé au panneau technique, ou fonctionnalité non finalisée.
