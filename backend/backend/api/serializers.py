"""
Serializers Django REST Framework - Plateforme CEEAM
"""

from django.core.files.storage import default_storage
from rest_framework import serializers

from .models import (
    Country, Specialite, User, LaureatProfile, LaureatJoinRequest,
    HistoriqueEntry, CompetenceCategory, UserCompetence,
    Activity, ActivityLike, ActivityRegistration, Media, ActivityProposal, GuestActivityProposal, Comment,
    BureauMember,
    ContentSection, AcademicDate, Club,
    BureauPosition, VoteSession, Position, Candidate, Vote,
    Announcement, ContactMessage, Notification,
    SchoolGuide, Document, FAQ, AboutStat, Leader, AboutContent, PracticalInfo, SchoolMedia, StudentGuide,
    Classroom, Semester, Subject, Resource,

)


def _resolve_media_url(value: str | None) -> str:
    if not value:
        return ""
    if value.startswith("http://") or value.startswith("https://"):
        return value

    storage_name = value.lstrip("/")
    if storage_name.startswith("media/"):
        storage_name = storage_name[len("media/"):]

    try:
        return default_storage.url(storage_name)
    except Exception:
        return value


# =====================================================
# UTILISATEURS & AUTHENTIFICATION
# =====================================================

class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ["id", "name", "code_iso", "flag_emoji", "continent", "is_active"]


class SpecialiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialite
        fields = ["id", "code", "intitule", "is_active"]


class UserSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source="country.name", read_only=True)
    country_flag = serializers.CharField(source="country.flag_emoji", read_only=True)
    specialite_code = serializers.CharField(source="specialite.code", read_only=True)
    specialite_intitule = serializers.CharField(source="specialite.intitule", read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "full_name",
            "phone", "whatsapp", "country", "country_name", "country_flag",
            "promotion", "specialite", "specialite_code", "specialite_intitule",
            "role", "avatar_url", "biographie", "preferred_language", 
            "campus", "linkedin_url", "interests", "looking_for",
            "date_joined"
        ]
        read_only_fields = ["id", "date_joined"]
        extra_kwargs = {"password": {"write_only": True}}

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["avatar_url"] = _resolve_media_url(data.get("avatar_url"))
        return data


class PublicUserListSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source="country.name", read_only=True)
    country_flag = serializers.CharField(source="country.flag_emoji", read_only=True)
    specialite_intitule = serializers.CharField(source="specialite.intitule", read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "avatar_url",
            "country_name",
            "country_flag",
            "promotion",
            "specialite_intitule",
            "campus",
            "role",
            "biographie",
            "linkedin_url",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["avatar_url"] = _resolve_media_url(data.get("avatar_url"))
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer pour le profil utilisateur complet (edit profile)."""
    country_name = serializers.CharField(source="country.name", read_only=True)
    country_flag = serializers.CharField(source="country.flag_emoji", read_only=True)
    specialite_intitule = serializers.CharField(source="specialite.intitule", read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    # Alias pour compatibilité frontend (tous optionnels pour les mises à jour partielles)
    firstName = serializers.CharField(source="first_name", required=False, allow_blank=True)
    lastName = serializers.CharField(source="last_name", required=False, allow_blank=True)
    nationality = serializers.SerializerMethodField()
    language = serializers.CharField(source="preferred_language", required=False, allow_blank=True)
    field = serializers.CharField(source="specialite.intitule", read_only=True)
    # Changer URLField en CharField pour éviter les erreurs de validation URL
    linkedin = serializers.CharField(source="linkedin_url", required=False, allow_blank=True)
    photoUrl = serializers.SerializerMethodField()
    biography = serializers.CharField(source="biographie", required=False, allow_blank=True)
    lookingFor = serializers.ListField(source="looking_for", child=serializers.CharField(), required=False, default=list)
    
    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "full_name",
            "firstName", "lastName",
            "phone", "country", "country_name", "country_flag", "nationality",
            "promotion", "specialite", "specialite_intitule", "field",
            "avatar_url", "photoUrl", "biographie", "biography",
            "preferred_language", "language",
            "campus", "linkedin_url", "linkedin",
            "interests", "looking_for", "lookingFor",
            "date_joined"
        ]
        read_only_fields = ["id", "date_joined", "email"]
        extra_kwargs = {
            'phone': {'required': False, 'allow_blank': True},
            'promotion': {'required': False, 'allow_blank': True},
            'campus': {'required': False, 'allow_blank': True},
            'interests': {'required': False},
        }
    
    def get_nationality(self, obj):
        """Retourne la nationalité avec le drapeau emoji."""
        if obj.country:
            return f"{obj.country.flag_emoji} {obj.country.name}"
        return ""
    
    def get_photoUrl(self, obj):
        """Retourne l'URL de la photo de profil via le storage configuré."""
        return _resolve_media_url(obj.avatar_url)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["avatar_url"] = _resolve_media_url(data.get("avatar_url"))
        return data
    
    def validate_language(self, value):
        """Convertit la valeur affichée de la langue en code."""
        if not value:
            return "fr"
        # Convertir les valeurs affichées en codes
        if "Français" in value or "français" in value.lower():
            return "fr"
        elif "English" in value or "english" in value.lower():
            return "en"
        # Si c'est déjà un code valide
        elif value in ["fr", "en"]:
            return value
        return "fr"  # Valeur par défaut
    
    def update(self, instance, validated_data):
        """Met à jour le profil utilisateur."""
        # Extraire les champs imbriqués
        if "first_name" in validated_data:
            instance.first_name = validated_data.pop("first_name")
        if "last_name" in validated_data:
            instance.last_name = validated_data.pop("last_name")
        if "preferred_language" in validated_data:
            instance.preferred_language = validated_data.pop("preferred_language")
        if "linkedin_url" in validated_data:
            instance.linkedin_url = validated_data.pop("linkedin_url")
        if "biographie" in validated_data:
            instance.biographie = validated_data.pop("biographie")
        if "looking_for" in validated_data:
            instance.looking_for = validated_data.pop("looking_for")
        
        # Mettre à jour les autres champs
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'utilisateur (inscription)."""
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            "email", "password", "first_name", "last_name",
            "phone", "whatsapp", "country", "promotion", "specialite"
        ]
    
    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data["username"] = validated_data["email"]
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LaureatProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    work_country_name = serializers.CharField(source="work_country.name", read_only=True)
    
    class Meta:
        model = LaureatProfile
        fields = [
            "id", "user", "current_position", "company",
            "work_country", "work_country_name", "work_city",
            "professional_email", "linkedin_url", "work_domain", "citation",
            "biographie_pro", "is_public", "available_for_mentoring", "mentorship_areas",
            "created_at", "updated_at"
        ]


