"""
Modèles Django - Plateforme CEEAM
Basé sur ERD v2.0
"""

from django.conf import settings
from django.contrib.auth.models import AbstractUser, Group
from django.db import models
from django.core.exceptions import ValidationError


# =====================================================
# SECTION 1: UTILISATEURS & AUTHENTIFICATION
# =====================================================

class Country(models.Model):
    """Pays membres de la communauté CEEAM."""
    name = models.CharField(max_length=100, unique=True, verbose_name="Nom du pays")
    code_iso = models.CharField(max_length=3, unique=True, verbose_name="Code ISO")
    flag_emoji = models.CharField(max_length=10, blank=True, verbose_name="Emoji drapeau")
    continent = models.CharField(max_length=50, blank=True, verbose_name="Continent")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")

    class Meta:
        verbose_name = "Pays"
        verbose_name_plural = "Pays"
        ordering = ["name"]

    def __str__(self):
        return f"{self.flag_emoji} {self.name}"


class Specialite(models.Model):
    """Filières et spécialités de l'ENSAM."""
    code = models.CharField(max_length=20, unique=True, verbose_name="Code")
    intitule = models.CharField(max_length=200, verbose_name="Intitulé")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")

    class Meta:
        verbose_name = "Spécialité"
        verbose_name_plural = "Spécialités"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} - {self.intitule}"


class User(AbstractUser):
    """Membre de la communauté CEEAM (étudiant, bureau, admin, lauréat)."""
    
    ROLE_CHOICES = [
        ("student", "Étudiant"),
        ("bureau", "Membre du Bureau"),
        ("admin", "Administrateur"),
        ('adminpromo', 'Admin de Promotion'),
        ("laureat", "Lauréat"),
    ]
    
    LANGUAGE_CHOICES = [
        ("fr", "Français"),
        ("en", "English"),
    ]
    
    # Champs de base (hérités de AbstractUser: username, email, first_name, last_name, password, etc.)
    email = models.EmailField(unique=True, verbose_name="Email")
    phone = models.CharField(max_length=30, blank=True, verbose_name="Téléphone")
    whatsapp = models.CharField(max_length=30, blank=True, verbose_name="WhatsApp")
    country = models.ForeignKey(
        Country, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="users",
        verbose_name="Pays d'origine"
    )
    promotion = models.CharField(max_length=10, blank=True, verbose_name="Promotion")
    specialite = models.ForeignKey(
        Specialite,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
        verbose_name="Spécialité"
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student", verbose_name="Rôle")
    avatar_url = models.CharField(max_length=500, blank=True, verbose_name="URL Avatar")
    biographie = models.TextField(blank=True, max_length=500, verbose_name="Biographie")
    preferred_language = models.CharField(
        max_length=2, 
        choices=LANGUAGE_CHOICES, 
        default="fr",
        verbose_name="Langue préférée"
    )
    
    # Nouveaux champs pour profil complet
    campus = models.CharField(max_length=100, blank=True, verbose_name="Campus")
    linkedin_url = models.CharField(max_length=500, blank=True, verbose_name="LinkedIn URL")
    interests = models.JSONField(default=list, blank=True, verbose_name="Centres d'intérêt")
    looking_for = models.JSONField(default=list, blank=True, verbose_name="Je recherche")
    
    # Email verification
    email_verified = models.BooleanField(
        default=False,
        verbose_name="Email vérifié",
        help_text="L'utilisateur a cliqué sur le lien de vérification"
    )
    
    # Utiliser email comme identifiant de connexion
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class LaureatProfile(models.Model):
    """Extension professionnelle pour les lauréats."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="laureat_profile",
        verbose_name="Utilisateur"
    )
    current_position = models.CharField(max_length=200, blank=True, verbose_name="Poste actuel")
    company = models.CharField(max_length=200, blank=True, verbose_name="Entreprise")
    work_country = models.ForeignKey(
        Country,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="laureats_working",
        verbose_name="Pays de travail"
    )
    work_city = models.CharField(max_length=100, blank=True, verbose_name="Ville de travail")
    professional_email = models.EmailField(blank=True, verbose_name="Email professionnel")
    linkedin_url = models.URLField(blank=True, verbose_name="LinkedIn")
    work_domain = models.CharField(max_length=300, blank=True, verbose_name="Domaine de travail")
    citation = models.TextField(blank=True, verbose_name="Citation")
    biographie_pro = models.TextField(blank=True, verbose_name="Biographie professionnelle")
    is_public = models.BooleanField(default=True, verbose_name="Profil public")
    available_for_mentoring = models.BooleanField(default=False, verbose_name="Disponible pour mentorat")
    mentorship_areas = models.JSONField(default=list, blank=True, verbose_name="Domaines de mentorat")
    
    # Legacy JSON fields (deprecated - use related models instead)
    historique_legacy = models.JSONField(default=list, blank=True, verbose_name="[LEGACY] Historique JSON")
    competences_legacy = models.JSONField(default=list, blank=True, verbose_name="[LEGACY] Compétences JSON")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Mis à jour le")

    class Meta:
        verbose_name = "Profil Lauréat"
        verbose_name_plural = "Profils Lauréats"

    def __str__(self):
        return f"Profil lauréat de {self.user.full_name}"


class LaureatJoinRequest(models.Model):
    """Demande d'inscription a l'annuaire des laureats."""

    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("approved", "Approuvee"),
        ("rejected", "Rejetee"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="laureat_join_requests",
        verbose_name="Utilisateur"
    )
    nom = models.CharField(max_length=100, verbose_name="Nom complet")
    promotion = models.CharField(max_length=20, verbose_name="Promotion")
    specialite = models.CharField(max_length=200, verbose_name="Specialite")
    poste = models.CharField(max_length=150, verbose_name="Poste")
    entreprise = models.CharField(max_length=150, verbose_name="Entreprise")
    ville = models.CharField(max_length=100, verbose_name="Ville")
    pays = models.CharField(max_length=100, verbose_name="Pays")
    contact = models.EmailField(verbose_name="Contact")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending", verbose_name="Statut")
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name="Soumis le")

    class Meta:
        verbose_name = "Demande d'inscription lauréat"
        verbose_name_plural = "Demandes d'inscription lauréat"
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.nom} ({self.promotion}) - {self.status}"


# =====================================================
# HISTORIQUE ACADÉMIQUE ET PROFESSIONNEL
# =====================================================

class HistoriqueEntry(models.Model):
    """Entrée d'historique académique ou professionnel pour un lauréat."""
    
    TYPE_CHOICES = [
        ("academic", "Formation académique"),
        ("professional", "Expérience professionnelle"),
        ("certification", "Certification / Diplôme"),
        ("project", "Projet personnel"),
        ("volunteering", "Bénévolat / Associatif"),
        ("other", "Autre"),
    ]
    
    laureat = models.ForeignKey(
        LaureatProfile,
        on_delete=models.CASCADE,
        related_name="historique_entries",
        verbose_name="Profil lauréat"
    )
    entry_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default="professional",
        verbose_name="Type d'entrée"
    )
    title = models.CharField(max_length=200, verbose_name="Titre / Poste")
    organization = models.CharField(max_length=200, blank=True, verbose_name="Organisation / Entreprise")
    location = models.CharField(max_length=200, blank=True, verbose_name="Lieu")
    start_date = models.DateField(verbose_name="Date de début")
    end_date = models.DateField(null=True, blank=True, verbose_name="Date de fin")
    is_current = models.BooleanField(default=False, verbose_name="En cours")
    description = models.TextField(blank=True, verbose_name="Description")
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Mis à jour le")

    class Meta:
        verbose_name = "Entrée d'historique"
        verbose_name_plural = "Entrées d'historique"
        ordering = ["-start_date", "-order"]

    def __str__(self):
        return f"{self.get_entry_type_display()}: {self.title}"