class LaureatJoinRequestSerializer(serializers.ModelSerializer):
    nom = serializers.CharField(required=False, allow_blank=True, max_length=100)
    promotion = serializers.CharField(required=False, allow_blank=True, max_length=20)
    specialite = serializers.CharField(required=False, allow_blank=True, max_length=200)
    poste = serializers.CharField(required=False, allow_blank=True, max_length=150)
    entreprise = serializers.CharField(required=False, allow_blank=True, max_length=150)
    ville = serializers.CharField(required=False, allow_blank=True, max_length=100)
    pays = serializers.CharField(required=False, allow_blank=True, max_length=100)
    contact = serializers.EmailField(required=False, allow_blank=True)

    class Meta:
        model = LaureatJoinRequest
        fields = [
            "id", "nom", "promotion", "specialite", "poste", "entreprise",
            "ville", "pays", "contact", "status", "submitted_at"
        ]
        read_only_fields = ["id", "status", "submitted_at"]

    def validate_promotion(self, value):
        cleaned = value.strip()
        return cleaned

    def validate_specialite(self, value):
        cleaned = value.strip()
        return cleaned

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        if user and user.is_authenticated:
            full_name = f"{(user.first_name or '').strip()} {(user.last_name or '').strip()}".strip()
            user_specialite = ''
            if getattr(user, 'specialite', None):
                user_specialite = (user.specialite.intitule or '').strip()

            attrs['nom'] = (attrs.get('nom') or '').strip() or full_name
            attrs['promotion'] = (attrs.get('promotion') or '').strip() or (user.promotion or '').strip()
            attrs['specialite'] = (attrs.get('specialite') or '').strip() or user_specialite
            attrs['contact'] = (attrs.get('contact') or '').strip() or (user.email or '').strip()
        else:
            attrs['nom'] = (attrs.get('nom') or '').strip()
            attrs['promotion'] = (attrs.get('promotion') or '').strip()
            attrs['specialite'] = (attrs.get('specialite') or '').strip()
            attrs['contact'] = (attrs.get('contact') or '').strip()

        attrs['poste'] = (attrs.get('poste') or '').strip()
        attrs['entreprise'] = (attrs.get('entreprise') or '').strip()
        attrs['ville'] = (attrs.get('ville') or '').strip()
        attrs['pays'] = (attrs.get('pays') or '').strip()

        if not attrs.get('nom'):
            raise serializers.ValidationError({'nom': "Le nom est requis ou doit exister dans le profil."})

        if not attrs.get('contact'):
            raise serializers.ValidationError({'contact': "Un email de contact est requis."})

        return attrs


class LaureatJoinRequestAdminSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = LaureatJoinRequest
        fields = [
            "id", "user_id", "user_email", "nom", "promotion", "specialite", "poste",
            "entreprise", "ville", "pays", "contact", "status", "submitted_at"
        ]


class LaureatJoinRequestStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["approved", "rejected"])


# =====================================================
# HISTORIQUE & COMPÉTENCES (Modèles relationnels)
# =====================================================