# =====================================================
# COMPÉTENCES
# =====================================================

class CompetenceCategory(models.Model):
    """Catégorie de compétences (prédéfinie ou personnalisée)."""
    
    name = models.CharField(max_length=100, verbose_name="Nom de la catégorie")
    slug = models.SlugField(max_length=100, unique=True, verbose_name="Slug")
    icon = models.CharField(max_length=50, blank=True, verbose_name="Icône (FontAwesome)")
    is_predefined = models.BooleanField(default=False, verbose_name="Catégorie prédéfinie")
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")

    class Meta:
        verbose_name = "Catégorie de compétence"
        verbose_name_plural = "Catégories de compétences"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class UserCompetence(models.Model):
    """Compétence d'un utilisateur avec niveau optionnel."""
    
    LEVEL_CHOICES = [
        ("beginner", "Débutant"),
        ("intermediate", "Intermédiaire"),
        ("advanced", "Avancé"),
        ("expert", "Expert"),
    ]
    
    laureat = models.ForeignKey(
        LaureatProfile,
        on_delete=models.CASCADE,
        related_name="user_competences",
        verbose_name="Profil lauréat"
    )
    category = models.ForeignKey(
        CompetenceCategory,
        on_delete=models.CASCADE,
        related_name="competences",
        verbose_name="Catégorie"
    )
    name = models.CharField(max_length=100, verbose_name="Nom de la compétence")
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        blank=True,
        verbose_name="Niveau"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")

    class Meta:
        verbose_name = "Compétence utilisateur"
        verbose_name_plural = "Compétences utilisateurs"
        unique_together = ["laureat", "category", "name"]
        ordering = ["category__order", "name"]

    def __str__(self):
        level_str = f" ({self.get_level_display()})" if self.level else ""
        return f"{self.name}{level_str}"


# =====================================================
# SECTION 2: ACTIVITÉS & INTERACTIONS
# =====================================================

class Activity(models.Model):
    """Événements et activités de l'association."""
    
    CATEGORY_CHOICES = [
        ("integration", "Intégration"),
        ("formation", "Formation"),
        ("culture", "Culture"),
        ("networking", "Networking"),
        ("sport", "Sport"),
    ]
    
    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.CharField(max_length=500, verbose_name="Description courte")
    long_description = models.TextField(blank=True, verbose_name="Description longue")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name="Catégorie")
    image_url = models.URLField(blank=True, verbose_name="URL de l'image")
    event_date = models.DateTimeField(null=True, blank=True, verbose_name="Date de l'événement")
    event_time = models.CharField(max_length=20, blank=True, verbose_name="Heure")
    location = models.CharField(max_length=200, blank=True, verbose_name="Lieu")
    duration = models.CharField(max_length=50, blank=True, verbose_name="Durée")
    max_participants = models.PositiveIntegerField(default=0, verbose_name="Participants max")
    registration_deadline = models.DateTimeField(null=True, blank=True, verbose_name="Date limite d'inscription")
    organizer_name = models.CharField(max_length=200, blank=True, verbose_name="Nom de l'organisateur")
    organizer_avatar = models.URLField(blank=True, verbose_name="Avatar de l'organisateur")
    tags = models.JSONField(default=list, blank=True, verbose_name="Tags")
    is_upcoming = models.BooleanField(default=True, verbose_name="À venir")
    is_published = models.BooleanField(default=True, verbose_name="Publié")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Mis à jour le")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="activities_created",
        verbose_name="Créé par"
    )

    class Meta:
        verbose_name = "Activité"
        verbose_name_plural = "Activités"
        ordering = ["-event_date", "-created_at"]

    def __str__(self):
        return self.title
    
    @property
    def likes_count(self):
        return self.likes.count()
    
    @property
    def registrations_count(self):
        return (
            self.registrations.exclude(status="cancelled").count()
            + self.guest_registrations.exclude(status="cancelled").count()
        )


class ActivityLike(models.Model):
    """Likes sur les activités (un user = un like par activité)."""
    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name="likes",
        verbose_name="Activité"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activity_likes",
        verbose_name="Utilisateur"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")

    class Meta:
        verbose_name = "Like d'activité"
        verbose_name_plural = "Likes d'activités"
        unique_together = ("activity", "user")

    def __str__(self):
        return f"{self.user} aime {self.activity}"


class ActivityRegistration(models.Model):
    """Inscriptions aux activités."""
    
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("confirmed", "Confirmé"),
        ("cancelled", "Annulé"),
        ("attended", "Présent"),
    ]
    
    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name="registrations",
        verbose_name="Activité"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activity_registrations",
        verbose_name="Utilisateur"
    )
    nom_complet = models.CharField(max_length=100, blank=True, verbose_name="Nom complet")
    email = models.EmailField(blank=True, verbose_name="Email")
    telephone = models.CharField(max_length=20, blank=True, verbose_name="Téléphone")
    niveau_etude = models.CharField(max_length=50, blank=True, verbose_name="Niveau d'étude")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending", verbose_name="Statut")
    registered_at = models.DateTimeField(auto_now_add=True, verbose_name="Inscrit le")
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name="Confirmé le")
    cancellation_reason = models.TextField(blank=True, verbose_name="Motif d'annulation")

    class Meta:
        verbose_name = "Inscription activité"
        verbose_name_plural = "Inscriptions activités"
        unique_together = ("activity", "user")

    def __str__(self):
        return f"{self.user} inscrit à {self.activity}"


class GuestActivityRegistration(models.Model):
    """Inscriptions des utilisateurs non connectés aux activités."""

    STATUS_CHOICES = ActivityRegistration.STATUS_CHOICES

    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name="guest_registrations",
        verbose_name="Activité",
    )
    nom_complet = models.CharField(max_length=100, verbose_name="Nom complet")
    email = models.EmailField(verbose_name="Email")
    telephone = models.CharField(max_length=20, verbose_name="Téléphone")
    niveau_etude = models.CharField(max_length=50, verbose_name="Niveau d'étude")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="confirmed", verbose_name="Statut")
    registered_at = models.DateTimeField(auto_now_add=True, verbose_name="Inscrit le")

    class Meta:
        verbose_name = "Inscription invité"
        verbose_name_plural = "Inscriptions invités"
        unique_together = ("activity", "email")
        ordering = ["-registered_at"]

    def __str__(self):
        return f"{self.nom_complet} (invité) inscrit à {self.activity}"


class Media(models.Model):
    """Fichiers médias liés aux activités."""
    
    TYPE_CHOICES = [
        ("image", "Image"),
        ("video", "Vidéo"),
    ]
    
    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name="medias",
        verbose_name="Activité"
    )
    file_path = models.CharField(max_length=500, verbose_name="Chemin du fichier")
    media_type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name="Type")
    caption = models.CharField(max_length=255, blank=True, verbose_name="Légende")
    display_order = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="Uploadé le")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="medias_uploaded",
        verbose_name="Uploadé par"
    )

    class Meta:
        verbose_name = "Média"
        verbose_name_plural = "Médias"
        ordering = ["display_order"]

    def __str__(self):
        return f"{self.media_type} - {self.activity}"