class HistoriqueEntrySerializer(serializers.ModelSerializer):
    """Serializer pour les entrées d'historique académique/professionnel."""
    
    entry_type_display = serializers.CharField(source="get_entry_type_display", read_only=True)
    
    class Meta:
        model = HistoriqueEntry
        fields = [
            "id", "entry_type", "entry_type_display",
            "title", "organization", "location",
            "start_date", "end_date", "is_current",
            "description", "order",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
    
    def validate(self, data):
        """Validation personnalisée."""
        # Si is_current est True, end_date doit être null
        if data.get("is_current") and data.get("end_date"):
            raise serializers.ValidationError({
                "end_date": "La date de fin ne doit pas être renseignée si l'expérience est en cours."
            })
        # Si is_current est False, end_date devrait être renseignée (warning, pas erreur)
        return data
    
    def to_representation(self, instance):
        """Transforme les données en camelCase pour le frontend."""
        data = super().to_representation(instance)
        return {
            'id': data.get('id'),
            'entryType': data.get('entry_type'),
            'typeDisplay': data.get('entry_type_display'),
            'title': data.get('title'),
            'organization': data.get('organization'),
            'location': data.get('location'),
            'startDate': data.get('start_date'),
            'endDate': data.get('end_date'),
            'isCurrent': data.get('is_current'),
            'description': data.get('description'),
            'order': data.get('order'),
        }


class CompetenceCategorySerializer(serializers.ModelSerializer):
    """Serializer pour les catégories de compétences."""
    
    competences_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CompetenceCategory
        fields = ["id", "name", "slug", "icon", "is_predefined", "order", "competences_count"]
        read_only_fields = ["id", "slug", "created_at"]
    
    def get_competences_count(self, obj):
        """Retourne le nombre de compétences dans cette catégorie pour le lauréat courant."""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            try:
                laureat_profile = request.user.laureat_profile
                return obj.competences.filter(laureat=laureat_profile).count()
            except LaureatProfile.DoesNotExist:
                pass
        return 0


class UserCompetenceSerializer(serializers.ModelSerializer):
    """Serializer pour les compétences utilisateur."""
    
    category_name = serializers.CharField(source="category.name", read_only=True)
    level_display = serializers.CharField(source="get_level_display", read_only=True)
    
    class Meta:
        model = UserCompetence
        fields = [
            "id", "category", "category_name",
            "name", "level", "level_display",
            "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class UserCompetenceCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de compétences utilisateur."""
    
    category_name = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = UserCompetence
        fields = ["id", "category", "category_name", "name", "level"]
    
    def validate(self, data):
        """Validation et création automatique de catégorie si nécessaire."""
        # Si category_name est fourni et pas de category, créer la catégorie
        category_name = data.pop("category_name", None)
        if category_name and "category" not in data:
            from django.utils.text import slugify
            category, created = CompetenceCategory.objects.get_or_create(
                slug=slugify(category_name),
                defaults={
                    "name": category_name,
                    "is_predefined": False
                }
            )
            data["category"] = category
        return data
    
    def create(self, validated_data):
        """Crée la compétence liée au lauréat."""
        request = self.context.get('request')
        if request and hasattr(request.user, 'laureat_profile'):
            validated_data['laureat'] = request.user.laureat_profile
        return super().create(validated_data)


class LaureatHistoriqueCompetencesSerializer(serializers.Serializer):
    """Serializer pour récupérer l'historique et les compétences d'un lauréat."""
    
    historique = HistoriqueEntrySerializer(many=True, source="historique_entries")
    competences = serializers.SerializerMethodField()
    
    def get_competences(self, obj):
        """Retourne les compétences groupées par catégorie."""
        competences_by_category = {}
        for comp in obj.user_competences.select_related('category').all():
            cat_name = comp.category.name
            if cat_name not in competences_by_category:
                competences_by_category[cat_name] = {
                    "category_id": comp.category.id,
                    "category_name": cat_name,
                    "category_icon": comp.category.icon,
                    "competences": []
                }
            competences_by_category[cat_name]["competences"].append({
                "id": comp.id,
                "name": comp.name,
                "level": comp.level,
                "level_display": comp.get_level_display() if comp.level else None
            })
        return list(competences_by_category.values())


class LaureatFullProfileSerializer(serializers.Serializer):
    """Serializer complet pour le profil lauréat (lecture consulter/édition)."""
    
    # Identité
    id = serializers.UUIDField(source="user.id", read_only=True)
    firstName = serializers.CharField(source="user.first_name")
    lastName = serializers.CharField(source="user.last_name")
    email = serializers.EmailField(source="user.email", read_only=True)
    phone = serializers.CharField(source="user.phone")
    nationality = serializers.SerializerMethodField()
    preferredLanguage = serializers.CharField(source="user.preferred_language")
    biography = serializers.CharField(source="user.biographie", allow_blank=True)
    
    # Académique
    promotion = serializers.CharField(source="user.promotion")
    field = serializers.SerializerMethodField()
    campus = serializers.CharField(source="user.campus", allow_blank=True)
    linkedin = serializers.URLField(source="user.linkedin_url", allow_blank=True)
    profileImage = serializers.URLField(source="user.avatar_url", allow_blank=True)
    
    # Intérêts
    interests = serializers.ListField(source="user.interests", child=serializers.CharField())
    searches = serializers.ListField(source="user.looking_for", child=serializers.CharField())
    # Ajouter ces deux lignes dans LaureatFullProfileSerializer 
    specialite = serializers.PrimaryKeyRelatedField( source='user.specialite', queryset=Specialite.objects.all(), required=False, allow_null=True )
    country = serializers.PrimaryKeyRelatedField( source='user.country', queryset=Country.objects.all(), required=False, allow_null=True )
    
    # Mentorat
    isMentorAvailable = serializers.BooleanField(source="available_for_mentoring")
    isProfilePublic = serializers.BooleanField(source="is_public")
    mentorshipAreas = serializers.ListField(source="mentorship_areas", child=serializers.CharField())
    
    # Historique et compétences (récupérés depuis les modèles relationnels)
    historique = serializers.SerializerMethodField()
    competences = serializers.SerializerMethodField()
    
    # Infos professionnelles (écriture)
    jobTitle = serializers.CharField(source="current_position", required=False, allow_blank=True)
    jobCompany = serializers.CharField(source="company", required=False, allow_blank=True)
    jobCity = serializers.CharField(source="work_city", required=False, allow_blank=True)
    jobEmail = serializers.EmailField(source="professional_email", required=False, allow_blank=True)
    jobDomain = serializers.CharField(source="work_domain", required=False, allow_blank=True)
    
    # Métadonnées
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    
    # Infos professionnelles (lecture)
    job = serializers.SerializerMethodField()
    
    def get_nationality(self, obj):
        if obj.user.country:
            return f"{obj.user.country.flag_emoji} {obj.user.country.name}"
        return ""
    
    def get_field(self, obj):
        if obj.user.specialite:
            return obj.user.specialite.intitule
        return ""
    
    def get_job(self, obj):
        return {
            "title": obj.current_position,
            "company": obj.company,
            "location": f"{obj.work_city}, {obj.work_country.name}" if obj.work_country else obj.work_city,
            "email": obj.professional_email,
            "domain": obj.work_domain
        }
    
    def get_historique(self, obj):
        """Récupère l'historique depuis les modèles relationnels."""
        entries = obj.historique_entries.all().order_by('-start_date')
        return [
            {
                "id": entry.id,
                "entryType": entry.entry_type,
                "typeDisplay": entry.get_entry_type_display(),
                "title": entry.title,
                "organization": entry.organization,
                "location": entry.location,
                "startDate": entry.start_date.isoformat() if entry.start_date else None,
                "endDate": entry.end_date.isoformat() if entry.end_date else None,
                "isCurrent": entry.is_current,
                "description": entry.description,
            }
            for entry in entries
        ]
    
    def get_competences(self, obj):
        """Récupère les compétences groupées par catégorie."""
        competences_by_category = {}
        for comp in obj.user_competences.select_related('category').all():
            cat_name = comp.category.name
            if cat_name not in competences_by_category:
                competences_by_category[cat_name] = {
                    "categoryId": comp.category.id,
                    "categorie": cat_name,
                    "icon": comp.category.icon,
                    "competences": []
                }
            competences_by_category[cat_name]["competences"].append({
                "id": comp.id,
                "name": comp.name,
                "level": comp.level,
                "levelDisplay": comp.get_level_display() if comp.level else None
            })
        return list(competences_by_category.values())
    
    def update(self, instance, validated_data):
        """Met à jour le profil lauréat et utilisateur associé."""
        user_data = validated_data.pop("user", {})
        
        # Mettre à jour l'utilisateur
        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()
        
        # Mettre à jour le profil lauréat
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance

    def to_representation(self, instance):
        """Résout les URLs de médias (S3 et locales) avant serialization."""
        data = super().to_representation(instance)
        if data.get('profileImage'):
            data['profileImage'] = _resolve_media_url(data['profileImage'])
        return data


class LaureatViewProfileSerializer(serializers.Serializer):
    id = serializers.UUIDField(source="user.id", read_only=True)
    fullName = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    promotion = serializers.CharField(source="user.promotion")
    field = serializers.SerializerMethodField()
    campus = serializers.CharField(source="user.campus")
    nationality = serializers.SerializerMethodField()
    memberSince = serializers.SerializerMethodField()
    bio = serializers.CharField(source="user.biographie")

    # Statistiques
    stats = serializers.SerializerMethodField()

    # Mentorat
    mentorship = serializers.SerializerMethodField()

    # Expérience professionnelle
    experience = serializers.SerializerMethodField()

    # Informations personnelles
    personalInfo = serializers.SerializerMethodField()

    # Informations académiques
    academicInfo = serializers.SerializerMethodField()

    # Historique et compétences
    historique = serializers.SerializerMethodField()
    competences = serializers.SerializerMethodField()

    def get_fullName(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

    def get_initials(self, obj):
        return f"{obj.user.first_name[0]}{obj.user.last_name[0]}".upper()

    def get_role(self, obj):
        return "Lauréat"

    def get_status(self, obj):
        return "Actif"

    def get_field(self, obj):
        return obj.user.specialite.intitule if obj.user.specialite else ""

    def get_nationality(self, obj):
        if obj.user.country:
            return f"{obj.user.country.flag_emoji} {obj.user.country.name}"
        return ""

    def get_memberSince(self, obj):
        from django.utils import formats
        return formats.date_format(obj.created_at, "M Y")

    def get_stats(self, obj):
        return {
            "activities": obj.user.activity_registrations.count(),
            "votes": obj.user.votes.count(),
            "connections": 0,   # à implémenter plus tard
            "contributions": 0, # à implémenter plus tard
        }

    def get_mentorship(self, obj):
        return {
            "isAvailable": obj.available_for_mentoring,
            "areas": obj.mentorship_areas or [],           # ← AJOUTER
            "message": "Je suis disponible pour aider les étudiants actuels" if obj.available_for_mentoring else "Non disponible pour le moment",
            "status": "Disponible pour mentorat" if obj.available_for_mentoring else "Non disponible"
    }

    def get_experience(self, obj):
        return {
            "title": obj.current_position,
            "company": obj.company,
            "location": f"{obj.work_city}, {obj.work_country.name}" if obj.work_country else obj.work_city,
            "professionalEmail": obj.professional_email,
            "domain": obj.work_domain,
        }

    def get_personalInfo(self, obj):
        return {
            "email": obj.user.email,
            "phone": obj.user.phone,
            "whatsapp": obj.user.whatsapp or "",          # ← AJOUTER
            "nationality": f"{obj.user.country.flag_emoji} {obj.user.country.name}" if obj.user.country else "",
            "nationalityWithFlag": f"{obj.user.country.flag_emoji} {obj.user.country.name}" if obj.user.country else "",  # ← AJOUTER
            "preferredLanguage": "Français" if obj.user.preferred_language == "fr" else "English"
    }

    def get_academicInfo(self, obj):
        return {
            "promotion": obj.user.promotion,
            "field": obj.user.specialite.intitule if obj.user.specialite else "",
            "campus": obj.user.campus,
            "linkedin": obj.user.linkedin_url
        }

    def get_historique(self, obj):
        entries = obj.historique_entries.all().order_by('-start_date')
        return [
            {
                "id": entry.id,
                "entryType": entry.entry_type,
                "title": entry.title,
                "organization": entry.organization,
                "location": entry.location,
                "startDate": entry.start_date.isoformat(),
                "endDate": entry.end_date.isoformat() if entry.end_date else None,
                "isCurrent": entry.is_current,
                "description": entry.description,
            }
            for entry in entries
        ]

    def get_competences(self, obj):
        competences_by_category = {}
        for comp in obj.user_competences.select_related('category').all():
            cat_name = comp.category.name
            if cat_name not in competences_by_category:
                competences_by_category[cat_name] = {
                    "categoryId": comp.category.id,
                    "categorie": cat_name,
                    "icon": comp.category.icon,
                    "competences": []
                }
            competences_by_category[cat_name]["competences"].append({
                "id": comp.id,
                "name": comp.name,
                "level": comp.level,
                "levelDisplay": comp.get_level_display() if comp.level else None
            })
        return list(competences_by_category.values())

# =====================================================
# ACTIVITÉS & INTERACTIONS
# =====================================================

class ActivitySerializer(serializers.ModelSerializer):
    """Sérialise les activités."""
    likes_count = serializers.IntegerField(read_only=True)
    registrations_count = serializers.IntegerField(read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    user_liked = serializers.SerializerMethodField()
    user_registered = serializers.SerializerMethodField()
    
    # Alias pour compatibilité frontend
    imageUrl = serializers.URLField(source="image_url", required=False, allow_blank=True)
    likesCount = serializers.IntegerField(source="likes_count", read_only=True)
    upcoming = serializers.BooleanField(source="is_upcoming", required=False)
    
    class Meta:
        model = Activity
        fields = [
            "id", "title", "description", "long_description",
            "category", "image_url", "imageUrl",
            "event_date", "event_time", "location", "duration",
            "max_participants", "registration_deadline",
            "organizer_name", "organizer_avatar", "tags",
            "is_upcoming", "upcoming", "is_published",
            "likes_count", "likesCount", "registrations_count",
            "user_liked", "user_registered",
            "created_at", "updated_at", "created_by", "created_by_name"
        ]
        read_only_fields = ["id", "created_at", "updated_at", "likes_count", "registrations_count"]

    def get_user_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_user_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.registrations.filter(user=request.user).exclude(status='cancelled').exists()
        return False


class ActivityLikeSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    
    class Meta:
        model = ActivityLike
        fields = ["id", "activity", "user", "user_name", "created_at"]
        read_only_fields = ["id", "created_at"]


class ActivityRegistrationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    activity_title = serializers.CharField(source="activity.title", read_only=True)
    
    class Meta:
        model = ActivityRegistration
        fields = [
            "id", "activity", "activity_title", "user", "user_name",
            "nom_complet", "email", "telephone", "niveau_etude",
            "status", "registered_at", "confirmed_at", "cancellation_reason"
        ]
        read_only_fields = ["id", "registered_at"]


class ActivityRegistrationPayloadSerializer(serializers.Serializer):
    """Valide le payload d'inscription de la page InscriptionActivite."""

    STUDY_LEVEL_CHOICES = [
        "Bac",
        "Bac+2",
        "Bac+3 (Licence)",
        "Bac+5 (Master)",
        "Doctorat",
        "Autre",
    ]

    nomComplet = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    telephone = serializers.CharField(max_length=20)
    niveauEtude = serializers.ChoiceField(choices=STUDY_LEVEL_CHOICES)


class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ["id", "activity", "file_path", "media_type", "caption", "display_order", "uploaded_at"]


class ActivityProposalSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.full_name", read_only=True)
    image_file_url = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = ActivityProposal
        fields = [
            "id", "title", "description", "category",
            "proposed_date", "proposed_time", "location",
            "estimated_participants", "contact_email", "additional_info",
            "image_url", "image_file", "image_file_url", "status", "submitted_at",
            "reviewed_at", "reviewer_comment", "reviewed_by", "reviewed_by_name",
            "created_by", "created_by_name"
        ]
        read_only_fields = ["id", "submitted_at", "reviewed_at"]

    def get_image_file_url(self, obj):
        if not obj.image_file:
            return ""
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image_file.url)
        return obj.image_file.url


class GuestActivityProposalSerializer(serializers.ModelSerializer):
    reviewed_by_name = serializers.CharField(source="reviewed_by.full_name", read_only=True)
    image_file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = GuestActivityProposal
        fields = [
            "id", "title", "description", "category",
            "proposed_date", "proposed_time", "location",
            "estimated_participants", "contact_email", "additional_info",
            "image_url", "image_file", "image_file_url", "status", "submitted_at",
            "reviewed_at", "reviewer_comment", "reviewed_by", "reviewed_by_name",
        ]
        read_only_fields = ["id", "submitted_at", "reviewed_at"]

    def get_image_file_url(self, obj):
        if not obj.image_file:
            return ""
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image_file.url)
        return obj.image_file.url


class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    
    class Meta:
        model = Comment
        fields = ["id", "activity", "user", "user_name", "content", "is_approved", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


# =====================================================
# BUREAU & LEADERSHIP
# =====================================================

class BureauMemberSerializer(serializers.ModelSerializer):
    """Sérialise les membres du bureau."""
    user = UserSerializer(read_only=True)
    position_display = serializers.CharField(source="get_position_display", read_only=True)
    
    # Alias pour compatibilité frontend (ancien format Leader)
    nom = serializers.CharField(source="user.last_name", read_only=True)
    prenom = serializers.CharField(source="user.first_name", read_only=True)
    bureau = serializers.CharField(source="get_position_display", read_only=True)
    annee = serializers.CharField(source="mandate_year", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    nationalite = serializers.CharField(source="user.country.name", read_only=True)
    paysCode = serializers.CharField(source="user.country.code_iso", read_only=True)
    imageUrl = serializers.URLField(source="image_url", read_only=True)
    filiere = serializers.CharField(source="user.specialite", read_only=True)
    
    class Meta:
        model = BureauMember
        fields = [
            "id", "user", "position", "position_display",
            "mandate_year", "image_url", "display_order", "is_current",
            # Alias compatibilité
            "nom", "prenom", "bureau", "annee", "email", "nationalite", "paysCode", "imageUrl", "filiere"
        ]


# =====================================================
# CONTENU & RESSOURCES
# =====================================================

class ContentSectionSerializer(serializers.ModelSerializer):
    """Sérialise les sections de contenu."""
    # Alias pour compatibilité
    key = serializers.CharField(source="id", read_only=True)
    
    class Meta:
        model = ContentSection
        fields = ["id", "key", "title", "content", "language", "last_updated"]


class AcademicDateSerializer(serializers.ModelSerializer):
    """Sérialise les dates académiques."""
    # Alias pour compatibilité frontend
    id_alias = serializers.CharField(source="date_id", read_only=True)
    academicYear = serializers.CharField(source="academic_year", read_only=True)
    
    class Meta:
        model = AcademicDate
        fields = [
            "date_id", "id_alias", "label", "value",
            "semester", "academic_year", "academicYear", "updated_at"
        ]


class ClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ["id", "name", "interest", "logo_url", "description", "contact_email", "is_active"]


# =====================================================
# SYSTÈME DE VOTE
# =====================================================

class VoteSessionSerializer(serializers.ModelSerializer):
    positions_count = serializers.IntegerField(source="positions.count", read_only=True)
    
    class Meta:
        model = VoteSession
        fields = [
            "id", "title", "description", "candidacy_start_date", "candidacy_end_date", "start_date", "end_date",
            "status", "results_published", "positions_count", "created_at"
        ]


class BureauPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BureauPosition
        fields = [
            "id",
            "code",
            "title",
            "description",
            "requires_one_year_min",
            "display_order",
            "is_active",
        ]


class PositionSerializer(serializers.ModelSerializer):
    candidates_count = serializers.IntegerField(source="candidates.count", read_only=True)
    bureau_position_code = serializers.CharField(source="bureau_position.code", read_only=True)
    requires_one_year_min = serializers.BooleanField(source="bureau_position.requires_one_year_min", read_only=True)
    
    class Meta:
        model = Position
        fields = [
            "id",
            "vote_session",
            "bureau_position",
            "bureau_position_code",
            "title",
            "description",
            "display_order",
            "requires_one_year_min",
            "candidates_count",
        ]


class CandidateSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    votes_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Candidate
        fields = [
            "id", "position", "user", "motivation", "program",
            "photo_url", "registered_at", "is_approved", "votes_count"
        ]


class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ["id", "vote_session", "position", "candidate", "voted_at"]
        read_only_fields = ["id", "voted_at", "vote_hash"]


# =====================================================
# COMMUNICATION
# =====================================================

class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    temps_relatif = serializers.SerializerMethodField()
    
    class Meta:
        model = Announcement
        fields = [
            "id", "title", "content", "priority", "category",
            "valid_from", "valid_until", "is_published", "is_pinned",
            "created_at", "created_by", "created_by_name", "temps_relatif"
        ]
    
    def get_temps_relatif(self, obj):
        """Retourne le temps relatif depuis la création."""
        from django.utils import timezone
        from datetime import timedelta
        
        delta = timezone.now() - obj.created_at
        
        if delta < timedelta(minutes=1):
            return "À l'instant"
        elif delta < timedelta(hours=1):
            minutes = int(delta.total_seconds() / 60)
            return f"Il y a {minutes}min"
        elif delta < timedelta(days=1):
            hours = int(delta.total_seconds() / 3600)
            return f"Il y a {hours}h"
        elif delta < timedelta(days=7):
            days = delta.days
            return f"Il y a {days}j"
        else:
            return obj.created_at.strftime("%d/%m/%Y")


class ContactMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)
    recipient_name = serializers.CharField(source="recipient.full_name", read_only=True)
    
    class Meta:
        model = ContactMessage
        fields = [
            "id", "sender", "sender_name", "recipient", "recipient_name",
            "subject", "message", "is_read", "sent_at"
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "user", "type", "title", "message", "link_url", "is_read", "read_at", "created_at"]


# =====================================================
# DOCUMENTATION
# =====================================================

class SchoolGuideSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolGuide
        fields = ["id", "title", "category", "content", "url_pdf", "language", "display_order", "is_published"]


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["id", "title", "file_path", "file_type", "category", "language", "file_size", "is_public", "uploaded_at"]


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ["id", "question", "answer", "category", "language", "display_order", "is_published"]


# =====================================================
# AUTHENTIFICATION JWT (nouveaux serializers)
# =====================================================

class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer pour l'inscription d'un nouvel utilisateur.
    
    Fonctionnalités:
    - Validation de l'unicité de l'email
    - Confirmation du mot de passe
    - Hash sécurisé avec set_password()
    - Validation des mots de passe avec les validators Django
    """
    # Note: imports moved inside the validate() method to avoid conflict with DRF's validate_<field> pattern
    
    # Champs supplémentaires non présents dans le modèle
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text="Mot de passe (min 8 caractères)"
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text="Confirmation du mot de passe"
    )
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'password',
            'password_confirm',
            'phone',
            'whatsapp',
            'country',
            'promotion',
            'specialite',
            'preferred_language'
        ]
        extra_kwargs = {
            'email': {
                'required': True,
                'validators': [],  # Désactiver les validateurs auto pour utiliser validate_email
            },
            'username': {'required': False, 'allow_blank': True, 'validators': []},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
        read_only_fields = ['id']
    
    def validate_email(self, value):
        """Vérifier que l'email est unique."""
        normalized_email = value.lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError(
                "Un utilisateur avec cet email existe déjà."
            )
        return normalized_email
    
    def validate_username(self, value):
        """Vérifier que le username est unique."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "Ce nom d'utilisateur est déjà pris."
            )
        return value
    
    def validate(self, attrs):
        """Validation globale: mots de passe doivent correspondre."""
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        if password != password_confirm:
            raise serializers.ValidationError({
                'password_confirm': "Les mots de passe ne correspondent pas."
            })
        
        try:
            user = User(
                email=attrs.get('email'),
                username=attrs.get('username'),
                first_name=attrs.get('first_name'),
                last_name=attrs.get('last_name')
            )
            validate_password(password, user=user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                'password': list(e.messages)
            })
        
        return attrs
    
    def create(self, validated_data):
        """Créer un nouvel utilisateur avec un mot de passe hashé."""
        import uuid
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Générer un username unique si non fourni
        if not validated_data.get('username'):
            email_prefix = validated_data['email'].split('@')[0]
            unique_suffix = uuid.uuid4().hex[:8]
            validated_data['username'] = f"{email_prefix}_{unique_suffix}"
        
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer pour la connexion avec email et password."""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    rememberMe = serializers.BooleanField(required=False, default=False)


class LogoutSerializer(serializers.Serializer):
    """Serializer pour la déconnexion (token vient du cookie)."""
    pass


class EmailVerificationSerializer(serializers.Serializer):
    """Serializer pour vérifier l'email avec un token."""
    
    token = serializers.CharField(
        required=True,
        help_text="Token de vérification envoyé par email"
    )
    
    def validate_token(self, value):
        if not value or len(value) < 10:
            raise serializers.ValidationError(
                "Token invalide ou manquant."
            )
        return value


class ResendVerificationEmailSerializer(serializers.Serializer):
    """Serializer pour demander un nouveau email de vérification."""
    
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        try:
            user = User.objects.get(email__iexact=value.lower())
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Un email de vérification sera envoyé si cet email existe."
            )
        
        if user.email_verified:
            raise serializers.ValidationError(
                "Cet email est déjà vérifié."
            )
        
        return value.lower()


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer pour demander une réinitialisation du mot de passe."""
    
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer pour confirmer la réinitialisation du mot de passe."""
    
    token = serializers.CharField(
        required=True,
        help_text="Token de réinitialisation envoyé par email"
    )
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text="Nouveau mot de passe (min 8 caractères)"
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text="Confirmation du nouveau mot de passe"
    )
    
    def validate(self, attrs):
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        
        new_password = attrs.get('new_password')
        password_confirm = attrs.get('password_confirm')
        
        if new_password != password_confirm:
            raise serializers.ValidationError({
                'password_confirm': "Les mots de passe ne correspondent pas."
            })
        
        try:
            temp_user = User()
            validate_password(new_password, user=temp_user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                'new_password': list(e.messages)
            })
        
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer pour changer le mot de passe (utilisateur authentifié)."""
    
    old_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text="Mot de passe actuel"
    )
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text="Nouveau mot de passe (min 8 caractères)"
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text="Confirmation du nouveau mot de passe"
    )
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                "L'ancien mot de passe est incorrect."
            )
        return value
    
    def validate(self, attrs):
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        
        new_password = attrs.get('new_password')
        password_confirm = attrs.get('password_confirm')
        
        if new_password != password_confirm:
            raise serializers.ValidationError({
                'password_confirm': "Les mots de passe ne correspondent pas."
            })
        
        try:
            user = self.context['request'].user
            validate_password(new_password, user=user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                'new_password': list(e.messages)
            })
        
        return attrs

#=================================================

class LaureatDetailSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='user.id')
    fullName = serializers.SerializerMethodField()
    profileImage = serializers.SerializerMethodField()
    quote = serializers.CharField(source='citation', allow_null=True)
    promotion = serializers.CharField(source='user.promotion')
    currentTitle = serializers.CharField(source='current_position', allow_null=True)
    currentCompany = serializers.CharField(source='company', allow_null=True)
    location = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email')
    phone = serializers.CharField(source='user.phone', allow_blank=True)
    nationality = serializers.SerializerMethodField()
    linkedin = serializers.CharField(source='user.linkedin_url', allow_blank=True)
    biography = serializers.CharField(source='user.biographie', allow_blank=True)
    competences = serializers.SerializerMethodField()
    academicData = serializers.SerializerMethodField()
    experienceData = serializers.SerializerMethodField()

    def get_fullName(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

    def get_profileImage(self, obj):
        if obj.user.avatar_url:
            return _resolve_media_url(obj.user.avatar_url)
        return None

    def get_location(self, obj):
        if obj.work_city and obj.work_country:
            return f"{obj.work_city}, {obj.work_country.name}"
        elif obj.work_city:
            return obj.work_city
        elif obj.work_country:
            return obj.work_country.name
        return None

    def get_nationality(self, obj):
        if obj.user.country:
            return f"{obj.user.country.flag_emoji} {obj.user.country.name}"
        return ""

    def get_competences(self, obj):
        competences_by_category = {}
        for comp in obj.user_competences.select_related('category').all():
            cat_name = comp.category.name
            if cat_name not in competences_by_category:
                competences_by_category[cat_name] = {
                    "categoryId": comp.category.id,
                    "categorie": cat_name,
                    "icon": comp.category.icon,
                    "competences": []
                }
            competences_by_category[cat_name]["competences"].append({
                "id": comp.id,
                "name": comp.name,
                "level": comp.level,
                "levelDisplay": comp.get_level_display() if comp.level else None
            })
        return list(competences_by_category.values())

    def _format_period(self, entry):
        start = entry.start_date.strftime('%Y-%m-%d') if entry.start_date else ''
        if entry.is_current:
            return f"{start} – Présent"
        if entry.end_date:
            end = entry.end_date.strftime('%Y-%m-%d')
            return f"{start} – {end}"
        return start

    def get_academicData(self, obj):
        entries = obj.historique_entries.filter(entry_type='academic').order_by('-start_date')
        return [
            {
                'title': entry.title,
                'subtitle': entry.organization,
                'badges': [],
                'year': self._format_period(entry)
            }
            for entry in entries
        ]

    def get_experienceData(self, obj):
        entries = obj.historique_entries.filter(entry_type='professional').order_by('-start_date')
        return [
            {
                'title': entry.title,
                'company': entry.organization,
                'description': entry.description,
                'badges': [],
                'year': self._format_period(entry)
            }
            for entry in entries
        ]

#=======================================================

# À propos
class AboutStatSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutStat
        fields = ['value', 'label']


class LeaderSerializer(serializers.ModelSerializer):
    position   = serializers.CharField(required=False, allow_blank=True, default='Secrétaire Général')
    executive  = serializers.CharField(required=False, allow_blank=True, default='')
    email      = serializers.EmailField(required=False, allow_blank=True, default='')
    nationality = serializers.CharField(required=False, allow_blank=True, default='')
    flag       = serializers.CharField(required=False, allow_blank=True, default='')
    filiere    = serializers.CharField(required=False, allow_blank=True, default='')
    campus     = serializers.CharField(required=False, allow_blank=True, default='')
    mission    = serializers.CharField(required=False, allow_blank=True, default='')
    image      = serializers.FileField(required=False, allow_null=True, use_url=True)

    class Meta:
        model = Leader
        fields = [
            'id', 'nom', 'prenom', 'position', 'executive', 'email',
            'nationality', 'flag', 'filiere', 'campus', 'mandat',
            'mission', 'linkedin', 'image', 'order', 'is_active',
        ]


class AboutContentSerializer(serializers.ModelSerializer):
    mission_paragraphs = serializers.SerializerMethodField()
    vision_paragraphs = serializers.SerializerMethodField()
    valeurs_list = serializers.SerializerMethodField()

    class Meta:
        model = AboutContent
        fields = ['mission_paragraphs', 'vision_paragraphs', 'valeurs_list']

    def get_mission_paragraphs(self, obj):
        return [p for p in obj.mission.split('\n\n') if p.strip()]

    def get_vision_paragraphs(self, obj):
        return [p for p in obj.vision.split('\n\n') if p.strip()]

    def get_valeurs_list(self, obj):
        return obj.valeurs  # déjà une liste


# École
class ClubListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ['id', 'name', 'interest', 'logo_url']


class AcademicCalendarSerializer(serializers.Serializer):
    academicYear = serializers.CharField()
    exportUrl = serializers.URLField(required=False, allow_null=True)
    dates = serializers.ListField(child=serializers.DictField())


class PracticalInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PracticalInfo
        fields = ['id', 'title', 'description', 'link_label', 'link_url', 'color', 'order']


class SchoolMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolMedia
        fields = ['id', 'url', 'alt', 'position']


class StudentGuideSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentGuide
        fields = ['url', 'filename', 'updated_at']

class RegisterPageSerializer(serializers.Serializer):
    firstName = serializers.CharField(max_length=50)
    lastName = serializers.CharField(max_length=50)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    academicYear = serializers.IntegerField(min_value=1, max_value=5)
    specialization = serializers.CharField(max_length=100)

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("Un compte avec cet email existe déjà.")
        return value.lower()

    def validate(self, attrs):
        year = attrs.get('academicYear')
        spec = attrs.get('specialization')
        if year in (1, 2) and spec != 'annee_preparatoire':
            raise serializers.ValidationError({
                'specialization': "Pour les années préparatoires, la filière doit être 'année préparatoire'."
            })
        if year in (3, 4, 5) and spec == 'annee_preparatoire':
            raise serializers.ValidationError({
                'specialization': "Cette filière n'est pas valide pour les années supérieures."
            })
        return attrs

    def create(self, validated_data):
        email = validated_data['email']
        user = User(
            email=email,
            first_name=validated_data['firstName'],
            last_name=validated_data['lastName'],
            username=email,
            promotion=str(validated_data['academicYear']),
        )
        spec_value = validated_data['specialization']
        try:
            normalized = spec_value.lower().replace(' ', '_')
            specialite = Specialite.objects.get(code=normalized)
        except Specialite.DoesNotExist:
            try:
                specialite = Specialite.objects.get(intitule__iexact=spec_value)
            except Specialite.DoesNotExist:
                raise serializers.ValidationError({'specialization': "Cette spécialité n'existe pas."})
        user.specialite = specialite
        user.set_password(validated_data['password'])
        user.save()
        return user


# =====================================================
# Classroom serializers
# =====================================================


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = [
            'id', 'subject', 'title', 'resource_type', 'category', 'url', 'description', 'allow_preview', 'created_at', 'updated_at'
        ]


class SubjectSerializer(serializers.ModelSerializer):
    resources = ResourceSerializer(many=True, read_only=True)

    class Meta:
        model = Subject
        fields = ['id', 'semester', 'title', 'code', 'description', 'display_order', 'resources']


class SemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = ['id', 'classroom', 'number']


class ClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom
        fields = ['id', 'name', 'code', 'description', 'is_active', 'created_at', 'updated_at']