class ActivityProposal(models.Model):
    """Propositions d'activités par les membres."""

    # Keep the model field name as `id` for API compatibility,
    # but use a more explicit database column name.
    id = models.BigAutoField(
        primary_key=True,
        db_column="proposal_id",
        verbose_name="ID"
    )
    
    CATEGORY_CHOICES = Activity.CATEGORY_CHOICES
    
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("under_review", "En cours d'examen"),
        ("approved", "Approuvé"),
        ("rejected", "Rejeté"),
    ]
    
    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(verbose_name="Description")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name="Catégorie")
    proposed_date = models.DateField(null=True, blank=True, verbose_name="Date proposée")
    proposed_time = models.TimeField(null=True, blank=True, verbose_name="Heure proposée")
    location = models.CharField(max_length=200, blank=True, verbose_name="Lieu")
    estimated_participants = models.PositiveIntegerField(default=0, verbose_name="Participants estimés")
    contact_email = models.EmailField(blank=True, verbose_name="Email de contact")
    additional_info = models.TextField(blank=True, verbose_name="Infos supplémentaires")
    image_url = models.URLField(blank=True, verbose_name="URL de l'image")
    image_file = models.FileField(
        upload_to="activity_proposals/",
        null=True,
        blank=True,
        verbose_name="Fichier image"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending", verbose_name="Statut")
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name="Soumis le")
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name="Examiné le")
    reviewer_comment = models.TextField(blank=True, verbose_name="Commentaire du réviseur")
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="proposals_reviewed",
        verbose_name="Examiné par"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="proposals_created",
        verbose_name="Créé par"
    )

    class Meta:
        verbose_name = "Proposition d'activité"
        verbose_name_plural = "Propositions d'activités"
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class GuestActivityProposal(models.Model):
    """Propositions d'activités soumises par des visiteurs non connectés."""

    CATEGORY_CHOICES = Activity.CATEGORY_CHOICES

    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("under_review", "En cours d'examen"),
        ("approved", "Approuvé"),
        ("rejected", "Rejeté"),
    ]

    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(verbose_name="Description")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name="Catégorie")
    proposed_date = models.DateField(null=True, blank=True, verbose_name="Date proposée")
    proposed_time = models.TimeField(null=True, blank=True, verbose_name="Heure proposée")
    location = models.CharField(max_length=200, blank=True, verbose_name="Lieu")
    estimated_participants = models.PositiveIntegerField(default=0, verbose_name="Participants estimés")
    contact_email = models.EmailField(verbose_name="Email de contact")
    additional_info = models.TextField(blank=True, verbose_name="Infos supplémentaires")
    image_url = models.URLField(blank=True, verbose_name="URL de l'image")
    image_file = models.FileField(
        upload_to="activity_proposals/",
        null=True,
        blank=True,
        verbose_name="Fichier image"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending", verbose_name="Statut")
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name="Soumis le")
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name="Examiné le")
    reviewer_comment = models.TextField(blank=True, verbose_name="Commentaire du réviseur")
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="guest_proposals_reviewed",
        verbose_name="Examiné par"
    )

    class Meta:
        verbose_name = "Proposition d'activité invité"
        verbose_name_plural = "Propositions d'activités invités"
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class Comment(models.Model):
    """Commentaires sur les activités."""
    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name="comments",
        verbose_name="Activité"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comments",
        verbose_name="Utilisateur"
    )
    content = models.TextField(verbose_name="Contenu")
    is_approved = models.BooleanField(default=True, verbose_name="Approuvé")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Mis à jour le")

    class Meta:
        verbose_name = "Commentaire"
        verbose_name_plural = "Commentaires"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Commentaire de {self.user} sur {self.activity}"


# =====================================================
# SECTION 3: BUREAU & LEADERSHIP
# =====================================================

class BureauMember(models.Model):
    """Membres du bureau exécutif."""
    
    POSITION_CHOICES = [
        # Legacy values (kept for compatibility with existing rows)
        ("SG", "Secrétaire Général"),
        ("SGA", "Secrétaire Général Adjoint"),

        # Canonical values for the annual election workflow
        ("sg", "Secrétaire Général"),
        ("sga", "Secrétaire Général Adjoint"),
        ("tresorier", "Trésorier"),
        ("tresorier_adj", "Trésorier Adjoint"),
        ("com", "Chargé de Communication"),
        ("com_adj", "Chargé de Communication Adjoint"),
        ("commissaire", "Commissaire au Compte"),
        ("event", "Chargé des Événements"),
        ("orga", "Chargé à l'Organisation"),
        ("orga_adj", "Chargé à l'Organisation Adjoint"),
        ("sport", "Chargé des Sports"),
        ("sport_adj", "Chargé des Sports Adjoint"),
        ("culture", "Chargé de la Culture"),
        ("integration", "Chargé de l'Intégration"),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bureau_memberships",
        verbose_name="Utilisateur"
    )
    position = models.CharField(max_length=50, choices=POSITION_CHOICES, verbose_name="Poste")
    mandate_year = models.CharField(max_length=20, verbose_name="Année de mandat")
    image_url = models.URLField(blank=True, verbose_name="URL Image")
    display_order = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")
    is_current = models.BooleanField(default=True, verbose_name="Mandat actuel")

    class Meta:
        verbose_name = "Membre du Bureau"
        verbose_name_plural = "Membres du Bureau"
        ordering = ["display_order", "-mandate_year"]
        unique_together = ("user", "mandate_year")

    def __str__(self):
        return f"{self.user.full_name} - {self.get_position_display()} ({self.mandate_year})"


# =====================================================
# SECTION 4: CONTENU & RESSOURCES
# =====================================================

class ContentSection(models.Model):
    """Sections de contenu éditables (mission, vision, valeurs)."""
    
    LANGUAGE_CHOICES = [
        ("fr", "Français"),
        ("en", "English"),
    ]
    
    id = models.CharField(max_length=64, primary_key=True, verbose_name="Identifiant")
    title = models.CharField(max_length=200, verbose_name="Titre")
    content = models.TextField(verbose_name="Contenu")
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default="fr", verbose_name="Langue")
    last_updated = models.DateTimeField(auto_now=True, verbose_name="Mis à jour le")
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="content_sections_updated",
        verbose_name="Mis à jour par"
    )

    class Meta:
        verbose_name = "Section de contenu"
        verbose_name_plural = "Sections de contenu"
        ordering = ["id"]

    def __str__(self):
        return f"{self.title} ({self.language})"


class AcademicDate(models.Model):
    """Dates importantes du calendrier académique."""
    
    SEMESTER_CHOICES = [
        ("A", "Semestre A"),
        ("B", "Semestre B"),
    ]
    
    date_id = models.CharField(max_length=32, verbose_name="ID de la date")
    label = models.CharField(max_length=200, verbose_name="Libellé")
    value = models.CharField(max_length=100, verbose_name="Valeur")
    semester = models.CharField(max_length=1, choices=SEMESTER_CHOICES, verbose_name="Semestre")
    academic_year = models.CharField(max_length=20, verbose_name="Année académique")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Mis à jour le")
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="academic_dates_updated",
        verbose_name="Mis à jour par"
    )

    class Meta:
        verbose_name = "Date académique"
        verbose_name_plural = "Dates académiques"
        unique_together = ("date_id", "academic_year")
        ordering = ["semester", "date_id"]

    def __str__(self):
        return f"{self.academic_year} - {self.label}"


class Club(models.Model):
    """Clubs de l'école."""
    name = models.CharField(max_length=100, unique=True, verbose_name="Nom")
    interest = models.CharField(max_length=200, verbose_name="Centre d'intérêt")
    logo_url = models.URLField(blank=True, verbose_name="URL du logo")
    description = models.TextField(blank=True, verbose_name="Description")
    contact_email = models.EmailField(blank=True, verbose_name="Email de contact")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")

    class Meta:
        verbose_name = "Club"
        verbose_name_plural = "Clubs"
        ordering = ["name"]

    def __str__(self):
        return self.name


# =====================================================
# SECTION 5: SYSTÈME DE VOTE
# =====================================================

class BureauPosition(models.Model):
    """Référentiel des postes officiels du bureau."""

    code = models.CharField(max_length=50, unique=True, verbose_name="Code")
    title = models.CharField(max_length=200, unique=True, verbose_name="Titre")
    description = models.TextField(blank=True, verbose_name="Description")
    requires_one_year_min = models.BooleanField(
        default=False,
        verbose_name="Nécessite au moins 1 an à l'école",
    )
    display_order = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")
    is_active = models.BooleanField(default=True, verbose_name="Actif")

    class Meta:
        verbose_name = "Poste du bureau"
        verbose_name_plural = "Postes du bureau"
        ordering = ["display_order", "title"]

    def __str__(self):
        return self.title

class VoteSession(models.Model):
    """Sessions d'élection."""
    
    STATUS_CHOICES = [
        ("draft", "Brouillon"),
        ("active", "Active"),
        ("closed", "Clôturée"),
    ]
    
    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(blank=True, verbose_name="Description")
    candidacy_start_date = models.DateTimeField(null=True, blank=True, verbose_name="Début appel à candidatures")
    candidacy_end_date = models.DateTimeField(null=True, blank=True, verbose_name="Fin appel à candidatures")
    start_date = models.DateTimeField(verbose_name="Date de début")
    end_date = models.DateTimeField(verbose_name="Date de fin")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft", verbose_name="Statut")
    results_published = models.BooleanField(default=False, verbose_name="Résultats publiés")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="vote_sessions_created",
        verbose_name="Créé par"
    )

    class Meta:
        verbose_name = "Session de vote"
        verbose_name_plural = "Sessions de vote"
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

    def clean(self):
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError("La date de debut du vote doit etre avant la date de fin.")

        if self.candidacy_start_date and self.candidacy_end_date:
            if self.candidacy_start_date >= self.candidacy_end_date:
                raise ValidationError("Le debut des candidatures doit etre avant la fin des candidatures.")

            if self.start_date and self.candidacy_end_date >= self.start_date:
                raise ValidationError("La phase de candidature doit se terminer avant le debut du vote.")

        if (self.candidacy_start_date and not self.candidacy_end_date) or (
            self.candidacy_end_date and not self.candidacy_start_date
        ):
            raise ValidationError("Les deux dates de candidature doivent etre renseignees ensemble.")


class Position(models.Model):
    """Postes à pourvoir lors d'une élection."""
    vote_session = models.ForeignKey(
        VoteSession,
        on_delete=models.CASCADE,
        related_name="positions",
        verbose_name="Session de vote"
    )
    title = models.CharField(max_length=200, verbose_name="Titre du poste")
    bureau_position = models.ForeignKey(
        BureauPosition,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="session_positions",
        verbose_name="Poste du bureau",
    )
    description = models.TextField(blank=True, verbose_name="Description")
    display_order = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")

    class Meta:
        verbose_name = "Poste"
        verbose_name_plural = "Postes"
        ordering = ["display_order"]

    def __str__(self):
        return f"{self.title} - {self.vote_session}"


class Candidate(models.Model):
    """Candidatures aux élections."""
    position = models.ForeignKey(
        Position,
        on_delete=models.CASCADE,
        related_name="candidates",
        verbose_name="Poste"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="candidatures",
        verbose_name="Candidat"
    )
    motivation = models.TextField(blank=True, verbose_name="Motivation")
    program = models.TextField(blank=True, verbose_name="Programme")
    photo_url = models.URLField(blank=True, verbose_name="URL photo")
    registered_at = models.DateTimeField(auto_now_add=True, verbose_name="Inscrit le")
    is_approved = models.BooleanField(default=False, verbose_name="Approuvé")

    class Meta:
        verbose_name = "Candidat"
        verbose_name_plural = "Candidats"
        unique_together = ("position", "user")

    def __str__(self):
        return f"{self.user.full_name} pour {self.position}"
    
    @property
    def votes_count(self):
        return self.votes.count()


class Vote(models.Model):
    """Votes des électeurs."""
    vote_session = models.ForeignKey(
        VoteSession,
        on_delete=models.CASCADE,
        related_name="votes",
        verbose_name="Session de vote"
    )
    position = models.ForeignKey(
        Position,
        on_delete=models.CASCADE,
        related_name="votes",
        verbose_name="Poste"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="votes",
        verbose_name="Électeur"
    )
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name="votes",
        verbose_name="Candidat"
    )
    voted_at = models.DateTimeField(auto_now_add=True, verbose_name="Voté le")
    vote_hash = models.CharField(max_length=64, unique=True, verbose_name="Hash du vote")

    class Meta:
        verbose_name = "Vote"
        verbose_name_plural = "Votes"
        unique_together = ("vote_session", "position", "user")

    def __str__(self):
        return f"Vote de {self.user} pour {self.candidate}"


# =====================================================
# SECTION 6: COMMUNICATION
# =====================================================

class Announcement(models.Model):
    """Annonces et actualités."""
    
    PRIORITY_CHOICES = [
        ("low", "Basse"),
        ("normal", "Normale"),
        ("high", "Haute"),
        ("urgent", "Urgente"),
    ]
    
    CATEGORY_CHOICES = [
        ("general", "Général"),
        ("academic", "Académique"),
        ("event", "Événement"),
    ]
    
    title = models.CharField(max_length=200, verbose_name="Titre")
    content = models.TextField(verbose_name="Contenu")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="normal", verbose_name="Priorité")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="general", verbose_name="Catégorie")
    valid_from = models.DateTimeField(verbose_name="Valide à partir de")
    valid_until = models.DateTimeField(null=True, blank=True, verbose_name="Valide jusqu'à")
    is_published = models.BooleanField(default=True, verbose_name="Publié")
    is_pinned = models.BooleanField(default=False, verbose_name="Épinglé")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="announcements_created",
        verbose_name="Créé par"
    )

    class Meta:
        verbose_name = "Annonce"
        verbose_name_plural = "Annonces"
        ordering = ["-is_pinned", "-created_at"]

    def __str__(self):
        return self.title


class ContactMessage(models.Model):
    """Messages entre membres."""
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="messages_sent",
        verbose_name="Expéditeur"
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="messages_received",
        verbose_name="Destinataire"
    )
    subject = models.CharField(max_length=200, verbose_name="Sujet")
    message = models.TextField(verbose_name="Message")
    is_read = models.BooleanField(default=False, verbose_name="Lu")
    sent_at = models.DateTimeField(auto_now_add=True, verbose_name="Envoyé le")

    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ["-sent_at"]

    def __str__(self):
        return f"{self.sender} → {self.recipient}: {self.subject}"


class Notification(models.Model):
    """Notifications utilisateur."""
    
    TYPE_CHOICES = [
        ("activity", "Activité"),
        ("vote", "Vote"),
        ("announcement", "Annonce"),
        ("message", "Message"),
        ("system", "Système"),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name="Utilisateur"
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name="Type")
    title = models.CharField(max_length=200, verbose_name="Titre")
    message = models.TextField(verbose_name="Message")
    link_url = models.CharField(max_length=500, blank=True, verbose_name="Lien")
    is_read = models.BooleanField(default=False, verbose_name="Lu")
    read_at = models.DateTimeField(null=True, blank=True, verbose_name="Lu le")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} pour {self.user}"


# =====================================================
# SECTION 7: DOCUMENTATION
# =====================================================

class SchoolGuide(models.Model):
    """Guides pratiques pour les étudiants."""
    
    CATEGORY_CHOICES = [
        ("vie_quotidienne", "Vie quotidienne"),
        ("administratif", "Administratif"),
        ("academique", "Académique"),
    ]
    
    LANGUAGE_CHOICES = [
        ("fr", "Français"),
        ("en", "English"),
    ]
    
    title = models.CharField(max_length=200, verbose_name="Titre")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name="Catégorie")
    content = models.TextField(verbose_name="Contenu")
    url_pdf = models.URLField(blank=True, verbose_name="URL du PDF")
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default="fr", verbose_name="Langue")
    display_order = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")
    is_published = models.BooleanField(default=True, verbose_name="Publié")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="guides_created",
        verbose_name="Créé par"
    )

    class Meta:
        verbose_name = "Guide"
        verbose_name_plural = "Guides"
        ordering = ["category", "display_order"]

    def __str__(self):
        return self.title


class Document(models.Model):
    """Documents téléchargeables."""
    
    FILE_TYPE_CHOICES = [
        ("pdf", "PDF"),
        ("doc", "Word"),
        ("xlsx", "Excel"),
    ]
    
    CATEGORY_CHOICES = [
        ("formulaire", "Formulaire"),
        ("guide", "Guide"),
        ("reglement", "Règlement"),
    ]
    
    LANGUAGE_CHOICES = [
        ("fr", "Français"),
        ("en", "English"),
    ]
    
    title = models.CharField(max_length=200, verbose_name="Titre")
    file_path = models.CharField(max_length=500, verbose_name="Chemin du fichier")
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES, verbose_name="Type de fichier")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name="Catégorie")
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default="fr", verbose_name="Langue")
    file_size = models.PositiveIntegerField(default=0, verbose_name="Taille (octets)")
    is_public = models.BooleanField(default=True, verbose_name="Public")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="Uploadé le")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="documents_uploaded",
        verbose_name="Uploadé par"
    )

    class Meta:
        verbose_name = "Document"
        verbose_name_plural = "Documents"
        ordering = ["category", "title"]

    def __str__(self):
        return self.title


class FAQ(models.Model):
    """Questions fréquentes."""
    
    CATEGORY_CHOICES = [
        ("inscription", "Inscription"),
        ("vie_campus", "Vie sur le campus"),
        ("association", "Association"),
    ]
    
    LANGUAGE_CHOICES = [
        ("fr", "Français"),
        ("en", "English"),
    ]
    
    question = models.CharField(max_length=500, verbose_name="Question")
    answer = models.TextField(verbose_name="Réponse")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name="Catégorie")
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default="fr", verbose_name="Langue")
    display_order = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")
    is_published = models.BooleanField(default=True, verbose_name="Publié")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")

    class Meta:
        verbose_name = "FAQ"
        verbose_name_plural = "FAQs"
        ordering = ["category", "display_order"]

    def __str__(self):
        return self.question[:50]


# =====================================================
# SECTION 8: AUDIT & LOGS
# =====================================================

class AuditLog(models.Model):
    """Journal d'audit pour traçabilité."""
    
    ACTION_CHOICES = [
        ("create", "Création"),
        ("update", "Modification"),
        ("delete", "Suppression"),
        ("login", "Connexion"),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_logs",
        verbose_name="Utilisateur"
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name="Action")
    entity_type = models.CharField(max_length=100, verbose_name="Type d'entité")
    entity_id = models.PositiveIntegerField(null=True, blank=True, verbose_name="ID de l'entité")
    changes = models.TextField(blank=True, verbose_name="Changements")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="Adresse IP")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Horodatage")

    class Meta:
        verbose_name = "Log d'audit"
        verbose_name_plural = "Logs d'audit"
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.action} - {self.entity_type} par {self.user}"


# =====================================================
# SECTION 9: Apropos
# =====================================================

class AboutStat(models.Model):
    """Statistique affichée sur la page À propos."""
    value = models.CharField(max_length=20, verbose_name="Valeur (ex: '500+')")
    label = models.CharField(max_length=100, verbose_name="Libellé (ex: 'Lauréats')")
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")

    class Meta:
        ordering = ['order']
        verbose_name = "Statistique"
        verbose_name_plural = "Statistiques"

    def __str__(self):
        return f"{self.value} {self.label}"


class Leader(models.Model):
    """Membre du bureau (leader) pour la page À propos."""
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    position = models.CharField(max_length=200)          # ex: "Secrétaire Général"
    executive = models.CharField(max_length=200)         # ex: "Bureau Exécutif 2025-2026"
    email = models.EmailField()
    nationality = models.CharField(max_length=100)
    flag = models.CharField(max_length=10)               # emoji drapeau
    filiere = models.CharField(max_length=200)
    campus = models.CharField(max_length=100)
    mandat = models.CharField(max_length=20)             # ex: "2025-2026"
    mission = models.TextField(max_length=500)
    linkedin = models.URLField(blank=True, null=True)
    image = models.FileField(upload_to='leaders/', blank=True, null=True)
    order = models.PositiveIntegerField(default=0)       # ordre dans le carrousel
    is_active = models.BooleanField(default=True)        # afficher ou non

    class Meta:
        ordering = ['order']
        verbose_name = "Leader"
        verbose_name_plural = "Leaders"

    def __str__(self):
        return f"{self.prenom} {self.nom} - {self.position}"


class AboutContent(models.Model):
    """Contenu éditorial Mission/Vision/Valeurs (optionnel)."""
    mission = models.TextField(help_text="Texte de la mission (plusieurs paragraphes séparés par \n\n)")
    vision = models.TextField(help_text="Texte de la vision (plusieurs paragraphes séparés par \n\n)")
    valeurs = models.JSONField(default=list, help_text="Liste d'objets {title, desc}")

    class Meta:
        verbose_name = "Contenu À propos"
        verbose_name_plural = "Contenus À propos"

    def __str__(self):
        return "Contenu de la page À propos"


# =====================================================
# SECTION 10: Ecole
# =====================================================

class PracticalInfo(models.Model):
    """Card d'information pratique sur la page École."""
    title = models.CharField(max_length=100)
    description = models.CharField(max_length=300)
    link_label = models.CharField(max_length=50)   # "En savoir plus"
    link_url = models.URLField()
    color = models.CharField(max_length=7, default="#172d45")  # hex
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']
        verbose_name = "Information pratique"
        verbose_name_plural = "Informations pratiques"

    def __str__(self):
        return self.title


class SchoolMedia(models.Model):
    """Image de la grille hero sur la page École."""
    url = models.URLField()
    alt = models.CharField(max_length=200)
    position = models.PositiveSmallIntegerField(choices=[(1, "Petite 1"), (2, "Petite 2"), (3, "Grande")])

    class Meta:
        verbose_name = "Média École"
        verbose_name_plural = "Médias École"

    def __str__(self):
        return f"Image position {self.position}"


class StudentGuide(models.Model):
    """Guide étudiant PDF."""
    url = models.URLField()
    filename = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Guide étudiant"
        verbose_name_plural = "Guides étudiants"

    def __str__(self):
        return self.filename


# =====================================================
# SECTION: CLASSROOM (Classes, Matières, Ressources)
# =====================================================


class Classroom(models.Model):
    """Représente une classe / niveau / filière (ex: 'Licence 3 - Informatique')."""
    name = models.CharField(max_length=200, verbose_name="Nom de la classe")
    code = models.CharField(max_length=50, blank=True, verbose_name="Code (optionnel)")
    description = models.TextField(blank=True, verbose_name="Description")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Mis à jour le")

    class Meta:
        verbose_name = "Classe"
        verbose_name_plural = "Classes"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Semester(models.Model):
    """Semestre d'une classe (S1 ou S2)."""
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name="semesters")
    number = models.PositiveSmallIntegerField(verbose_name="Numéro du semestre")  # 1 ou 2

    class Meta:
        verbose_name = "Semestre"
        verbose_name_plural = "Semestres"
        unique_together = ("classroom", "number")
        ordering = ["number"]

    def __str__(self):
        return f"Semestre {self.number} - {self.classroom.name}"


class Subject(models.Model):
    """Une matière appartenant à un semestre."""
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name="subjects")
    title = models.CharField(max_length=200, verbose_name="Intitulé de la matière")
    code = models.CharField(max_length=50, blank=True, verbose_name="Code (optionnel)")
    description = models.TextField(blank=True, verbose_name="Description")
    display_order = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Mis à jour le")

    class Meta:
        verbose_name = "Matière"
        verbose_name_plural = "Matieres"
        ordering = ["display_order", "title"]

    def __str__(self):
        return f"{self.title} ({self.semester})"


class Resource(models.Model):
    """Ressource pédagogique liée à une matière (Cours, TD, TP, Examen)."""

    RESOURCE_TYPE_CHOICES = [
        ("link", "Lien"),
        ("drive_folder", "Drive (dossier)"),
        ("document", "Document"),
    ]

    CATEGORY_CHOICES = [
        ("cours", "Cours"),
        ("td", "TD"),
        ("tp", "TP"),
        ("examen", "Examen"),
    ]

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="resources")
    title = models.CharField(max_length=300, verbose_name="Titre")
    resource_type = models.CharField(max_length=30, choices=RESOURCE_TYPE_CHOICES, default="link")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="cours", verbose_name="Catégorie")
    url = models.CharField(max_length=1000, verbose_name="URL / lien")
    description = models.TextField(blank=True, verbose_name="Description")
    allow_preview = models.BooleanField(default=True, verbose_name="Autoriser l'aperçu")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Mis à jour le")

    class Meta:
        verbose_name = "Ressource"
        verbose_name_plural = "Ressources"
        ordering = ["category", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.subject.title})"
