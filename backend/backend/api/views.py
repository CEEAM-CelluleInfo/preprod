"""
Views Django REST Framework - Plateforme CEEAM
"""

import json
import logging
import re
import uuid
from django.db import models
from django.db import IntegrityError, transaction
from django.conf import settings
from django.contrib.auth import authenticate
from datetime import datetime, timedelta
from django.core.files.storage import default_storage
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser, BasePermission, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils.timezone import make_aware


from .models import (
    User, Country, Specialite, LaureatProfile, LaureatJoinRequest,
    HistoriqueEntry, CompetenceCategory, UserCompetence,
    Activity, ActivityLike, ActivityRegistration, GuestActivityRegistration, ActivityProposal, GuestActivityProposal,
    BureauMember, BureauPosition,
    ContentSection, AcademicDate, Club,
    VoteSession, Position, Candidate, Vote,
    Announcement, SchoolGuide, Notification, AuditLog,
    Classroom, Subject, Resource,
)
from .serializers import (
    UserSerializer, UserCreateSerializer, CountrySerializer, SpecialiteSerializer, LaureatProfileSerializer,
    LaureatJoinRequestSerializer, LaureatJoinRequestAdminSerializer, LaureatJoinRequestStatusSerializer,
    HistoriqueEntrySerializer, CompetenceCategorySerializer, UserCompetenceSerializer, UserCompetenceCreateSerializer,
    ActivitySerializer, ActivityLikeSerializer, ActivityRegistrationSerializer, ActivityRegistrationPayloadSerializer,
    ActivityProposalSerializer, GuestActivityProposalSerializer,
    BureauMemberSerializer,
    ContentSectionSerializer, AcademicDateSerializer, ClubSerializer,
    NotificationSerializer,
    LaureatViewProfileSerializer, 
    # Serializers JWT
    RegisterSerializer, LoginSerializer, LogoutSerializer,
    EmailVerificationSerializer, ResendVerificationEmailSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer, PasswordChangeSerializer, LaureatDetailSerializer,
    ClassroomSerializer, SubjectSerializer, ResourceSerializer,
)
from .token_service import (
    EmailVerificationTokenService,
    PasswordResetTokenService,
)
from .emails import EmailService
from .laureat_requests import apply_laureat_join_request_approval, build_frontend_url
from .notifications import (
    ensure_upcoming_activity_notifications,
    notify_activity_proposal_reviewed,
    notify_activity_proposal_submitted,
    notify_activity_registration,
    notify_laureat_request_status,
    notify_laureat_request_submitted,
    notify_vote_submitted,
)
from .models import AboutStat, Leader, AboutContent
from .serializers import AboutStatSerializer, LeaderSerializer, AboutContentSerializer
from .models import Club, AcademicDate, PracticalInfo, SchoolMedia, StudentGuide
from .serializers import ClubListSerializer, AcademicCalendarSerializer, PracticalInfoSerializer, SchoolMediaSerializer, StudentGuideSerializer


logger = logging.getLogger(__name__)


def _storage_name_from_value(value: str | None) -> str:
    if not value:
        return ""

    storage_name = value.lstrip("/")
    if storage_name.startswith("media/"):
        storage_name = storage_name[len("media/"):]
    return storage_name


def _resolve_media_url(value: str | None) -> str:
    if not value:
        return ""
    if value.startswith("http://") or value.startswith("https://"):
        return value

    storage_name = _storage_name_from_value(value)
    try:
        return default_storage.url(storage_name)
    except Exception:
        return value


def _build_absolute_media_url(request, value: str | None) -> str:
    resolved = _resolve_media_url(value)
    if not resolved:
        return ""
    if resolved.startswith("http://") or resolved.startswith("https://"):
        return resolved
    return request.build_absolute_uri(resolved)


def _is_supported_profile_image(photo) -> bool:
    allowed_content_types = {
        'image/jpeg',
        'image/jpg',
        'image/pjpeg',
        'image/png',
        'image/x-png',
    }
    allowed_extensions = {'.jpg', '.jpeg', '.png'}

    file_name = (getattr(photo, 'name', '') or '').lower()
    content_type = (getattr(photo, 'content_type', '') or '').lower()

    return (
        content_type in allowed_content_types
        or any(file_name.endswith(extension) for extension in allowed_extensions)
    )


# =====================================================
# PERMISSIONS PERSONNALISÉES
# =====================================================

class IsAdminOrReadOnly(BasePermission):
    """
    Permission: lecture pour tous, écriture pour admins uniquement.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)


class IsBureauOrAdmin(BasePermission):
    """Allow bureau members, admins, and Django staff/superusers."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                user.role in {"bureau", "admin"}
                or user.is_staff
                or user.is_superuser
            )
        )


def _get_client_ip(request):
    """Resolve client IP from X-Forwarded-For or REMOTE_ADDR."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _audit_log(request, action: str, entity_type: str, entity_id: int | None = None, changes: dict | None = None):
    """Create audit log entry without breaking main flow on logging failures."""
    try:
        AuditLog.objects.create(
            user=request.user if getattr(request, "user", None) and request.user.is_authenticated else None,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            changes=json.dumps(changes or {}, ensure_ascii=True),
            ip_address=_get_client_ip(request),
        )
    except Exception:
        # Never block business logic if audit logging fails.
        pass


OFFICIAL_VOTE_POSITIONS = [
    {"code": "sg", "title": "Secretaire general", "requires_one_year_min": True},
    {"code": "sga", "title": "Secretaire general adjoint", "requires_one_year_min": False},
    {"code": "com", "title": "Charge a la communication", "requires_one_year_min": False},
    {"code": "com_adj", "title": "Charge a la communication adjoint", "requires_one_year_min": False},
    {"code": "commissaire", "title": "Commissaire au compte", "requires_one_year_min": False},
    {"code": "sport", "title": "Charge sportif", "requires_one_year_min": False},
    {"code": "sport_adj", "title": "Charge sportif adjoint", "requires_one_year_min": False},
    {"code": "orga", "title": "Charge a l'Organisation", "requires_one_year_min": False},
    {"code": "orga_adj", "title": "Charge a l'Organisation adjoint", "requires_one_year_min": False},
    {"code": "tresorier", "title": "Tresorier", "requires_one_year_min": True},
    {"code": "tresorier_adj", "title": "Tresorier adjoint", "requires_one_year_min": False},
]


def _ensure_vote_session_positions(session: VoteSession):
    for index, position_data in enumerate(OFFICIAL_VOTE_POSITIONS):
        bureau_position, _ = BureauPosition.objects.get_or_create(
            code=position_data["code"],
            defaults={
                "title": position_data["title"],
                "description": "Poste du bureau CEEAM",
                "requires_one_year_min": position_data["requires_one_year_min"],
                "display_order": index,
                "is_active": True,
            },
        )

        bureau_position.title = position_data["title"]
        bureau_position.description = bureau_position.description or "Poste du bureau CEEAM"
        bureau_position.requires_one_year_min = position_data["requires_one_year_min"]
        bureau_position.display_order = index
        bureau_position.is_active = True
        bureau_position.save(
            update_fields=["title", "description", "requires_one_year_min", "display_order", "is_active"]
        )

        Position.objects.get_or_create(
            vote_session=session,
            bureau_position=bureau_position,
            defaults={
                "title": position_data["title"],
                "description": "Poste du bureau CEEAM",
                "display_order": index,
            },
        )


def _serialize_admin_vote_candidate(candidate: Candidate):
    return {
        'id': candidate.id,
        'user': UserSerializer(candidate.user).data,
        'motivation': candidate.motivation,
        'program': candidate.program,
        'photo_url': candidate.photo_url,
        'registered_at': candidate.registered_at,
        'is_approved': candidate.is_approved,
        'votes_count': candidate.votes.count(),
    }


def _serialize_admin_vote_position(position: Position):
    candidates = [
        _serialize_admin_vote_candidate(candidate)
        for candidate in position.candidates.select_related('user').all().order_by('-is_approved', 'registered_at')
    ]

    return {
        'id': position.id,
        'title': position.title,
        'description': position.description,
        'display_order': position.display_order,
        'bureau_position_id': position.bureau_position_id,
        'candidates_count': len(candidates),
        'approved_candidates_count': sum(1 for candidate in candidates if candidate['is_approved']),
        'candidates': candidates,
    }


def _vote_session_configuration_locked(session: VoteSession):
    return session.status == 'closed' or Vote.objects.filter(vote_session=session).exists()


def _extract_year_from_promotion(promotion_value: str | None):
    """Extract a 4-digit year from promotion text like '2024', 'Promo 2024', etc."""
    if not promotion_value:
        return None
    match = re.search(r"(19|20)\d{2}", promotion_value)
    if not match:
        return None
    return int(match.group(0))


def _resolve_bureau_member_position_code(position: Position):
    """Resolve bureau member position code from BureauPosition reference or fallback title mapping."""
    if position.bureau_position and position.bureau_position.code:
        return position.bureau_position.code.lower()

    title = (position.title or "").strip().lower()
    title_map = {
        "secretaire general": "sg",
        "secretaire general adjoint": "sga",
        "charge a la communication": "com",
        "charge a la communication adjoint": "com_adj",
        "commissaire au compte": "commissaire",
        "charge sportif": "sport",
        "charge sportif adjoint": "sport_adj",
        "charge a l'organisation": "orga",
        "charge a l'organisation adjoint": "orga_adj",
        "tresorier": "tresorier",
        "tresorier adjoint": "tresorier_adj",
    }
    return title_map.get(title)


def _renew_bureau_members_from_session(session: VoteSession):
    """Promote vote winners to BureauMember for the session mandate year."""
    mandate_year = str(session.start_date.year)
    allowed_codes = {choice[0] for choice in BureauMember.POSITION_CHOICES}

    results = []
    assigned_user_ids = set()

    # Close current bureau mandate first.
    BureauMember.objects.filter(is_current=True).update(is_current=False)

    for position in session.positions.all().order_by("display_order", "id"):
        winner_rows = list(
            Vote.objects.filter(vote_session=session, position=position)
            .values("candidate_id")
            .annotate(total=models.Count("id"))
            .order_by("-total", "candidate_id")
        )

        if not winner_rows:
            results.append({
                "position_id": position.id,
                "position_title": position.title,
                "status": "no_votes",
            })
            continue

        winner = None
        winner_votes = 0
        for row in winner_rows:
            try:
                candidate = Candidate.objects.select_related("user").get(id=row["candidate_id"])
            except Candidate.DoesNotExist:
                continue

            if candidate.user_id in assigned_user_ids:
                continue

            winner = candidate
            winner_votes = row["total"]
            break

        if winner is None:
            results.append({
                "position_id": position.id,
                "position_title": position.title,
                "status": "all_winners_already_assigned",
            })
            continue

        position_code = _resolve_bureau_member_position_code(position)
        if not position_code or position_code not in allowed_codes:
            results.append({
                "position_id": position.id,
                "position_title": position.title,
                "status": "unmapped_position",
                "winner_user_id": winner.user_id,
            })
            continue

        bureau_member, created = BureauMember.objects.update_or_create(
            user=winner.user,
            mandate_year=mandate_year,
            defaults={
                "position": position_code,
                "display_order": position.display_order,
                "is_current": True,
            },
        )

        results.append({
            "position_id": position.id,
            "position_title": position.title,
            "status": "created" if created else "updated",
            "winner_user_id": winner.user_id,
            "votes": winner_votes,
            "bureau_member_id": bureau_member.id,
        })
        assigned_user_ids.add(winner.user_id)

    return {
        "mandate_year": mandate_year,
        "session_id": session.id,
        "session_title": session.title,
        "results": results,
    }


# =====================================================
# VIEWSETS
# =====================================================

class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les pays (lecture seule)."""
    queryset = Country.objects.filter(is_active=True)
    serializer_class = CountrySerializer
    permission_classes = [AllowAny]
    pagination_class = None   # ← Désactive la pagination



class SpecialiteViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les spécialités (lecture seule)."""
    queryset = Specialite.objects.filter(is_active=True)
    serializer_class = SpecialiteSerializer
    permission_classes = [AllowAny]
    filter_backends = [SearchFilter]
    search_fields = ["code", "intitule"]


class ContentSectionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour consulter les sections de contenu (lecture seule)."""
    queryset = ContentSection.objects.all()
    serializer_class = ContentSectionSerializer
    permission_classes = [AllowAny]
    lookup_field = "id"


class AcademicDateViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les dates académiques (lecture publique, écriture admin)."""
    queryset = AcademicDate.objects.all().order_by("semester", "date_id")
    serializer_class = AcademicDateSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["academic_year", "semester"]

    def get_queryset(self):
        """Filtre les dates par année académique si fournie en query param."""
        queryset = super().get_queryset()
        annee_academique = self.request.query_params.get("academicYear")
        if annee_academique:
            queryset = queryset.filter(academic_year=annee_academique)
        return queryset

    def list(self, request, *args, **kwargs):
        """Liste les dates académiques avec formatage personnalisé (compatible frontend)."""
        queryset = self.filter_queryset(self.get_queryset())
        
        if not queryset.exists():
            return Response({"detail": "Aucune date disponible"}, status=status.HTTP_404_NOT_FOUND)

        dates = [
            {
                "id": item.date_id,
                "label": item.label,
                "value": item.value,
                "semester": item.semester,
                "academicYear": item.academic_year,
            }
            for item in queryset
        ]
        derniere_maj = queryset.order_by("-updated_at").first()
        annee_resolue = request.query_params.get("academicYear") or dates[0]["academicYear"]

        return Response(
            {
                "dates": dates,
                "academicYear": annee_resolue,
                "lastUpdated": derniere_maj.updated_at.isoformat() if derniere_maj else "",
            }
        )


class ActivityViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les activités (lecture publique, écriture admin)."""
    queryset = Activity.objects.filter(is_published=True)
    serializer_class = ActivitySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ["title", "category", "description"]
    filterset_fields = ["category", "is_upcoming"]

    CATEGORY_LABEL_MAP = {
        "integration": "Social",
        "formation": "Académique",
        "culture": "Culture",
        "networking": "Social",
        "sport": "Sport",
    }

    CATEGORY_TAB_MAP = {
        "formation": "formations",
        "integration": "evenements",
        "culture": "evenements",
        "networking": "evenements",
        "sport": "evenements",
    }

    ERROR_LABELS = {
        400: "Bad Request",
        401: "Unauthorized",
        404: "Not Found",
        409: "Conflict",
        410: "Gone",
        422: "Unprocessable Entity",
        429: "Too Many Requests",
        500: "Internal Server Error",
    }

    def _error_response(self, status_code: int, message: str, details: dict | None = None):
        return Response(
            {
                "status": status_code,
                "error": self.ERROR_LABELS.get(status_code, "Error"),
                "message": message,
                "details": details or {},
            },
            status=status_code,
        )

    def _to_absolute_url(self, request, value: str | None):
        if not value:
            return ""
        if value.startswith("http://") or value.startswith("https://"):
            return value
        resolved = _resolve_media_url(value)
        if resolved.startswith("http://") or resolved.startswith("https://"):
            return resolved
        return request.build_absolute_uri(resolved)

    def _format_date_fr(self, dt_value):
        if not dt_value:
            return "Date à définir"
        months = [
            "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
        ]
        local_dt = timezone.localtime(dt_value) if timezone.is_aware(dt_value) else dt_value
        return f"{local_dt.day} {months[local_dt.month - 1]} {local_dt.year}"

    def _format_time_fr(self, activity: Activity):
        if activity.event_time:
            if re.match(r"^\d{1,2}:\d{2}$", activity.event_time):
                hours, minutes = activity.event_time.split(":", 1)
                return f"{int(hours)}h{minutes}"
            return activity.event_time
        if activity.event_date:
            local_dt = timezone.localtime(activity.event_date) if timezone.is_aware(activity.event_date) else activity.event_date
            return local_dt.strftime("%Hh%M")
        return ""

    def _is_upcoming(self, activity: Activity):
        if not activity.event_date:
            return bool(activity.is_upcoming)
        now = timezone.now()
        delta = activity.event_date - now
        return timedelta(days=0) <= delta <= timedelta(days=30)

    def _urgency(self, activity: Activity):
        registrations_count = (
            activity.registrations.exclude(status="cancelled").count()
            + activity.guest_registrations.exclude(status="cancelled").count()
        )
        if activity.max_participants:
            remaining = activity.max_participants - registrations_count
            if 0 < remaining <= 10:
                return "urgent"

        if activity.event_date:
            now = timezone.now()
            if now <= activity.event_date <= now + timedelta(days=7):
                return "urgent"

        return "normal"

    def _serialize_activity(self, activity: Activity, request):
        registrations_count = (
            activity.registrations.exclude(status="cancelled").count()
            + activity.guest_registrations.exclude(status="cancelled").count()
        )
        likes_count = activity.likes.count()
        image = self._to_absolute_url(request, activity.image_url)
        category_label = self.CATEGORY_LABEL_MAP.get(activity.category, activity.category)
        category_tab = self.CATEGORY_TAB_MAP.get(activity.category, "evenements")
        is_upcoming = self._is_upcoming(activity)
        urgency = self._urgency(activity)

        organizer_name = activity.organizer_name
        if not organizer_name and activity.created_by:
            organizer_name = activity.created_by.full_name

        organizer_avatar = self._to_absolute_url(request, activity.organizer_avatar)
        if not organizer_avatar and activity.created_by:
            organizer_avatar = self._to_absolute_url(request, activity.created_by.avatar_url)

        user_liked = False
        user_registered = False
        if request.user.is_authenticated:
            user_liked = activity.likes.filter(user=request.user).exists()
            user_registered = activity.registrations.filter(user=request.user).exclude(status="cancelled").exists()

        data = {
            # Champs standards backend existants
            "id": activity.id,
            "title": activity.title,
            "description": activity.description,
            "long_description": activity.long_description,
            "category": activity.category,
            "image_url": image,
            "event_date": activity.event_date.isoformat() if activity.event_date else None,
            "event_time": self._format_time_fr(activity),
            "location": activity.location,
            "duration": activity.duration or "2h",
            "max_participants": activity.max_participants,
            "registration_deadline": activity.registration_deadline.isoformat() if activity.registration_deadline else None,
            "tags": activity.tags or [],
            "likes_count": likes_count,
            "registrations_count": registrations_count,
            "user_liked": user_liked,
            "user_registered": user_registered,
            "is_upcoming": is_upcoming,

            # Champs attendus par les pages frontend TAF
            "longDescription": activity.long_description,
            "imageUrl": image,
            "image": image,
            "date": self._format_date_fr(activity.event_date),
            "time": self._format_time_fr(activity),
            "participants": registrations_count,
            "currentParticipants": registrations_count,
            "maxParticipants": activity.max_participants,
            "registrationDeadline": activity.registration_deadline.isoformat() if activity.registration_deadline else None,
            "organizer": {
                "name": organizer_name,
                "avatar": organizer_avatar,
            },
            "categoryLabel": category_label,
            "categoryTab": category_tab,
            "urgency": urgency,
            "likes": likes_count,
            "likesCount": likes_count,
            "stars": likes_count,
            "userLiked": user_liked,
            "upcoming": is_upcoming,
            "isUpcoming": is_upcoming,
        }
        return data

    def _serialize_upcoming_event(self, activity: Activity):
        return {
            "id": activity.id,
            "title": activity.title,
            "date": self._format_date_fr(activity.event_date),
            "time": self._format_time_fr(activity),
            "location": activity.location,
        }

    def _apply_category_filter(self, queryset, category_raw: str | None):
        if not category_raw:
            return queryset

        value = category_raw.strip()
        value_lower = value.lower()

        if value_lower in {"tous", "all"}:
            return queryset

        if value_lower in {"formations", "formation"}:
            return queryset.filter(category="formation")

        if value_lower in {"evenements", "events", "event"}:
            return queryset.exclude(category="formation")

        label_to_categories = {
            "sport": ["sport"],
            "culture": ["culture"],
            "social": ["integration", "networking"],
            "académique": ["formation"],
            "academique": ["formation"],
            "bénévolat": [],
            "benevolat": [],
        }
        if value_lower in label_to_categories:
            categories = label_to_categories[value_lower]
            if not categories:
                return queryset.none()
            return queryset.filter(category__in=categories)

        allowed_categories = {choice[0] for choice in Activity.CATEGORY_CHOICES}
        if value in allowed_categories:
            return queryset.filter(category=value)

        return None

    def list(self, request, *args, **kwargs):
        queryset = (
            self.filter_queryset(self.get_queryset())
            .select_related("created_by")
            .prefetch_related("likes", "registrations", "guest_registrations")
        )
        queryset = queryset.order_by("event_date", "id")

        category_raw = request.query_params.get("category")
        category_queryset = self._apply_category_filter(queryset, category_raw)
        if category_queryset is None:
            return self._error_response(
                status.HTTP_400_BAD_REQUEST,
                "Paramètre de filtre invalide",
                {
                    "field": "category",
                    "reason": f"Valeur '{category_raw}' non supportée.",
                },
            )
        queryset = category_queryset

        month = request.query_params.get("month")
        if month:
            if not re.match(r"^\d{4}-\d{2}$", month):
                return self._error_response(
                    status.HTTP_400_BAD_REQUEST,
                    "Paramètre invalide",
                    {
                        "field": "month",
                        "reason": "Le format attendu est YYYY-MM.",
                    },
                )
            year, month_number = [int(part) for part in month.split("-")]
            if month_number < 1 or month_number > 12:
                return self._error_response(
                    status.HTTP_400_BAD_REQUEST,
                    "Paramètre invalide",
                    {
                        "field": "month",
                        "reason": "Le mois doit être compris entre 01 et 12.",
                    },
                )

            start_dt = timezone.make_aware(datetime(year, month_number, 1))
            if month_number == 12:
                end_dt = timezone.make_aware(datetime(year + 1, 1, 1))
            else:
                end_dt = timezone.make_aware(datetime(year, month_number + 1, 1))

            queryset = queryset.filter(event_date__gte=start_dt, event_date__lt=end_dt)

        days_with_activities = sorted({item.event_date.day for item in queryset if item.event_date}) if month else []

        try:
            page = int(request.query_params.get("page", 1))
            limit = int(request.query_params.get("limit", 20))
        except ValueError:
            return self._error_response(
                status.HTTP_400_BAD_REQUEST,
                "Paramètre invalide",
                {
                    "field": "page/limit",
                    "reason": "Les paramètres page et limit doivent être des entiers.",
                },
            )

        if page < 1 or limit < 1:
            return self._error_response(
                status.HTTP_400_BAD_REQUEST,
                "Paramètre invalide",
                {
                    "field": "page/limit",
                    "reason": "Les paramètres page et limit doivent être strictement positifs.",
                },
            )

        serialized_all = [self._serialize_activity(activity, request) for activity in queryset]

        urgency = request.query_params.get("urgency")
        if urgency:
            urgency_lower = urgency.strip().lower()
            if urgency_lower not in {"urgent", "normal"}:
                return self._error_response(
                    status.HTTP_400_BAD_REQUEST,
                    "Paramètre invalide",
                    {
                        "field": "urgency",
                        "reason": "Les valeurs autorisées sont 'urgent' ou 'normal'.",
                    },
                )
            serialized_all = [item for item in serialized_all if item["urgency"] == urgency_lower]

        total = len(serialized_all)
        start = (page - 1) * limit
        end = start + limit
        page_items = serialized_all[start:end]

        return Response(
            {
                "data": page_items,
                "total": total,
                "page": page,
                "limit": limit,
                "pagination": {
                    "currentPage": page,
                    "itemsPerPage": limit,
                    "totalItems": total,
                },
                "daysWithActivities": days_with_activities,
            }
        )

    def retrieve(self, request, *args, **kwargs):
        activity = self.get_object()
        data = self._serialize_activity(activity, request)

        medias = list(activity.medias.order_by("display_order", "id"))
        conferences = []
        if medias:
            for index in range(0, len(medias), 2):
                batch = medias[index:index + 2]
                images = [self._to_absolute_url(request, media.file_path) for media in batch if media.file_path]
                if not images:
                    continue
                first = batch[0]
                conferences.append(
                    {
                        "id": index // 2 + 1,
                        "title": first.caption or activity.title,
                        "subtitle": first.caption or "Événement majeur de la tech",
                        "images": images,
                        "href": f"/conference/{activity.id}-{index // 2 + 1}",
                    }
                )
        elif data.get("image"):
            conferences.append(
                {
                    "id": 1,
                    "title": activity.title,
                    "subtitle": "Événement majeur de la tech",
                    "images": [data["image"]],
                    "href": f"/conference/{activity.id}-1",
                }
            )

        data["conferences"] = conferences
        data["likesCount"] = data["likes_count"]

        return Response(data)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny], url_path="events/upcoming")
    def upcoming_events(self, request):
        queryset = self.get_queryset().filter(event_date__gte=timezone.now()).order_by("event_date", "id")

        try:
            limit = int(request.query_params.get("limit", 8))
        except ValueError:
            return self._error_response(
                status.HTTP_400_BAD_REQUEST,
                "Paramètre invalide",
                {
                    "field": "limit",
                    "reason": "Le paramètre limit doit être un entier.",
                },
            )

        if limit < 1:
            return self._error_response(
                status.HTTP_400_BAD_REQUEST,
                "Paramètre invalide",
                {
                    "field": "limit",
                    "reason": "Le paramètre limit doit être strictement positif.",
                },
            )

        selected = list(queryset[:limit])
        return Response(
            {
                "data": [self._serialize_upcoming_event(activity) for activity in selected],
                "total": queryset.count(),
            }
        )

    @action(detail=False, methods=["get"], permission_classes=[AllowAny], url_path="categories")
    def categories(self, request):
        return Response(
            {
                "categories": ["Tous", "Sport", "Culture", "Social", "Académique", "Bénévolat"],
            }
        )

    @action(detail=True, methods=["get", "post", "delete"], permission_classes=[IsAuthenticated], url_path="like")
    def like(self, request, pk=None):
        """GET status, POST like, DELETE unlike."""
        activity = self.get_object()
        user = request.user

        if request.method == "GET":
            return Response(
                {
                    "activityId": str(activity.id),
                    "likesCount": activity.likes.count(),
                    "userLiked": activity.likes.filter(user=user).exists(),
                }
            )

        if request.method == "POST":
            like, created = ActivityLike.objects.get_or_create(activity=activity, user=user)
            if not created:
                return self._error_response(
                    status.HTTP_409_CONFLICT,
                    "Activité déjà likée",
                    {
                        "field": "activityId",
                        "reason": f"L'utilisateur a déjà liké l'activité #{activity.id}.",
                    },
                )
            return Response(
                {
                    "activityId": str(activity.id),
                    "likesCount": activity.likes.count(),
                    "userLiked": True,
                }
            )

        deleted, _ = ActivityLike.objects.filter(activity=activity, user=user).delete()
        if not deleted:
            return self._error_response(
                status.HTTP_404_NOT_FOUND,
                "Like introuvable",
                {
                    "field": "activityId",
                    "reason": f"Aucun like trouvé pour l'activité #{activity.id}.",
                },
            )

        return Response(
            {
                "activityId": str(activity.id),
                "likesCount": activity.likes.count(),
                "userLiked": False,
            }
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated], url_path="unlike")
    def unlike(self, request, pk=None):
        """Compatibilité descendante pour l'ancien endpoint POST /unlike/."""
        activity = self.get_object()
        ActivityLike.objects.filter(activity=activity, user=request.user).delete()
        return Response(
            {
                "activityId": str(activity.id),
                "likesCount": activity.likes.count(),
                "userLiked": False,
            }
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated], url_path="star")
    def star(self, request, pk=None):
        """Toggle étoile/favori d'une activité."""
        activity = self.get_object()
        user = request.user

        like_qs = ActivityLike.objects.filter(activity=activity, user=user)
        if like_qs.exists():
            like_qs.delete()
            is_starred = False
        else:
            ActivityLike.objects.create(activity=activity, user=user)
            is_starred = True

        return Response(
            {
                "stars": activity.likes.count(),
                "isStarred": is_starred,
            }
        )

    @action(detail=True, methods=["post"], permission_classes=[AllowAny], url_path="register")
    def register(self, request, pk=None):
        """Inscription à une activité pour utilisateur connecté ou invité."""
        activity = self.get_object()
        user = request.user
        is_authenticated = bool(user and user.is_authenticated)

        current_time = timezone.now()

        # Vérifier la date limite d'inscription
        registration_deadline = activity.registration_deadline
        if registration_deadline:
            if timezone.is_naive(registration_deadline):
                registration_deadline = timezone.make_aware(
                    registration_deadline,
                    timezone.get_current_timezone(),
                )
            if current_time > registration_deadline:
                return self._error_response(
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                    "Date limite d'inscription dépassée",
                    {
                        "field": "registrationDeadline",
                        "reason": "La date limite d'inscription est dépassée pour cette activité.",
                    },
                )

        # Vérifier que la date de l'activité n'est pas déjà passée
        event_date = activity.event_date
        if event_date:
            if timezone.is_naive(event_date):
                event_date = timezone.make_aware(
                    event_date,
                    timezone.get_current_timezone(),
                )
            if current_time > event_date:
                return self._error_response(
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                    "La date de cette activité est déjà passée",
                    {
                        "field": "eventDate",
                        "reason": "Les inscriptions ne sont plus possibles après la date de l'activité.",
                    },
                )

        # Vérifier la capacité restante
        current_registrations = (
            activity.registrations.exclude(status="cancelled").count()
            + activity.guest_registrations.exclude(status="cancelled").count()
        )
        if activity.max_participants and current_registrations >= activity.max_participants:
            return self._error_response(
                status.HTTP_410_GONE,
                "Plus de places disponibles",
                {
                    "field": "maxParticipants",
                    "reason": "La capacité maximale est atteinte.",
                },
            )

        payload = request.data.copy()
        if is_authenticated:
            if not payload.get("nomComplet"):
                payload["nomComplet"] = user.full_name or user.email
            if not payload.get("email"):
                payload["email"] = user.email
            if not payload.get("telephone"):
                payload["telephone"] = user.phone or user.whatsapp or "N/A"
            if not payload.get("niveauEtude"):
                payload["niveauEtude"] = "Autre"

        payload_serializer = ActivityRegistrationPayloadSerializer(data=payload)
        if not payload_serializer.is_valid():
            return self._error_response(
                status.HTTP_400_BAD_REQUEST,
                "Données d'inscription invalides",
                payload_serializer.errors,
            )

        validated = payload_serializer.validated_data

        if is_authenticated:
            # Conflit: utilisateur déjà inscrit
            if activity.registrations.filter(user=user).exclude(status="cancelled").exists():
                return self._error_response(
                    status.HTTP_409_CONFLICT,
                    "Vous êtes déjà inscrit à cette activité",
                    {
                        "field": "user",
                        "reason": f"L'utilisateur #{user.id} est déjà inscrit à l'activité #{activity.id}.",
                    },
                )

        # Conflit: email déjà inscrit pour la même activité (connecté ou invité)
        if (
            activity.registrations.filter(email__iexact=validated["email"]).exclude(status="cancelled").exists()
            or activity.guest_registrations.filter(email__iexact=validated["email"]).exclude(status="cancelled").exists()
        ):
            return self._error_response(
                status.HTTP_409_CONFLICT,
                "Cet email est déjà inscrit à cette activité",
                {
                    "field": "email",
                    "reason": f"{validated['email']} est déjà enregistré pour l'activité #{activity.id}.",
                },
            )

        if is_authenticated:
            registration = ActivityRegistration.objects.create(
                activity=activity,
                user=user,
                nom_complet=validated["nomComplet"],
                email=validated["email"],
                telephone=validated["telephone"],
                niveau_etude=validated["niveauEtude"],
                status="confirmed",
                confirmed_at=timezone.now(),
            )
            notify_activity_registration(registration)
            registration_id = f"reg_{registration.id}"
            registered_at = registration.registered_at.isoformat()
        else:
            registration = GuestActivityRegistration.objects.create(
                activity=activity,
                nom_complet=validated["nomComplet"],
                email=validated["email"],
                telephone=validated["telephone"],
                niveau_etude=validated["niveauEtude"],
                status="confirmed",
            )
            registration_id = f"greg_{registration.id}"
            registered_at = registration.registered_at.isoformat()

        return Response(
            {
                "success": True,
                "message": "Inscription confirmée",
                "data": {
                    "registrationId": registration_id,
                    "activityId": str(activity.id),
                    "nomComplet": registration.nom_complet,
                    "email": registration.email,
                    "registeredAt": registered_at,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class BureauMemberViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les membres du bureau (lecture publique, écriture admin)."""
    queryset = BureauMember.objects.filter(is_current=True).order_by("display_order")
    serializer_class = BureauMemberSerializer
    permission_classes = [IsAdminOrReadOnly]  # 🔒 Sécurisé

    def list(self, request, *args, **kwargs):
        """Liste les membres du bureau avec pagination."""
        page = int(request.query_params.get("page", 0))
        limit = int(request.query_params.get("limit", 10))
        if limit <= 0:
            limit = 10
        if page < 0:
            page = 0

        start = page * limit
        end = start + limit
        queryset = self.get_queryset()
        items = queryset[start:end]
        serializer = self.get_serializer(items, many=True)

        total = queryset.count()
        total_pages = (total + limit - 1) // limit if limit else 0

        return Response(
            {
                "leaders": serializer.data,
                "total": total,
                "page": page,
                "totalPages": total_pages,
            }
        )


class ActivityProposalViewSet(viewsets.ModelViewSet):
    """ViewSet pour les propositions d'activités (création ouverte, consultation authentifiée)."""
    queryset = ActivityProposal.objects.all()
    serializer_class = ActivityProposalSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        """Créer une proposition d'activité (connecté ou invité)."""
        data = request.data.copy()
        contact_email = str(data.get("contact_email", "")).strip()

        if request.user and request.user.is_authenticated:
            data["created_by"] = request.user.id
            if not contact_email:
                user_email = (request.user.email or "").strip()
                if not user_email:
                    return Response(
                        {"detail": "Aucun email n'est associé à votre compte."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                data["contact_email"] = user_email
            else:
                data["contact_email"] = contact_email

            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            notify_activity_proposal_submitted(serializer.instance)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        if not contact_email:
            return Response(
                {"detail": "L'email de contact est requis pour une proposition invitée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data["contact_email"] = contact_email
        guest_serializer = GuestActivityProposalSerializer(data=data, context=self.get_serializer_context())
        guest_serializer.is_valid(raise_exception=True)
        guest_proposal = guest_serializer.save()

        return Response(
            GuestActivityProposalSerializer(guest_proposal, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )


class ClubViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les clubs (lecture seule)."""
    queryset = Club.objects.filter(is_active=True)
    serializer_class = ClubSerializer
    permission_classes = [AllowAny]


# =====================================================
# AUTHENTIFICATION JWT AVEC COOKIES httpOnly
# =====================================================


def set_jwt_cookies(response, access_token, refresh_token, remember_me=False):
    """
    Définir les cookies httpOnly et secure pour les tokens JWT.
    """
    # Duree du cookie: courte par defaut, etendue si rememberMe=true.
    if remember_me:
        access_token_max_age = 60 * 60 * 24 * 30
        refresh_token_max_age = 60 * 60 * 24 * 30
    else:
        access_token_max_age = 60 * 60 * 24 if settings.DEBUG else 60 * 15
        refresh_token_max_age = 60 * 60 * 24 * 7

    response.set_cookie(
        key='access_token',
        value=str(access_token),
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        max_age=access_token_max_age,
        path='/',
    )
    response.set_cookie(
        key='refresh_token',
        value=str(refresh_token),
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        max_age=refresh_token_max_age,
        path='/',
    )


def delete_jwt_cookies(response):
    """Supprimer les cookies JWT lors de la déconnexion."""
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')


class RegisterView(APIView):
    """
    Endpoint d'inscription pour créer un nouveau compte utilisateur.
    POST /api/auth/register/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')

        if email:
            try:
                existing_user = User.objects.get(email__iexact=email)

                if not existing_user.email_verified:
                    # ✅ On ne touche à RIEN du compte existant
                    # On renvoie juste l'email de vérification
                    verification_token = EmailVerificationTokenService.create_verification_token(existing_user)
                    frontend_url = request.data.get('frontend_url', getattr(settings, 'FRONTEND_URL', 'http://localhost:5173'))

                    email_sent = EmailService.send_verification_email(
                        user=existing_user,
                        verification_token=verification_token,
                        frontend_url=frontend_url
                    )

                    if not email_sent:
                        return Response({
                            'message': "Le compte existe, mais l'email de vérification n'a pas pu être envoyé.",
                            'registration_status': 'email_delivery_failed',
                        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

                    return Response({
                        'message': 'Un email de vérification a été envoyé.',
                        'registration_status': 'pending_verification',  # ✅ flag pour le frontend
                    }, status=status.HTTP_200_OK)

                else:
                    # Email vérifié → compte actif → erreur classique
                    return Response(
                        {'email': ['Un compte avec cet email existe déjà.']},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            except User.DoesNotExist:
                pass

        # Création normale
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    user = serializer.save()
            except IntegrityError:
                return Response(
                    {'email': ['Un compte avec cet email existe déjà.']},
                    status=status.HTTP_400_BAD_REQUEST
                )

            verification_token = EmailVerificationTokenService.create_verification_token(user)
            frontend_url = request.data.get('frontend_url', getattr(settings, 'FRONTEND_URL', 'http://localhost:5173'))

            email_sent = EmailService.send_verification_email(
                user=user,
                verification_token=verification_token,
                frontend_url=frontend_url
            )

            if not email_sent:
                return Response({
                    'message': "Compte créé, mais l'email de vérification n'a pas pu être envoyé.",
                    'registration_status': 'email_delivery_failed',
                    'user': UserSerializer(user).data,
                    'email_verified': user.email_verified,
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            return Response({
                'message': 'Inscription réussie ! Un email de vérification a été envoyé.',
                'registration_status': 'created',  # ✅ flag pour le frontend
                'user': UserSerializer(user).data,
                'email_verified': user.email_verified,
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    """
    Endpoint de connexion avec email et mot de passe.
    POST /api/auth/login/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email'].lower()
        password = serializer.validated_data['password']
        remember_me = serializer.validated_data.get('rememberMe', False)

        existing_user = User.objects.filter(email__iexact=email).first()

        if existing_user is None:
            return Response(
                {
                    'error': "Aucun compte n'est associé à cette adresse email.",
                    'error_code': 'user_not_found',
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        user = authenticate(request, username=existing_user.email, password=password)
        
        if user is None:
            return Response(
                {
                    'error': 'Mot de passe incorrect. Veuillez réessayer.',
                    'error_code': 'invalid_password',
                },
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {'error': 'Compte désactivé.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Vérifier que l'email a été validé
        if not user.email_verified:
            return Response(
                {
                    'error': 'Veuillez vérifier votre email avant de vous connecter.',
                    'email_not_verified': True,
                    'email': user.email
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Générer les tokens JWT
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        user_data = UserSerializer(user).data
        response_data = {
            'message': 'Connexion réussie.',
            'user': user_data,
        }
        
        response = Response(response_data, status=status.HTTP_200_OK)
        set_jwt_cookies(response, access_token, refresh, remember_me=remember_me)
        
        return response


class LogoutView(APIView):
    """
    Endpoint de déconnexion avec blacklist du refresh token.
    POST /api/auth/logout/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            
            if not refresh_token:
                return Response(
                    {'error': 'Token de rafraîchissement manquant.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            response_data = {
                'message': 'Déconnexion réussie.',
            }
            
            response = Response(response_data, status=status.HTTP_200_OK)
            delete_jwt_cookies(response)
            
            return response
            
        except TokenError as e:
            response = Response(
                {'error': 'Token invalide.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            delete_jwt_cookies(response)
            return response


class RefreshTokenView(APIView):
    """
    Endpoint pour rafraîchir l'access token.
    POST /api/auth/refresh/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            refresh_token_str = request.COOKIES.get('refresh_token')
            
            if not refresh_token_str:
                return Response(
                    {'error': 'Token de rafraîchissement manquant.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            refresh = RefreshToken(refresh_token_str)
            new_access_token = refresh.access_token
            
            response_data = {'message': 'Token rafraîchi avec succès.'}
            response = Response(response_data, status=status.HTTP_200_OK)
            
            access_token_max_age = 60 * 60 * 24 if settings.DEBUG else 60 * 15
            response.set_cookie(
                key='access_token',
                value=str(new_access_token),
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                max_age=access_token_max_age,
                path='/',
            )
            
            return response
            
        except (TokenError, InvalidToken):
            response = Response(
                {'error': 'Token invalide ou expiré. Veuillez vous reconnecter.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            delete_jwt_cookies(response)
            return response


class MeView(APIView):
    """
    Endpoint pour récupérer les informations de l'utilisateur connecté.
    GET /api/auth/me/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response({'user': serializer.data}, status=status.HTTP_200_OK)


class EmailVerificationView(APIView):
    """
    Endpoint pour vérifier l'email avec un token.
    GET /api/auth/jwt/verify-email/?token=xxx - Prévisualiser les infos du compte (sans activer)
    POST /api/auth/jwt/verify-email/ - Activer le compte après confirmation
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Prévisualiser les informations du compte avant activation.
        SÉCURITÉ: Permet à l'utilisateur de voir qui a créé le compte avec son email
        avant de l'activer accidentellement.
        """
        token = request.query_params.get('token')
        
        if not token:
            return Response(
                {'error': 'Token manquant.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user, is_valid = EmailVerificationTokenService.verify_token(token)
        
        if not is_valid or user is None:
            is_expired = EmailVerificationTokenService.is_expired_token(token)  
            return Response(
                {
                    'error': 'Token invalide ou expiré.',
                    'expired': is_expired,                                    
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if user.email_verified:
            return Response({
                'already_verified': True,
                'message': 'Cet email est déjà vérifié.',
            }, status=status.HTTP_200_OK)
        
        # Retourner les infos du compte pour confirmation
        # NE PAS activer le compte ici - juste prévisualiser
        return Response({
            'already_verified': False,
            'account_info': {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') else None,
            },
            'message': 'Vérifiez que ces informations correspondent à votre inscription.',
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        token = serializer.validated_data['token']
        user, is_valid = EmailVerificationTokenService.verify_token(token)
        
        if not is_valid or user is None:
            # is_expired_token appelé seulement en cas d'échec, pas de double query inutile
            is_expired = EmailVerificationTokenService.is_expired_token(token)
            return Response(
                {
                    'error': 'Token invalide ou expiré.',
                    'expired': is_expired,
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if user.email_verified:
            return Response(
                {'message': 'Cet email est déjà vérifié.', 'user': UserSerializer(user).data},
                status=status.HTTP_200_OK
            )
        
        user.email_verified = True
        user.save()
        
        return Response({
            'message': 'Email vérifié avec succès !',
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)


class ResendVerificationEmailView(APIView):
    """
    Endpoint pour renvoyer l'email de vérification.
    POST /api/auth/jwt/resend-verification/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ResendVerificationEmailSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'message': 'Un email de vérification sera envoyé si cet email existe.'},
                status=status.HTTP_200_OK
            )
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email__iexact=email)
            verification_token = EmailVerificationTokenService.create_verification_token(user)
            frontend_url = request.data.get('frontend_url', getattr(settings, 'FRONTEND_URL', 'http://localhost:5173'))
            
            email_sent = EmailService.send_verification_email(
                user=user,
                verification_token=verification_token,
                frontend_url=frontend_url
            )
            if not email_sent:
                return Response(
                    {'message': "L'email de vérification n'a pas pu être envoyé. Réessayez plus tard."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
        except User.DoesNotExist:
            pass
        
        return Response(
            {'message': 'Un email de vérification sera envoyé si cet email existe.'},
            status=status.HTTP_200_OK
        )


class PasswordResetRequestView(APIView):
    """
    Endpoint pour demander une réinitialisation du mot de passe.
    POST /api/auth/jwt/forgot-password/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'message': 'Un email de réinitialisation sera envoyé si cet email existe.'},
                status=status.HTTP_200_OK
            )
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email__iexact=email)
            reset_token = PasswordResetTokenService.create_reset_token(user)
            frontend_url = request.data.get('frontend_url', getattr(settings, 'FRONTEND_URL', 'http://localhost:5173'))
            
            email_sent = EmailService.send_password_reset_email(
                user=user,
                reset_token=reset_token,
                frontend_url=frontend_url
            )

            if not email_sent:
                return Response(
                    {'message': "L'email de réinitialisation n'a pas pu être envoyé. Vérifiez la configuration email du serveur."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
        except User.DoesNotExist:
            pass
        
        return Response(
            {'message': 'Un email de réinitialisation sera envoyé si cet email existe.'},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(APIView):
    """
    Endpoint pour confirmer la réinitialisation du mot de passe.
    POST /api/auth/reset-password/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        user, is_valid = PasswordResetTokenService.verify_token(token)
        
        if not is_valid or user is None:
            return Response(
                {'error': 'Token invalide ou expiré.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        EmailService.send_password_changed_notification(user)
        
        return Response({
            'message': 'Mot de passe réinitialisé avec succès !',
        }, status=status.HTTP_200_OK)


class PasswordChangeView(APIView):
    """
    Endpoint pour changer le mot de passe (utilisateur authentifié).
    POST /api/auth/jwt/change-password/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        new_password = serializer.validated_data['new_password']
        
        user.set_password(new_password)
        user.save()
        
        EmailService.send_password_changed_notification(user)
        
        return Response({
            'message': 'Mot de passe changé avec succès !',
        }, status=status.HTTP_200_OK)


# =====================================================
# PROFIL UTILISATEUR
# =====================================================

class UserProfileView(APIView):
    """
    Endpoints pour le profil de l'utilisateur connecté.
    GET /api/profile/ - Récupérer le profil
    PUT /api/profile/ - Mettre à jour le profil
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Récupère le profil de l'utilisateur connecté."""
        from .serializers import UserProfileSerializer
        
        user = request.user
        serializer = UserProfileSerializer(user, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request):
        """Met à jour le profil de l'utilisateur connecté."""
        from .serializers import UserProfileSerializer
        
        user = request.user
        print(f"[DEBUG] PUT /api/profile/ - Data reçue: {request.data}")
        serializer = UserProfileSerializer(user, data=request.data, partial=True, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "updatedAt": user.date_joined.isoformat(),
                **serializer.data
            })
        
        print(f"[DEBUG] Erreurs de validation: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfilePhotoView(APIView):
    """
    Endpoints pour la photo de profil.
    POST /api/profile/photo/ - Uploader une photo
    DELETE /api/profile/photo/ - Supprimer la photo
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Upload une nouvelle photo de profil."""
        if 'photo' not in request.FILES:
            return Response(
                {'error': 'Aucune photo fournie.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        photo = request.FILES['photo']
        
        # Validation du type de fichier
        if not _is_supported_profile_image(photo):
            return Response(
                {'error': 'Format non supporté. Utilisez JPG ou PNG.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validation de la taille (5 MB max)
        if photo.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Fichier trop volumineux. Max 5 MB.'},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            )
        
        # Générer un nom de fichier unique
        ext = photo.name.split('.')[-1]
        filename = f"avatars/{request.user.id}_{uuid.uuid4().hex[:8]}.{ext}"

        try:
            previous_avatar = _storage_name_from_value(request.user.avatar_url)
            if previous_avatar and default_storage.exists(previous_avatar):
                default_storage.delete(previous_avatar)

            saved_name = default_storage.save(filename, photo)
            request.user.avatar_url = saved_name
            request.user.save()
            full_photo_url = _build_absolute_media_url(request, saved_name)
        except Exception as exc:
            logger.exception('Erreur pendant l\'upload de photo de profil utilisateur')
            return Response(
                {
                    'error': 'Erreur lors de l\'enregistrement de la photo.',
                    'detail': str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'photoUrl': full_photo_url,
            'success': True
        })
    
    def delete(self, request):
        """Supprime la photo de profil."""
        user = request.user

        storage_name = _storage_name_from_value(user.avatar_url)
        if storage_name and default_storage.exists(storage_name):
            default_storage.delete(storage_name)
        
        user.avatar_url = ''
        user.save()
        
        return Response({'success': True})


class AdminUsersListView(APIView):
    permission_classes = [IsBureauOrAdmin]

    def get(self, request):
        search = (request.query_params.get('search') or '').strip()
        users = User.objects.select_related('country', 'specialite').all().order_by('first_name', 'last_name', 'email')

        if search:
            users = users.filter(
                models.Q(first_name__icontains=search)
                | models.Q(last_name__icontains=search)
                | models.Q(email__icontains=search)
                | models.Q(promotion__icontains=search)
                | models.Q(campus__icontains=search)
            )

        serializer = UserSerializer(users[:200], many=True)
        return Response({
            'data': serializer.data,
            'roles': [
                {'value': value, 'label': label}
                for value, label in User.ROLE_CHOICES
            ],
        })


class AdminUserRoleUpdateView(APIView):
    permission_classes = [IsBureauOrAdmin]

    def patch(self, request, user_id):
        new_role = request.data.get('role')
        allowed_roles = {choice[0] for choice in User.ROLE_CHOICES}

        if new_role not in allowed_roles:
            return Response({'error': 'Rôle invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        requester = request.user

        if requester.id == target_user.id and requester.role != 'admin':
            return Response({'error': 'Vous ne pouvez pas modifier votre propre rôle.'}, status=status.HTTP_403_FORBIDDEN)

        if requester.role != 'admin' and (target_user.role == 'admin' or new_role == 'admin'):
            return Response(
                {'error': 'Seul un administrateur peut attribuer ou modifier le rôle admin.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if target_user.role == new_role:
            return Response({
                'message': 'Aucun changement nécessaire.',
                'data': UserSerializer(target_user).data,
            })

        target_user.role = new_role
        target_user.save()

        return Response({
            'message': 'Rôle mis à jour avec succès.',
            'data': UserSerializer(target_user).data,
        })


# =====================================================
# PROFIL LAURÉAT
# =====================================================

class LaureatProfileDetailView(APIView):
    """
    Endpoints pour le profil d'un lauréat.
    GET /api/laureats/<id>/profile/ - Récupérer le profil
    PUT /api/laureats/<id>/profile/ - Mettre à jour le profil
    """
    permission_classes = [IsAuthenticated]
    
    def get_laureat_profile(self, user_id, request_user):
        """Récupère le profil lauréat, en le créant si nécessaire."""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None, Response(
                {'error': 'Lauréat introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if user.role != 'laureat':
            return None, Response(
                {'error': 'Cet utilisateur n\'est pas un lauréat.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Obtenir ou créer le profil lauréat uniquement pour les lauréats
        profile, created = LaureatProfile.objects.get_or_create(user=user)
        
        return profile, None
    
    def get(self, request, user_id):
        """Récupère le profil complet d'un lauréat."""
        from .serializers import LaureatFullProfileSerializer, LaureatViewProfileSerializer
        
        profile, error_response = self.get_laureat_profile(user_id, request.user)
        if error_response:
            return error_response
        
        # Utiliser le serializer de vue profil pour la lecture
        serializer = LaureatViewProfileSerializer(profile)
        return Response(serializer.data)
    
    def put(self, request, user_id):
        """Met à jour le profil d'un lauréat."""
        from .serializers import LaureatFullProfileSerializer
        
        # Vérifier que l'utilisateur modifie son propre profil
        if str(request.user.id) != str(user_id):
            return Response(
                {'error': 'Vous ne pouvez modifier que votre propre profil.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        profile, error_response = self.get_laureat_profile(user_id, request.user)
        if error_response:
            return error_response
        
        # Validation email unique (si fourni dans la requête)
        new_email = request.data.get('email')
        if new_email and new_email != request.user.email:
            if User.objects.filter(email=new_email).exclude(id=request.user.id).exists():
                return Response({
                    'status': 409,
                    'error': 'Conflict',
                    'message': 'Cet email est déjà utilisé par un autre compte',
                    'details': {
                        'field': 'email',
                        'reason': 'Cet email est déjà utilisé par un autre compte'
                    }
                }, status=status.HTTP_409_CONFLICT)
        
        # Validation email professionnel unique (si fourni)
        job_email = request.data.get('jobEmail')
        if job_email:
            existing = LaureatProfile.objects.filter(
                professional_email=job_email
            ).exclude(user=request.user).exists()
            if existing:
                return Response({
                    'status': 400,
                    'error': 'Bad Request',
                    'message': 'Cet email professionnel est déjà utilisé',
                    'details': {
                        'field': 'jobEmail',
                        'reason': 'Cet email professionnel est déjà utilisé par un autre lauréat'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = LaureatFullProfileSerializer(profile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LaureatProfileImageView(APIView):
    """
    Upload de photo de profil pour lauréat.
    POST /api/laureats/<id>/profile/image/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        """Upload une photo de profil pour le lauréat."""
        # Vérifier que l'utilisateur modifie son propre profil
        if str(request.user.id) != str(user_id):
            return Response(
                {'error': 'Vous ne pouvez modifier que votre propre profil.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.user.role != 'laureat':
            return Response(
                {'error': 'Seuls les lauréats peuvent modifier ce profil.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Déléguer à la vue UserProfilePhotoView
        photo_view = UserProfilePhotoView()
        photo_view.request = request
        return photo_view.post(request)


class LaureatMentoringView(APIView):
    """
    Mise à jour de la disponibilité au mentorat.
    PATCH /api/laureats/<id>/mentoring/
    """
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, user_id):
        """Met à jour la disponibilité au mentorat."""
        # Vérifier que l'utilisateur modifie son propre profil
        if str(request.user.id) != str(user_id):
            return Response(
                {'error': 'Vous ne pouvez modifier que votre propre profil.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        is_mentor_available = request.data.get('isMentorAvailable')
        
        if is_mentor_available is None:
            return Response(
                {'error': 'Le champ isMentorAvailable est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(is_mentor_available, bool):
            return Response(
                {'error': 'isMentorAvailable doit être un booléen.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.user.role != 'laureat':
            return Response(
                {'error': 'Seuls les lauréats peuvent modifier ce profil.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        profile, created = LaureatProfile.objects.get_or_create(user=request.user)
        profile.available_for_mentoring = is_mentor_available
        profile.save()
        
        return Response({
            'isMentorAvailable': profile.available_for_mentoring
        })


# =====================================================
# HISTORIQUE ACADÉMIQUE ET PROFESSIONNEL
# =====================================================

class HistoriqueEntryListCreateView(APIView):
    """
    Liste et création d'entrées d'historique.
    GET /api/laureats/<id>/historique/ - Liste
    POST /api/laureats/<id>/historique/ - Création
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        """Liste les entrées d'historique d'un lauréat."""
        try:
            profile = LaureatProfile.objects.get(user_id=user_id)
        except LaureatProfile.DoesNotExist:
            return Response(
                {'error': 'Profil lauréat non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        entries = HistoriqueEntry.objects.filter(laureat=profile).order_by('-start_date')
        serializer = HistoriqueEntrySerializer(entries, many=True)
        return Response(serializer.data)
    
    def post(self, request, user_id):
        """Crée une nouvelle entrée d'historique."""
        # Vérifier que l'utilisateur modifie son propre profil
        if str(request.user.id) != str(user_id):
            return Response(
                {'error': 'Vous ne pouvez modifier que votre propre profil.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.user.role != 'laureat':
            return Response(
                {'error': 'Seuls les lauréats peuvent ajouter des entrées d\'historique.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        profile, created = LaureatProfile.objects.get_or_create(user=request.user)
        
        serializer = HistoriqueEntrySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(laureat=profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HistoriqueEntryDetailView(APIView):
    """
    Détail, mise à jour et suppression d'une entrée d'historique.
    GET /api/laureats/<id>/historique/<entry_id>/
    PUT /api/laureats/<id>/historique/<entry_id>/
    DELETE /api/laureats/<id>/historique/<entry_id>/
    """
    permission_classes = [IsAuthenticated]
    
    def get_entry(self, user_id, entry_id):
        """Récupère une entrée d'historique."""
        try:
            entry = HistoriqueEntry.objects.select_related('laureat__user').get(id=entry_id)
            if str(entry.laureat.user.id) != str(user_id):
                return None, Response(
                    {'error': 'Entrée non trouvée.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            return entry, None
        except HistoriqueEntry.DoesNotExist:
            return None, Response(
                {'error': 'Entrée non trouvée.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def get(self, request, user_id, entry_id):
        """Récupère le détail d'une entrée."""
        entry, error_response = self.get_entry(user_id, entry_id)
        if error_response:
            return error_response
        
        serializer = HistoriqueEntrySerializer(entry)
        return Response(serializer.data)
    
    def put(self, request, user_id, entry_id):
        """Met à jour une entrée d'historique."""
        # Vérifier que l'utilisateur modifie son propre profil
        if str(request.user.id) != str(user_id):
            return Response(
                {'error': 'Vous ne pouvez modifier que votre propre profil.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        entry, error_response = self.get_entry(user_id, entry_id)
        if error_response:
            return error_response
        
        serializer = HistoriqueEntrySerializer(entry, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, user_id, entry_id):
        """Supprime une entrée d'historique."""
        # Vérifier que l'utilisateur modifie son propre profil
        if str(request.user.id) != str(user_id):
            return Response(
                {'error': 'Vous ne pouvez modifier que votre propre profil.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        entry, error_response = self.get_entry(user_id, entry_id)
        if error_response:
            return error_response
        
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================
# COMPÉTENCES
# =====================================================

class CompetenceCategoryListView(APIView):
    """
    Liste des catégories de compétences.
    GET /api/competence-categories/
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Liste toutes les catégories de compétences."""
        categories = CompetenceCategory.objects.all().order_by('order', 'name')
        serializer = CompetenceCategorySerializer(categories, many=True, context={'request': request})
        return Response(serializer.data)


class UserCompetenceListCreateView(APIView):
    """
    Liste et création de compétences utilisateur.
    GET /api/laureats/<id>/competences/ - Liste
    POST /api/laureats/<id>/competences/ - Création
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        """Liste les compétences d'un lauréat groupées par catégorie."""
        try:
            profile = LaureatProfile.objects.get(user_id=user_id)
        except LaureatProfile.DoesNotExist:
            return Response(
                {'error': 'Profil lauréat non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Grouper par catégorie
        competences_by_category = {}
        for comp in profile.user_competences.select_related('category').all():
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
        
        return Response(list(competences_by_category.values()))
    
    def post(self, request, user_id):
        """Crée une nouvelle compétence utilisateur."""
        # Vérifier que l'utilisateur modifie son propre profil
        if str(request.user.id) != str(user_id):
            return Response(
                {'error': 'Vous ne pouvez modifier que votre propre profil.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.user.role != 'laureat':
            return Response(
                {'error': 'Seuls les lauréats peuvent ajouter des compétences.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        profile, created = LaureatProfile.objects.get_or_create(user=request.user)
        
        # Gérer la création de catégorie si nécessaire
        category_name = request.data.get('categoryName')
        category_id = request.data.get('category')
        
        if category_name and not category_id:
            from django.utils.text import slugify
            category, cat_created = CompetenceCategory.objects.get_or_create(
                slug=slugify(category_name),
                defaults={
                    "name": category_name,
                    "is_predefined": False
                }
            )
            category_id = category.id
        
        # Créer la compétence
        data = {
            'category': category_id,
            'name': request.data.get('name'),
            'level': request.data.get('level', ''),
        }
        
        serializer = UserCompetenceSerializer(data=data)
        if serializer.is_valid():
            # Vérifier l'unicité
            if UserCompetence.objects.filter(
                laureat=profile,
                category_id=category_id,
                name=data['name']
            ).exists():
                return Response(
                    {'error': 'Cette compétence existe déjà dans cette catégorie.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer.save(laureat=profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserCompetenceDetailView(APIView):
    """
    Détail, mise à jour et suppression d'une compétence.
    PUT /api/laureats/<id>/competences/<comp_id>/
    DELETE /api/laureats/<id>/competences/<comp_id>/
    """
    permission_classes = [IsAuthenticated]
    
    def get_competence(self, user_id, comp_id):
        """Récupère une compétence utilisateur."""
        try:
            comp = UserCompetence.objects.select_related('laureat__user', 'category').get(id=comp_id)
            if str(comp.laureat.user.id) != str(user_id):
                return None, Response(
                    {'error': 'Compétence non trouvée.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            return comp, None
        except UserCompetence.DoesNotExist:
            return None, Response(
                {'error': 'Compétence non trouvée.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def put(self, request, user_id, comp_id):
        """Met à jour une compétence."""
        # Vérifier que l'utilisateur modifie son propre profil
        if str(request.user.id) != str(user_id):
            return Response(
                {'error': 'Vous ne pouvez modifier que votre propre profil.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        comp, error_response = self.get_competence(user_id, comp_id)
        if error_response:
            return error_response
        
        serializer = UserCompetenceSerializer(comp, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, user_id, comp_id):
        """Supprime une compétence."""
        # Vérifier que l'utilisateur modifie son propre profil
        if str(request.user.id) != str(user_id):
            return Response(
                {'error': 'Vous ne pouvez modifier que votre propre profil.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        comp, error_response = self.get_competence(user_id, comp_id)
        if error_response:
            return error_response
        
        comp.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserCompetenceBulkDeleteView(APIView):
    """
    Suppression en masse des compétences d'une catégorie.
    DELETE /api/laureats/<id>/competences/category/<category_id>/
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, user_id, category_id):
        """Supprime toutes les compétences d'une catégorie pour un lauréat."""
        # Vérifier que l'utilisateur modifie son propre profil
        if str(request.user.id) != str(user_id):
            return Response(
                {'error': 'Vous ne pouvez modifier que votre propre profil.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = LaureatProfile.objects.get(user_id=user_id)
        except LaureatProfile.DoesNotExist:
            return Response(
                {'error': 'Profil lauréat non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        deleted_count, _ = UserCompetence.objects.filter(
            laureat=profile,
            category_id=category_id
        ).delete()
        
        return Response({
            'deleted': deleted_count,
            'message': f'{deleted_count} compétence(s) supprimée(s).'
        })


# =====================================================
# DASHBOARD
# =====================================================

class UserStatsView(APIView):
    """
    Statistiques personnelles de l'utilisateur connecté.
    GET /api/users/me/stats/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        activites_participees = user.activity_registrations.filter(status='confirmed').count()
        votes_count = user.votes.count() if hasattr(user, 'votes') else 0
        contacts_laureats = 0
        contributions = user.activities_created.count() if hasattr(user, 'activities_created') else 0
        evenements_ce_mois = Activity.objects.filter(
            event_date__gte=start_of_month,
            event_date__lte=now + timedelta(days=30),
            is_published=True,
        ).count()

        return Response(
            {
                'activities': activites_participees,
                'votes': votes_count,
                'connections': contacts_laureats,
                'contributions': contributions,
                'guides_consultes': 24,
                'guides_change': '+12%',
                'activites_participees': activites_participees,
                'activites_change': '+8%',
                'contacts_laureats': contacts_laureats,
                'contacts_change': '+0',
                'evenements_ce_mois': evenements_ce_mois,
                'evenements_change': '+0',
            }
        )


class NotificationsListView(APIView):
    """
    Liste des notifications de l'utilisateur connecté.
    GET /api/notifications/
    Query params:
    - type: activity|vote|message|system|announcement
    - unread: true|false
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notification_type = request.query_params.get("type")
        unread = request.query_params.get("unread")

        queryset = Notification.objects.filter(user=request.user).order_by("-created_at")
        ensure_upcoming_activity_notifications(request.user)
        queryset = Notification.objects.filter(user=request.user).order_by("-created_at")

        if notification_type:
            queryset = queryset.filter(type=notification_type)

        if unread is not None:
            unread_value = unread.lower() in ["1", "true", "yes"]
            queryset = queryset.filter(is_read=not unread_value)

        serializer = NotificationSerializer(queryset, many=True)
        return Response({"notifications": serializer.data})


class NotificationStatsView(APIView):
    """
    Statistiques des notifications de l'utilisateur connecté.
    GET /api/notifications/stats/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        week_start = now - timedelta(days=7)

        ensure_upcoming_activity_notifications(request.user)
        queryset = Notification.objects.filter(user=request.user)

        total = queryset.count()
        unread = queryset.filter(is_read=False).count()
        this_week = queryset.filter(created_at__gte=week_start).count()
        urgent = queryset.filter(is_read=False, type__in=["system", "announcement"]).count()

        by_type = {
            "activity": queryset.filter(type="activity").count(),
            "vote": queryset.filter(type="vote").count(),
            "message": queryset.filter(type="message").count(),
            "system": queryset.filter(type="system").count(),
            "announcement": queryset.filter(type="announcement").count(),
        }

        return Response(
            {
                "total": total,
                "unread": unread,
                "this_week": this_week,
                "urgent": urgent,
                "by_type": by_type,
            }
        )


class NotificationMarkReadView(APIView):
    """
    Marquer une notification comme lue.
    PATCH /api/notifications/<id>/read/
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=["is_read", "read_at"])

        return Response({"success": True, "notification": NotificationSerializer(notification).data})


class NotificationsMarkAllReadView(APIView):
    """
    Marquer toutes les notifications de l'utilisateur comme lues.
    POST /api/notifications/mark-all-read/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        now = timezone.now()
        updated = Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True,
            read_at=now,
        )

        return Response({"success": True, "updated": updated})


class NotificationDeleteView(APIView):
    """
    Supprimer une notification de l'utilisateur connecté.
    DELETE /api/notifications/<id>/
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, notification_id):
        deleted, _ = Notification.objects.filter(id=notification_id, user=request.user).delete()

        if not deleted:
            return Response(
                {"detail": "Notification introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


class GuidesView(APIView):
    """
    Liste des guides d'intégration.
    GET /api/guides/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Retourne la liste des guides."""
        from .serializers import SchoolGuideSerializer
        
        guides = SchoolGuide.objects.filter(is_published=True)
        serializer = SchoolGuideSerializer(guides, many=True)
        
        # Formater pour le frontend
        result = []
        for guide in serializer.data:
            result.append({
                'id': guide['id'],
                'titre': guide['title'],
                'url_pdf': guide.get('url_pdf', '')
            })
        
        return Response(result)


class AnnoncesView(APIView):
    """
    Liste des annonces récentes.
    GET /api/annonces/
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Retourne les annonces récentes."""
        from django.utils import timezone
        from .serializers import AnnouncementSerializer
        
        now = timezone.now()
        annonces = Announcement.objects.filter(
            is_published=True,
            valid_from__lte=now
        ).filter(
            models.Q(valid_until__isnull=True) | models.Q(valid_until__gte=now)
        ).order_by('-is_pinned', '-created_at')[:10]
        
        serializer = AnnouncementSerializer(annonces, many=True)
        
        # Formater pour le frontend
        result = []
        for annonce in serializer.data:
            result.append({
                'id': annonce['id'],
                'titre': annonce['title'],
                'temps_relatif': annonce.get('temps_relatif', ''),
                'date': annonce['created_at']
            })
        
        return Response(result)


# =====================================================
# SYSTÈME DE VOTE
# =====================================================

class ActiveVoteSessionView(APIView):
    """
    Récupère la session de vote active.
    GET /api/votes/session-active/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Retourne la session de vote active avec les candidats."""
        from .serializers import VoteSessionSerializer
        
        now = timezone.now()
        
        # Trouver une session en phase de vote
        active_session = VoteSession.objects.filter(
            status='active',
            start_date__lte=now,
            end_date__gte=now
        ).first()

        # Trouver une session en phase d'appel a candidatures
        candidacy_session = VoteSession.objects.filter(
            status__in=['draft', 'active'],
            candidacy_start_date__isnull=False,
            candidacy_end_date__isnull=False,
            candidacy_start_date__lte=now,
            candidacy_end_date__gte=now,
        ).order_by('candidacy_start_date').first()

        if candidacy_session and not active_session:
            user_candidatures = Candidate.objects.filter(
                position__vote_session=candidacy_session,
                user=request.user,
            )

            user_candidature_position_ids = list(
                user_candidatures.values_list('position_id', flat=True)
            )

            positions = []
            for position in candidacy_session.positions.all():
                positions.append({
                    'id': position.id,
                    'title': position.title,
                    'description': position.description,
                    'display_order': position.display_order,
                    'candidates': [],
                })

            return Response({
                'active': False,
                'period_status': 'candidacy_open',
                'phase': 'candidacy',
                'can_apply': True,
                'can_vote': False,
                'message': 'L\'appel a candidatures est ouvert.',
                'session': VoteSessionSerializer(candidacy_session).data,
                'positions': positions,
                'user_candidature_position_ids': user_candidature_position_ids,
            })
        
        if not active_session:
            upcoming_session = VoteSession.objects.filter(
                models.Q(candidacy_start_date__gt=now) | models.Q(start_date__gt=now),
                status__in=['draft', 'active']
            ).order_by('candidacy_start_date', 'start_date').first()

            last_closed_session = VoteSession.objects.filter(
                end_date__lt=now
            ).order_by('-end_date').first()

            if upcoming_session:
                return Response({
                    'active': False,
                    'period_status': 'upcoming',
                    'message': 'Le vote n\'est pas encore ouvert.',
                    'next_session': VoteSessionSerializer(upcoming_session).data,
                })

            if last_closed_session:
                return Response({
                    'active': False,
                    'period_status': 'closed',
                    'message': 'La periode de vote est terminee. Prochaine session l\'annee prochaine.',
                    'last_session': VoteSessionSerializer(last_closed_session).data,
                })

            return Response({
                'active': False,
                'period_status': 'none',
                'message': 'Aucune session de vote active.'
            })
        
        # Récupérer les candidats groupés par poste
        positions = []
        for position in active_session.positions.all():
            position_candidates = []
            for candidate in position.candidates.filter(is_approved=True):
                position_candidates.append({
                    'id': candidate.id,
                    'position_id': position.id,
                    'position_title': position.title,
                    'name': candidate.user.full_name,
                    'first_name': candidate.user.first_name,
                    'last_name': candidate.user.last_name,
                    'photo_url': candidate.photo_url,
                    'motivation': candidate.motivation,
                    'program': candidate.program,
                    'votes_count': candidate.votes_count if active_session.results_published else None
                })

            positions.append({
                'id': position.id,
                'title': position.title,
                'description': position.description,
                'display_order': position.display_order,
                'candidates': position_candidates,
            })
        
        # Vérifier si l'utilisateur a déjà voté
        user_votes = Vote.objects.filter(
            vote_session=active_session,
            user=request.user
        )

        voted_position_ids = list(user_votes.values_list('position_id', flat=True))
        voted_candidate_ids = list(user_votes.values_list('candidate_id', flat=True))

        user_has_voted = bool(voted_position_ids)
        
        return Response({
            'active': True,
            'period_status': 'active',
            'phase': 'voting',
            'can_apply': False,
            'can_vote': True,
            'session': VoteSessionSerializer(active_session).data,
            'positions': positions,
            'user_has_voted': user_has_voted,
            'voted_position_ids': voted_position_ids,
            'voted_candidate_ids': voted_candidate_ids,
        })


class AdminVoteSessionsListView(APIView):
    """Expose un tableau de bord des sessions de vote sans révéler les votes individuels."""

    permission_classes = [IsAuthenticated, IsBureauOrAdmin]

    def post(self, request):
        raw_year = request.data.get('year')

        try:
            year = int(raw_year)
        except (TypeError, ValueError):
            return Response({'error': 'Année invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        if year < 2020 or year > 2100:
            return Response({'error': 'Année hors plage autorisée.'}, status=status.HTTP_400_BAD_REQUEST)

        session_title = f"Elections Bureau CEEAM {year}"
        if VoteSession.objects.filter(title=session_title).exists():
            return Response(
                {'error': 'Une session existe déjà pour cette année.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        start_date = timezone.make_aware(datetime(year, 10, 1, 8, 0, 0))
        end_date = start_date + timedelta(days=6, hours=15, minutes=59, seconds=59)
        candidacy_start_date = start_date - timedelta(days=14)
        candidacy_end_date = start_date - timedelta(minutes=1)

        session = VoteSession.objects.create(
            title=session_title,
            description=f"Session annuelle des elections du bureau CEEAM pour l'annee {year}.",
            candidacy_start_date=candidacy_start_date,
            candidacy_end_date=candidacy_end_date,
            start_date=start_date,
            end_date=end_date,
            status='draft',
            created_by=request.user,
        )

        _ensure_vote_session_positions(session)

        _audit_log(
            request,
            action='create',
            entity_type='vote_session',
            entity_id=session.id,
            changes={
                'year': year,
                'title': session.title,
                'positions_count': session.positions.count(),
            },
        )

        return Response(
            {
                'message': 'Session de vote créée avec succès.',
                'data': {
                    'id': session.id,
                    'title': session.title,
                    'positions_count': session.positions.count(),
                },
            },
            status=status.HTTP_201_CREATED,
        )

    def get(self, request):
        now = timezone.now()
        sessions = (
            VoteSession.objects.annotate(
                positions_count=models.Count('positions', distinct=True),
                approved_candidates_count=models.Count(
                    'positions__candidates',
                    filter=models.Q(positions__candidates__is_approved=True),
                    distinct=True,
                ),
                total_votes=models.Count('votes', distinct=True),
            )
            .select_related('created_by')
            .order_by('-start_date')[:20]
        )

        data = []
        for session in sessions:
            is_voting_open = session.status == 'active' and session.start_date <= now <= session.end_date
            is_candidacy_open = (
                session.status in {'draft', 'active'}
                and session.candidacy_start_date
                and session.candidacy_end_date
                and session.candidacy_start_date <= now <= session.candidacy_end_date
                and not is_voting_open
            )

            if is_voting_open:
                phase = 'voting'
            elif is_candidacy_open:
                phase = 'candidacy'
            elif session.status == 'closed' or session.end_date < now:
                phase = 'closed'
            else:
                phase = 'scheduled'

            data.append({
                'id': session.id,
                'title': session.title,
                'description': session.description,
                'status': session.status,
                'phase': phase,
                'candidacy_start_date': session.candidacy_start_date,
                'candidacy_end_date': session.candidacy_end_date,
                'start_date': session.start_date,
                'end_date': session.end_date,
                'results_published': session.results_published,
                'positions_count': session.positions_count,
                'approved_candidates_count': session.approved_candidates_count,
                'total_votes': session.total_votes,
                'created_at': session.created_at,
                'created_by_name': session.created_by.full_name if session.created_by else None,
                'can_open': not is_voting_open and session.approved_candidates_count > 0,
                'can_close': is_voting_open,
            })

        return Response({'data': data})


class AdminVoteSessionConfigView(APIView):
    permission_classes = [IsAuthenticated, IsBureauOrAdmin]

    def get(self, request, session_id):
        try:
            session = VoteSession.objects.get(id=session_id)
        except VoteSession.DoesNotExist:
            return Response({'error': 'Session introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        positions = (
            Position.objects.filter(vote_session=session)
            .select_related('bureau_position')
            .prefetch_related('candidates__user', 'candidates__votes')
            .order_by('display_order', 'id')
        )

        return Response({
            'data': {
                'session': {
                    'id': session.id,
                    'title': session.title,
                    'status': session.status,
                    'start_date': session.start_date,
                    'end_date': session.end_date,
                    'candidacy_start_date': session.candidacy_start_date,
                    'candidacy_end_date': session.candidacy_end_date,
                },
                'configuration_locked': _vote_session_configuration_locked(session),
                'positions': [_serialize_admin_vote_position(position) for position in positions],
            }
        })


class AdminVotePositionCreateView(APIView):
    permission_classes = [IsAuthenticated, IsBureauOrAdmin]

    def post(self, request, session_id):
        try:
            session = VoteSession.objects.get(id=session_id)
        except VoteSession.DoesNotExist:
            return Response({'error': 'Session introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if _vote_session_configuration_locked(session):
            return Response(
                {'error': 'La configuration des postes est verrouillée pour cette session.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        title = (request.data.get('title') or '').strip()
        description = (request.data.get('description') or '').strip()

        if not title:
            return Response({'error': 'Le titre du poste est requis.'}, status=status.HTTP_400_BAD_REQUEST)

        display_order = Position.objects.filter(vote_session=session).count()
        position = Position.objects.create(
            vote_session=session,
            title=title,
            description=description,
            display_order=display_order,
        )

        _audit_log(
            request,
            action='create',
            entity_type='vote_position',
            entity_id=position.id,
            changes={'session_id': session.id, 'title': position.title},
        )

        return Response(
            {'message': 'Poste ajouté avec succès.', 'data': _serialize_admin_vote_position(position)},
            status=status.HTTP_201_CREATED,
        )


class AdminVotePositionDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsBureauOrAdmin]

    def delete(self, request, position_id):
        try:
            position = Position.objects.select_related('vote_session').get(id=position_id)
        except Position.DoesNotExist:
            return Response({'error': 'Poste introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if _vote_session_configuration_locked(position.vote_session):
            return Response(
                {'error': 'Ce poste ne peut plus être supprimé pour cette session.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if position.candidates.exists():
            return Response(
                {'error': 'Supprimez d’abord les candidats liés à ce poste.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        position_title = position.title
        position.delete()

        _audit_log(
            request,
            action='delete',
            entity_type='vote_position',
            changes={'position_title': position_title},
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminVoteCandidateCreateView(APIView):
    permission_classes = [IsAuthenticated, IsBureauOrAdmin]

    def post(self, request, position_id):
        try:
            position = Position.objects.select_related('vote_session').get(id=position_id)
        except Position.DoesNotExist:
            return Response({'error': 'Poste introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        session = position.vote_session
        if _vote_session_configuration_locked(session):
            return Response(
                {'error': 'Les candidats ne peuvent plus être modifiés pour cette session.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id est requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        other_position_candidate = Candidate.objects.filter(
            position__vote_session=session,
            user=user,
        ).exclude(position=position).first()
        if other_position_candidate:
            return Response(
                {'error': 'Cet utilisateur est déjà candidat pour un autre poste dans cette session.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        motivation = (request.data.get('motivation') or '').strip()
        program = (request.data.get('program') or '').strip()
        photo_url = (request.data.get('photo_url') or '').strip()

        candidate, created = Candidate.objects.get_or_create(
            position=position,
            user=user,
            defaults={
                'motivation': motivation,
                'program': program,
                'photo_url': photo_url,
                'is_approved': True,
            },
        )

        if not created:
            candidate.motivation = motivation or candidate.motivation
            candidate.program = program or candidate.program
            candidate.photo_url = photo_url or candidate.photo_url
            candidate.is_approved = True
            candidate.save(update_fields=['motivation', 'program', 'photo_url', 'is_approved'])

        _audit_log(
            request,
            action='create' if created else 'update',
            entity_type='vote_candidate',
            entity_id=candidate.id,
            changes={'position_id': position.id, 'candidate_user_id': user.id, 'approved': True},
        )

        return Response(
            {'message': 'Candidat affecté avec succès.', 'data': _serialize_admin_vote_candidate(candidate)},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class AdminVoteCandidateApprovalView(APIView):
    permission_classes = [IsAuthenticated, IsBureauOrAdmin]

    def patch(self, request, candidate_id):
        try:
            candidate = Candidate.objects.select_related('position__vote_session', 'user').get(id=candidate_id)
        except Candidate.DoesNotExist:
            return Response({'error': 'Candidat introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if _vote_session_configuration_locked(candidate.position.vote_session):
            return Response(
                {'error': 'Le statut du candidat ne peut plus être modifié pour cette session.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_approved = request.data.get('is_approved')
        if not isinstance(is_approved, bool):
            return Response({'error': 'is_approved doit être un booléen.'}, status=status.HTTP_400_BAD_REQUEST)

        candidate.is_approved = is_approved
        candidate.save(update_fields=['is_approved'])

        _audit_log(
            request,
            action='update',
            entity_type='vote_candidate',
            entity_id=candidate.id,
            changes={'approved': candidate.is_approved},
        )

        return Response({'message': 'Statut du candidat mis à jour.', 'data': _serialize_admin_vote_candidate(candidate)})


class AdminVoteCandidateDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsBureauOrAdmin]

    def delete(self, request, candidate_id):
        try:
            candidate = Candidate.objects.select_related('position__vote_session', 'user').get(id=candidate_id)
        except Candidate.DoesNotExist:
            return Response({'error': 'Candidat introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if _vote_session_configuration_locked(candidate.position.vote_session) or candidate.votes.exists():
            return Response(
                {'error': 'Ce candidat ne peut plus être supprimé.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        candidate.delete()

        _audit_log(
            request,
            action='delete',
            entity_type='vote_candidate',
            changes={'candidate_user_id': candidate.user_id, 'position_id': candidate.position_id},
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class SubmitCandidatureView(APIView):
    """
    Soumettre une candidature pendant l'appel a candidatures.
    POST /api/votes/<session_id>/candidatures/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = VoteSession.objects.get(id=session_id, status__in=['draft', 'active'])
        except VoteSession.DoesNotExist:
            return Response(
                {'error': 'Session de vote introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not session.candidacy_start_date or not session.candidacy_end_date:
            return Response(
                {'error': 'Aucune phase de candidature configuree pour cette session.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now()
        if now < session.candidacy_start_date or now > session.candidacy_end_date:
            return Response(
                {'error': 'La periode de candidature est fermee.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        position_id = request.data.get('position_id')
        if not position_id:
            return Response(
                {'error': 'position_id est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            position = Position.objects.get(id=position_id, vote_session=session)
        except Position.DoesNotExist:
            return Response(
                {'error': 'Poste introuvable pour cette session.'},
                status=status.HTTP_404_NOT_FOUND
            )

        requires_one_year = bool(
            getattr(position, "bureau_position", None)
            and position.bureau_position.requires_one_year_min
        )

        if requires_one_year:
            vote_year = session.start_date.year
            promo_year = _extract_year_from_promotion(request.user.promotion)

            if promo_year is None:
                return Response(
                    {
                        'error': (
                            "Votre promotion ne permet pas de verifier l'eligibilite pour ce poste. "
                            "Mettez a jour votre promotion dans votre profil."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            years_completed = vote_year - promo_year
            if years_completed < 1:
                return Response(
                    {
                        'error': (
                            "Vous devez avoir accompli au moins une annee a l'ecole "
                            "pour candidater a ce poste."
                        ),
                        'details': {
                            'vote_year': vote_year,
                            'promotion_year': promo_year,
                            'years_completed': years_completed,
                            'required_min_years': 1,
                        },
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if Candidate.objects.filter(position__vote_session=session, user=request.user).exists():
            return Response(
                {'error': 'Vous avez deja candidate pour cette session.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        motivation = request.data.get('motivation', '')
        program = request.data.get('program', '')
        photo_url = request.data.get('photo_url', '')

        candidate = Candidate.objects.create(
            position=position,
            user=request.user,
            motivation=motivation,
            program=program,
            photo_url=photo_url,
            is_approved=False,
        )

        _audit_log(
            request,
            action='create',
            entity_type='candidate',
            entity_id=candidate.id,
            changes={
                'session_id': session.id,
                'position_id': position.id,
                'candidate_user_id': request.user.id,
                'approved': candidate.is_approved,
            },
        )

        return Response(
            {
                'success': True,
                'message': 'Candidature soumise. Elle sera examinee par l\'administration.',
                'candidate_id': candidate.id,
                'approved': candidate.is_approved,
            },
            status=status.HTTP_201_CREATED,
        )


class OpenCandidacyPhaseView(APIView):
    """Action admin: ouvrir la phase de candidature pour une session."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, session_id):
        try:
            session = VoteSession.objects.get(id=session_id)
        except VoteSession.DoesNotExist:
            return Response({'error': 'Session introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        session.status = 'active'
        session.candidacy_start_date = now
        session.candidacy_end_date = now + timedelta(days=7)

        if session.start_date <= session.candidacy_end_date:
            session.start_date = session.candidacy_end_date + timedelta(days=1)
            if session.end_date <= session.start_date:
                session.end_date = session.start_date + timedelta(days=7)

        session.save()

        _audit_log(
            request,
            action='update',
            entity_type='vote_session_phase',
            entity_id=session.id,
            changes={
                'operation': 'open_candidacy',
                'status': session.status,
                'candidacy_start_date': session.candidacy_start_date.isoformat() if session.candidacy_start_date else None,
                'candidacy_end_date': session.candidacy_end_date.isoformat() if session.candidacy_end_date else None,
                'start_date': session.start_date.isoformat() if session.start_date else None,
                'end_date': session.end_date.isoformat() if session.end_date else None,
            },
        )

        return Response({'success': True, 'message': 'Phase de candidature ouverte.'})


class StartVotingPhaseView(APIView):
    """Action admin: demarrer la phase de vote pour une session."""
    permission_classes = [IsAuthenticated, IsBureauOrAdmin]

    def post(self, request, session_id):
        try:
            session = VoteSession.objects.get(id=session_id)
        except VoteSession.DoesNotExist:
            return Response({'error': 'Session introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()

        if Candidate.objects.filter(position__vote_session=session, is_approved=True).count() == 0:
            return Response(
                {'error': 'Aucun candidat approuve pour lancer le vote.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.status = 'active'
        session.start_date = now
        if session.end_date <= session.start_date:
            session.end_date = session.start_date + timedelta(days=7)

        if not session.candidacy_start_date:
            session.candidacy_start_date = now - timedelta(days=7)
        if not session.candidacy_end_date or session.candidacy_end_date > now:
            session.candidacy_end_date = now - timedelta(minutes=1)

        session.save()

        _audit_log(
            request,
            action='update',
            entity_type='vote_session_phase',
            entity_id=session.id,
            changes={
                'operation': 'start_voting',
                'status': session.status,
                'start_date': session.start_date.isoformat() if session.start_date else None,
                'end_date': session.end_date.isoformat() if session.end_date else None,
                'candidacy_end_date': session.candidacy_end_date.isoformat() if session.candidacy_end_date else None,
            },
        )

        return Response({'success': True, 'message': 'Phase de vote demarree.'})


class CloseVoteSessionView(APIView):
    """Action admin: cloturer une session de vote."""
    permission_classes = [IsAuthenticated, IsBureauOrAdmin]

    def post(self, request, session_id):
        try:
            session = VoteSession.objects.get(id=session_id)
        except VoteSession.DoesNotExist:
            return Response({'error': 'Session introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        session.status = 'closed'
        session.end_date = now
        session.save(update_fields=['status', 'end_date'])

        _audit_log(
            request,
            action='update',
            entity_type='vote_session_phase',
            entity_id=session.id,
            changes={
                'operation': 'close_session',
                'status': session.status,
                'end_date': session.end_date.isoformat() if session.end_date else None,
            },
        )

        return Response({'success': True, 'message': 'Session cloturee.'})


class RenewBureauMembersView(APIView):
    """Action admin: renouveler la table BureauMember a partir des resultats de vote."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, session_id):
        force = bool(request.data.get("force", False))

        try:
            session = VoteSession.objects.get(id=session_id)
        except VoteSession.DoesNotExist:
            return Response({"error": "Session introuvable."}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        if not force and session.status != "closed" and session.end_date > now:
            return Response(
                {
                    "error": (
                        "La session doit etre cloturee (ou terminee) avant renouvellement du bureau. "
                        "Utilisez force=true si necessaire."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        summary = _renew_bureau_members_from_session(session)

        _audit_log(
            request,
            action="update",
            entity_type="bureau_member_renewal",
            entity_id=session.id,
            changes={
                "session_id": session.id,
                "session_title": session.title,
                "mandate_year": summary["mandate_year"],
                "force": force,
                "results_count": len(summary["results"]),
            },
        )

        return Response({
            "success": True,
            "message": "Renouvellement du bureau termine.",
            "summary": summary,
        })


class SubmitVoteView(APIView):
    """
    Soumettre un vote.
    POST /api/votes/<session_id>/voter/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, session_id):
        """Enregistre le vote de l'utilisateur."""
        import hashlib
        from django.utils import timezone
        
        candidate_id = request.data.get('candidat_id')
        
        if not candidate_id:
            return Response(
                {'error': 'candidat_id est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier la session
        try:
            session = VoteSession.objects.get(id=session_id, status='active')
        except VoteSession.DoesNotExist:
            return Response(
                {'error': 'Session de vote introuvable ou inactive.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        now = timezone.now()
        if now < session.start_date or now > session.end_date:
            return Response(
                {'error': 'La session de vote n\'est pas ouverte.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier le candidat
        try:
            candidate = Candidate.objects.select_related('position').get(id=candidate_id, is_approved=True)
        except Candidate.DoesNotExist:
            return Response(
                {'error': 'Candidat introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Le candidat doit appartenir à la session de vote ciblée
        if candidate.position.vote_session_id != session.id:
            return Response(
                {'error': 'Ce candidat ne fait pas partie de cette session de vote.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que l'utilisateur n'a pas déjà voté pour ce poste
        if Vote.objects.filter(
            vote_session=session,
            position=candidate.position,
            user=request.user
        ).exists():
            return Response(
                {'error': 'Vous avez déjà voté pour ce poste.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer le vote avec un hash unique
        vote_string = f"{session.id}-{candidate.position.id}-{request.user.id}-{timezone.now().isoformat()}"
        vote_hash = hashlib.sha256(vote_string.encode()).hexdigest()
        
        vote = Vote.objects.create(
            vote_session=session,
            position=candidate.position,
            user=request.user,
            candidate=candidate,
            vote_hash=vote_hash
        )
        notify_vote_submitted(vote)

        _audit_log(
            request,
            action='create',
            entity_type='vote',
            entity_id=vote.id,
            changes={
                'vote_session_id': session.id,
                'position_id': candidate.position.id,
                'candidate_id': candidate.id,
                'voter_user_id': request.user.id,
            },
        )
        
        return Response({
            'success': True,
            'message': f'Vote enregistré pour {candidate.user.full_name}'
        }, status=status.HTTP_201_CREATED)


class LaureatListView(APIView):
    """
    Liste des lauréats avec filtres.
    GET /api/laureats/
    Accessible sans authentification (affiche uniquement les profils publics)
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Retourne la liste paginee des laureats (format principal + compatibilite legacy)."""
        search = request.query_params.get('search', '').strip()
        promotion = request.query_params.get('promotion', request.query_params.get('promo', '')).strip()
        specialite = request.query_params.get('specialite', '').strip()

        try:
            page = max(int(request.query_params.get('page', 1)), 1)
            limit = max(int(request.query_params.get('limit', 6)), 1)
        except ValueError:
            return Response(
                {
                    'status': 400,
                    'error': 'Bad Request',
                    'message': 'Parametres de pagination invalides.',
                    'details': None,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = LaureatProfile.objects.select_related('user', 'user__specialite', 'work_country').filter(
            is_public=True,
            user__role='laureat'
        )

        if search:
            queryset = queryset.filter(
                models.Q(user__first_name__icontains=search)
                | models.Q(user__last_name__icontains=search)
                | models.Q(user__specialite__intitule__icontains=search)
                | models.Q(company__icontains=search)
                | models.Q(current_position__icontains=search)
            )

        if promotion:
            queryset = queryset.filter(user__promotion=promotion)

        if specialite:
            queryset = queryset.filter(user__specialite__intitule__iexact=specialite)

        total = queryset.count()
        start = (page - 1) * limit
        end = start + limit
        laureats = queryset[start:end]

        data = []
        for laureat in laureats:
            photo_url = None
            raw_photo = laureat.user.avatar_url
            if raw_photo:
                # Utilise _resolve_media_url qui gère S3 et les URLs locales correctement
                photo_url = _resolve_media_url(str(raw_photo))
                # Si c'est une URL relative, la rendre absolue
                if photo_url and not photo_url.startswith('http://') and not photo_url.startswith('https://'):
                    photo_url = request.build_absolute_uri(photo_url)

            full_name = f"{laureat.user.last_name} {laureat.user.first_name}".strip()
            country_label = ''
            if laureat.work_country:
                country_label = f"{laureat.work_country.flag_emoji} {laureat.work_country.name}".strip()

            item = {
                'id': laureat.user.id,
                'nom': full_name,
                'promotion': laureat.user.promotion or '',
                'specialite': laureat.user.specialite.intitule if laureat.user.specialite else '',
                'poste': laureat.current_position or '',
                'entreprise': laureat.company or '',
                'ville': f"{laureat.work_city}, {laureat.work_country.name}" if laureat.work_country and laureat.work_city else (laureat.work_city or ''),
                'pays': country_label,
                # Champs legacy conserves pour les ecrans existants.
                'prenom': laureat.user.first_name,
                'localisation': f"{laureat.work_city}, {laureat.work_country.name}" if laureat.work_country and laureat.work_city else (laureat.work_city or ''),
                'country': laureat.work_country.name if laureat.work_country else '',
                'countryFlag': laureat.work_country.flag_emoji if laureat.work_country else '',
                'position': laureat.current_position or '',
                'name': full_name,
            }
            if photo_url:
                item['photo'] = photo_url
                item['photoUrl'] = photo_url

            data.append(item)

        response = {
            # Format demande dans le cahier taf.
            'data': data,
            'total': total,
            'page': page,
            'limit': limit,
            # Format legacy conserve pour compatibilite.
            'count': total,
            'next': f'/api/laureats/?page={page + 1}&limit={limit}' if end < total else None,
            'results': data,
        }
        return Response(response)

#========================================================

class LaureatStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        total_laureats = User.objects.filter(role='laureat').count()
        total_companies = LaureatProfile.objects.exclude(company='').values('company').distinct().count()
        total_countries = LaureatProfile.objects.exclude(work_country__isnull=True).values('work_country').distinct().count()
        employed = LaureatProfile.objects.exclude(company='').count()
        employment_rate = (employed / total_laureats * 100) if total_laureats > 0 else 0

        return Response({
            # Format demande dans le cahier taf.
            'totalLaureats': total_laureats,
            'totalEntreprises': total_companies,
            'totalPays': total_countries,
            'tauxEmploi': round(employment_rate),
            # Champs legacy conserves pour compatibilite.
            'totalCompanies': total_companies,
            'totalCountries': total_countries,
            'employmentRate': round(employment_rate),
        })


class LaureatFilterOptionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        promotions = User.objects.filter(role='laureat', promotion__isnull=False, promotion__gt='').values_list('promotion', flat=True).distinct().order_by('-promotion')
        specialities = Specialite.objects.filter(is_active=True).values_list('intitule', flat=True).distinct().order_by('intitule')

        return Response({
            'promotions': ['Toutes les promos'] + list(promotions),
            'specialities': ['Toutes les spécialités'] + list(specialities)
        })


class LaureatPromotionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        promotions = list(
            User.objects.filter(role='laureat', promotion__isnull=False)
            .exclude(promotion='')
            .values_list('promotion', flat=True)
            .distinct()
            .order_by('-promotion')
        )
        return Response({'data': promotions})


class LaureatSpecialitesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        specialites = list(
            Specialite.objects.filter(is_active=True)
            .values_list('intitule', flat=True)
            .distinct()
            .order_by('intitule')
        )
        return Response({'data': specialites})


class LaureatJoinRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LaureatJoinRequestSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(
                {
                    'status': 400,
                    'error': 'Bad Request',
                    'message': 'Donnees invalides.',
                    'details': serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        pending_query = LaureatJoinRequest.objects.filter(status='pending')
        if serializer.validated_data.get('contact'):
            pending_query = pending_query.filter(contact=serializer.validated_data['contact'])
        else:
            pending_query = pending_query.filter(user=request.user)

        pending_exists = pending_query.exists()
        if pending_exists:
            return Response(
                {
                    'status': 409,
                    'error': 'Conflict',
                    'message': 'Une demande est deja en attente pour ce contact.',
                    'details': {'field': 'contact', 'reason': 'pending_request_exists'},
                },
                status=status.HTTP_409_CONFLICT,
            )

        join_request = serializer.save(user=request.user)
        notify_laureat_request_submitted(join_request)
        return Response(
            {
                'id': join_request.id,
                'status': join_request.status,
                'message': "Votre demande a ete soumise. Elle sera examinee par l'equipe CEEAM.",
                'submittedAt': join_request.submitted_at,
            },
            status=status.HTTP_201_CREATED,
        )


class LaureatMyJoinRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requests_qs = LaureatJoinRequest.objects.filter(user=request.user).order_by('-submitted_at')
        serializer = LaureatJoinRequestAdminSerializer(requests_qs, many=True)
        return Response({'data': serializer.data})


class LaureatJoinRequestAdminListView(APIView):
    permission_classes = [IsBureauOrAdmin]

    def get(self, request):
        status_filter = request.query_params.get('status', '').strip()
        qs = LaureatJoinRequest.objects.select_related('user').all().order_by('-submitted_at')

        if status_filter in {'pending', 'approved', 'rejected'}:
            qs = qs.filter(status=status_filter)

        serializer = LaureatJoinRequestAdminSerializer(qs, many=True)
        return Response({'data': serializer.data, 'total': qs.count()})


class LaureatJoinRequestAdminStatusView(APIView):
    permission_classes = [IsBureauOrAdmin]

    def patch(self, request, request_id):
        serializer = LaureatJoinRequestStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    'status': 400,
                    'error': 'Bad Request',
                    'message': 'Statut invalide.',
                    'details': serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            join_request = LaureatJoinRequest.objects.select_related('user').get(id=request_id)
        except LaureatJoinRequest.DoesNotExist:
            return Response(
                {
                    'status': 404,
                    'error': 'Not Found',
                    'message': 'Demande introuvable.',
                    'details': {'field': 'id', 'reason': 'not_found'},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        previous_status = join_request.status
        new_status = serializer.validated_data['status']
        join_request.status = new_status
        join_request.save(update_fields=['status'])

        if new_status == 'approved' and join_request.user:
            apply_laureat_join_request_approval(join_request, build_frontend_url(request))

        if previous_status != new_status:
            notify_laureat_request_status(join_request)

        return Response(
            {
                'message': 'Statut de la demande mis a jour.',
                'data': LaureatJoinRequestAdminSerializer(join_request).data,
            }
        )

        return Response({
            'id': join_request.id,
            'status': join_request.status,
            'message': 'Statut de la demande mis a jour.',
        })


class LaureatDetailSimpleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            laureat = LaureatProfile.objects.select_related('user', 'user__specialite', 'work_country').get(user_id=user_id, is_public=True)
        except LaureatProfile.DoesNotExist:
            return Response({'error': 'Lauréat non trouvé ou profil privé'}, status=404)

        data = {
            'id': laureat.user.id,
            'name': laureat.user.full_name,
            'speciality': laureat.user.specialite.intitule if laureat.user.specialite else '',
            'company': laureat.company,
            'promo': laureat.user.promotion,
            'location': f"{laureat.work_city}, {laureat.work_country.name}" if laureat.work_country else laureat.work_city,
        }
        return Response(data)



class LaureatDetailPublicView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            profile = LaureatProfile.objects.select_related('user', 'work_country').prefetch_related('historique_entries', 'user_competences').get(user_id=user_id)
        except LaureatProfile.DoesNotExist:
            return Response({'error': 'Lauréat non trouvé'}, status=404)

        if not profile.is_public:
            return Response({'error': 'Ce profil n\'est pas accessible'}, status=403)

        serializer = LaureatDetailSerializer(profile, context={'request': request})
        return Response(serializer.data)


class LaureatMyProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.laureat_profile
        except LaureatProfile.DoesNotExist:
            return Response(
                {'error': 'Profil lauréat non trouvé. Vous devez avoir le rôle "lauréat".'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = LaureatViewProfileSerializer(profile)
        return Response(serializer.data)

#=====================================================

class AboutStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        stats = AboutStat.objects.all()
        serializer = AboutStatSerializer(stats, many=True)
        return Response({"data": serializer.data})


class AboutLeadersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        mandat = request.query_params.get('mandat')
        qs = Leader.objects.filter(is_active=True)
        if mandat:
            qs = qs.filter(mandat=mandat)
        else:
            # par défaut, prendre le mandat le plus récent ou celui marqué comme courant
            qs = qs.order_by('-mandat')
        serializer = LeaderSerializer(qs, many=True)

        former_secretaries_qs = BureauMember.objects.select_related('user', 'user__specialite').filter(
            position__in=['SG', 'sg'],
            is_current=False,
        ).order_by('-mandate_year', 'display_order')[:5]

        if not former_secretaries_qs.exists():
            former_secretaries_qs = BureauMember.objects.select_related('user', 'user__specialite').filter(
                position__in=['SG', 'sg'],
            ).order_by('-mandate_year', 'display_order')[:5]

        top_secretaires_generaux = []
        for member in former_secretaries_qs:
            user = member.user
            full_name = user.full_name.strip() if user else ''
            top_secretaires_generaux.append({
                'id': member.id,
                'nom_complet': full_name or getattr(user, 'email', 'Ancien membre'),
                'mandat': member.mandate_year,
                'poste': member.get_position_display(),
                'campus': getattr(user, 'campus', ''),
                'filiere': getattr(getattr(user, 'specialite', None), 'intitule', ''),
                'promotion': getattr(user, 'promotion', ''),
                'image': getattr(user, 'avatar_url', ''),
            })

        return Response({
            "data": serializer.data,
            "total": qs.count(),
            "top_secretaires_generaux": top_secretaires_generaux,
        })


class AboutContentView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        content = AboutContent.objects.first()
        if not content:
            # valeurs par défaut (peut être créé via migration)
            return Response({
                "mission": {"paragraphs": []},
                "vision": {"paragraphs": []},
                "valeurs": []
            })
        serializer = AboutContentSerializer(content)
        return Response(serializer.data)


#==========================================================

class HomePageView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        stats = AboutStat.objects.all()[:3]
        stats_payload = AboutStatSerializer(stats, many=True).data

        if not stats_payload:
            total_members = User.objects.count()
            total_countries = Country.objects.filter(users__isnull=False).distinct().count()
            total_laureats = LaureatProfile.objects.count()
            stats_payload = [
                {"value": str(total_countries), "label": "pays représentés"},
                {"value": str(total_members), "label": "membres actifs"},
                {"value": str(total_laureats), "label": "lauréats"},
            ]

        content = AboutContent.objects.first()
        content_payload = AboutContentSerializer(content).data if content else {
            "mission_paragraphs": [],
            "vision_paragraphs": [],
            "valeurs_list": [],
        }

        bureau_members = BureauMember.objects.select_related(
            'user', 'user__country', 'user__specialite'
        ).filter(is_current=True).order_by('display_order')[:4]

        bureau_payload = []
        for member in bureau_members:
            bureau_payload.append({
                "id": member.id,
                "name": member.user.full_name.strip() or member.user.email,
                "role": member.get_position_display(),
                "filiere": getattr(member.user.specialite, 'intitule', ''),
                "country": getattr(member.user.country, 'flag_emoji', ''),
                "campus": member.user.campus,
                "promotion": member.user.promotion,
                "mission": member.user.biographie or f"Piloter le mandat {member.mandate_year} et renforcer la dynamique communautaire.",
                "image": member.image_url or member.user.avatar_url,
                "mandate_year": member.mandate_year,
            })

        upcoming_activities = Activity.objects.filter(
            is_published=True,
            event_date__gte=timezone.now(),
        ).order_by('event_date')[:3]

        activities_payload = []
        for activity in upcoming_activities:
            activities_payload.append({
                "id": activity.id,
                "title": activity.title,
                "description": activity.description,
                "date": activity.event_date.isoformat() if activity.event_date else '',
                "location": activity.location,
                "category": activity.category,
            })

        countries_qs = Country.objects.filter(is_active=True).annotate(
            members_count=models.Count('users', distinct=True),
            laureats_count=models.Count(
                'users__laureat_profile',
                filter=models.Q(users__laureat_profile__isnull=False),
                distinct=True,
            ),
        ).filter(
            models.Q(members_count__gt=0) | models.Q(laureats_count__gt=0)
        ).order_by('-members_count', '-laureats_count', 'name')[:6]

        countries_payload = [
            {
                "name": country.name,
                "flag": country.flag_emoji,
                "members": country.members_count,
                "laureats": country.laureats_count,
            }
            for country in countries_qs
        ]

        community_payload = {
            "represented_countries": Country.objects.filter(users__isnull=False).distinct().count(),
            "total_members": User.objects.count(),
            "total_laureats": LaureatProfile.objects.count(),
            "countries": countries_payload,
        }

        return Response({
            "stats": stats_payload,
            "content": content_payload,
            "bureau_members": bureau_payload,
            "upcoming_activities": activities_payload,
            "community": community_payload,
        })


#==========================================================

class SchoolClubsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        clubs = Club.objects.filter(is_active=True)
        serializer = ClubListSerializer(clubs, many=True)
        return Response({"data": serializer.data, "total": clubs.count()})


class AcademicCalendarView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        year = request.query_params.get('year')
        # On peut récupérer l'année académique en cours (ex: 2025-2026) depuis une configuration ou la première date
        # Pour simplifier, on prend toutes les dates groupées par academic_year
        # Ici on suppose qu'il y a un seul calendrier actif
        # On peut stocker l'année dans un modèle de configuration
        # Pour l'instant, on utilise la première année trouvée
        if year:
            dates_qs = AcademicDate.objects.filter(academic_year=year)
        else:
            # prendre l'année la plus récente
            latest_year = AcademicDate.objects.values_list('academic_year', flat=True).order_by('-academic_year').first()
            dates_qs = AcademicDate.objects.filter(academic_year=latest_year) if latest_year else AcademicDate.objects.none()

        # Regrouper par semestre
        sem1_dates = dates_qs.filter(semester='A')
        sem2_dates = dates_qs.filter(semester='B')
        all_dates = []
        for d in sem1_dates:
            all_dates.append({"label": d.label, "date": d.value, "semester": 1})
        for d in sem2_dates:
            all_dates.append({"label": d.label, "date": d.value, "semester": 2})

        # exportUrl à définir (optionnel)
        export_url = None
        # On peut chercher un fichier .ics stocké en base ou dans settings
        # Pour l'instant, laissons null

        response_data = {
            "academicYear": year if year else latest_year,
            "exportUrl": export_url,
            "dates": all_dates
        }
        return Response(response_data)


class PracticalInfoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        infos = PracticalInfo.objects.all()
        serializer = PracticalInfoSerializer(infos, many=True)
        return Response({"data": serializer.data})


class SchoolMediaView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        media = SchoolMedia.objects.all()
        serializer = SchoolMediaSerializer(media, many=True)
        return Response({"data": serializer.data})


class StudentGuideView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        guide = StudentGuide.objects.first()
        if not guide:
            return Response({"detail": "Guide non disponible"}, status=404)
        serializer = StudentGuideSerializer(guide)
        return Response(serializer.data)



class ProposeActivityView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        data = request.data

        mapped_data = {
            'title': data.get('activityName'),
            'category': data.get('category'),
            'description': data.get('description'),
            'proposed_date': data.get('date'),
            'proposed_time': data.get('time'),
            'location': data.get('location'),
            'estimated_participants': data.get('participants', 0),
            'contact_email': data.get('contact'),
            'additional_info': data.get('additionalNotes'),
            'created_by': request.user.id,
        }

        required = ['title', 'category', 'description', 'proposed_date', 'location']
        missing = [f for f in required if not mapped_data.get(f)]
        if missing:
            return Response(
                {'error': 'Champs requis manquants', 'missing': missing},
                status=status.HTTP_400_BAD_REQUEST
            )

        if 'image' in request.FILES:
            mapped_data['image_file'] = request.FILES['image']

        serializer = ActivityProposalSerializer(data=mapped_data, context={'request': request})
        if serializer.is_valid():
            proposal = serializer.save()
            return Response({
                'id': proposal.id,
                'status': proposal.status,
                'message': 'Votre proposition a été soumise avec succès.',
                'submittedAt': proposal.submitted_at.isoformat()
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ActivityCategoriesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = [choice[0] for choice in Activity.CATEGORY_CHOICES]
        return Response({'data': categories})

class RegisterPageView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterPageSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    user = serializer.save()
            except IntegrityError:
                return Response(
                    {'email': ['Un compte avec cet email existe déjà.']},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response({
                'id': user.id,
                'email': user.email,
                'message': 'Compte créé avec succès. Bienvenue dans la communauté CEEAM !',
                'createdAt': user.date_joined.isoformat()
            }, status=status.HTTP_201_CREATED)
        error_response = {
            'status': 400,
            'error': 'Bad Request',
            'message': 'Erreur de validation',
            'details': {}
        }
        for field, errors in serializer.errors.items():
            error_response['details'][field] = errors[0]
        return Response(error_response, status=status.HTTP_400_BAD_REQUEST)

class SpecializationsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        specialites = Specialite.objects.all()
        data = [{'value': s.code.lower(), 'label': s.intitule} for s in specialites]
        return Response({'data': data})

class AcademicYearsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        years = [{'value': i, 'label': f"{i}ème Année"} for i in range(1,6)]
        return Response({'data': years})


class ReviewActivityProposalView(APIView):
    permission_classes = [IsBureauOrAdmin]

    def patch(self, request, pk):
        proposal_type = request.data.get('proposal_type', 'member')

        if proposal_type == 'guest':
            proposal_model = GuestActivityProposal
        else:
            proposal_model = ActivityProposal

        try:
            proposal = proposal_model.objects.get(pk=pk)
        except proposal_model.DoesNotExist:
            return Response({'error': 'Proposition introuvable'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ['approved', 'rejected']:
            return Response({'error': "Le statut doit être 'approved' ou 'rejected'"}, status=status.HTTP_400_BAD_REQUEST)

        # Si déjà traité, bloquer
        if proposal.status != 'pending':
            return Response({'error': 'Cette proposition a déjà été traitée'}, status=status.HTTP_400_BAD_REQUEST)

        # Si approuvé, créer une activité
        if new_status == 'approved':
            # Préparer les données de l'activité
            activity_data = {
                'title': proposal.title,
                'description': proposal.description[:500],  # tronquer si trop long
                'category': proposal.category,
                'event_date': timezone.make_aware(timezone.datetime.combine(proposal.proposed_date, proposal.proposed_time)) if proposal.proposed_date and proposal.proposed_time else None,
                'event_time': proposal.proposed_time.strftime('%H:%M') if proposal.proposed_time else '',
                'location': proposal.location,
                'max_participants': proposal.estimated_participants,
                'is_upcoming': True,
                'is_published': True,
                'created_by': request.user,
            }
            # Gérer l'image (priorité à image_file, sinon image_url)
            if proposal.image_file:
                activity_data['image_url'] = request.build_absolute_uri(proposal.image_file.url)
            elif proposal.image_url:
                activity_data['image_url'] = proposal.image_url

            activity_serializer = ActivitySerializer(data=activity_data, context={'request': request})
            if activity_serializer.is_valid():
                activity = activity_serializer.save()
            else:
                return Response({'error': 'Erreur lors de la création de l\'activité', 'details': activity_serializer.errors},
                                status=status.HTTP_400_BAD_REQUEST)

        # Mettre à jour la proposition
        proposal.status = new_status
        proposal.reviewed_at = timezone.now()
        proposal.reviewed_by = request.user
        proposal.reviewer_comment = request.data.get('comment', '')
        proposal.save()
        notify_activity_proposal_reviewed(proposal)

        return Response({
            'id': proposal.id,
            'status': proposal.status,
            'message': f'Proposition {new_status} avec succès.',
            'activity_id': activity.id if new_status == 'approved' else None
        }, status=status.HTTP_200_OK)

class ReviewActivityProposalView(APIView):
    permission_classes = [IsBureauOrAdmin]

    def patch(self, request, pk):
        try:
            proposal = ActivityProposal.objects.get(pk=pk)
        except ActivityProposal.DoesNotExist:
            return Response({'error': 'Proposition introuvable'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ['approved', 'rejected']:
            return Response({'error': "Le statut doit être 'approved' ou 'rejected'"}, status=status.HTTP_400_BAD_REQUEST)

        if proposal.status != 'pending':
            return Response({'error': 'Cette proposition a déjà été traitée'}, status=status.HTTP_400_BAD_REQUEST)

        activity = None
        if new_status == 'approved':
            # Construction de la date/heure
            event_datetime = None
            if proposal.proposed_date:
                if proposal.proposed_time:
                    dt = datetime.combine(proposal.proposed_date, proposal.proposed_time)
                else:
                    dt = datetime.combine(proposal.proposed_date, datetime.min.time())
                try:
                    event_datetime = make_aware(dt)
                except Exception:
                    event_datetime = dt

            activity_data = {
                'title': proposal.title,
                'description': proposal.description[:500],
                'long_description': proposal.description,
                'category': proposal.category,
                'event_date': event_datetime,
                'event_time': proposal.proposed_time.strftime('%H:%M') if proposal.proposed_time else '',
                'location': proposal.location,
                'max_participants': proposal.estimated_participants,
                'is_upcoming': True,
                'is_published': True,
                'created_by': request.user.id,   # <- Attention : ici on passe l'ID, pas l'objet !
            }
            # Gestion de l'image
            if proposal.image_file:
                activity_data['image_url'] = request.build_absolute_uri(proposal.image_file.url)
            elif proposal.image_url:
                activity_data['image_url'] = proposal.image_url

            # Correction : dans ActivitySerializer, 'created_by' attend un objet User
            # On supprime 'created_by' du dict pour le gérer après
            created_by = activity_data.pop('created_by', None)
            serializer = ActivitySerializer(data=activity_data, context={'request': request})
            if serializer.is_valid():
                activity = serializer.save(created_by=request.user)  # on passe l'objet ici
            else:
                print(serializer.errors)  # debug
                return Response({'error': 'Erreur création activité', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        # Mise à jour de la proposition
        proposal.status = new_status
        proposal.reviewed_at = timezone.now()
        proposal.reviewed_by = request.user
        proposal.reviewer_comment = request.data.get('comment', '')
        proposal.save()

        if isinstance(proposal, ActivityProposal):
            notify_activity_proposal_reviewed(proposal)

        response_data = {
            'id': proposal.id,
            'status': proposal.status,
            'message': f'Proposition {new_status} avec succès.',
            'proposal_type': proposal_type,
        }
        if activity:
            response_data['activity_id'] = activity.id

        return Response(response_data, status=status.HTTP_200_OK)

class PendingProposalsView(APIView):
    permission_classes = [IsBureauOrAdmin]

    def get(self, request):
        member_proposals = ActivityProposal.objects.filter(status='pending').order_by('-submitted_at')
        guest_proposals = GuestActivityProposal.objects.filter(status='pending').order_by('-submitted_at')

        member_data = ActivityProposalSerializer(member_proposals, many=True, context={'request': request}).data
        guest_data = GuestActivityProposalSerializer(guest_proposals, many=True, context={'request': request}).data

        normalized_member_data = [
            {
                **item,
                'proposal_type': 'member',
            }
            for item in member_data
        ]

        normalized_guest_data = [
            {
                **item,
                'proposal_type': 'guest',
                'created_by_name': item.get('contact_email', ''),
            }
            for item in guest_data
        ]

        combined = normalized_member_data + normalized_guest_data
        combined.sort(key=lambda item: item.get('submitted_at', ''), reverse=True)

        return Response(combined)

class UpcomingEventsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from django.utils import timezone
        activities = Activity.objects.filter(is_published=True, event_date__gte=timezone.now()).order_by('event_date')
        serializer = ActivitySerializer(activities, many=True, context={'request': request})
        return Response({'data': serializer.data})


# =====================================================
# Classroom API views
# =====================================================


class ClassroomListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        classrooms = Classroom.objects.filter(is_active=True).order_by('name')
        serializer = ClassroomSerializer(classrooms, many=True, context={'request': request})
        return Response({'data': serializer.data})

    def post(self, request):
        # Admin/bureau-only creation (allow app roles 'admin' or 'bureau')
        role = (getattr(request.user, 'role', '') or '').lower()
        if not (request.user and (request.user.is_staff or request.user.is_superuser or role in ('admin', 'bureau', 'adminpromo', 'admin_promo'))):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ClassroomSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'error': 'Invalid data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ClassroomDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, classroom_id):
        try:
            return Classroom.objects.get(pk=classroom_id)
        except Classroom.DoesNotExist:
            return None

    def get(self, request, classroom_id):
        classroom = self.get_object(classroom_id)
        if not classroom:
            return Response({'error': 'Classe non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ClassroomSerializer(classroom, context={'request': request})
        return Response(serializer.data)

    def put(self, request, classroom_id):
        role = (getattr(request.user, 'role', '') or '').lower()
        if not (request.user and (request.user.is_staff or request.user.is_superuser or role in ('admin', 'bureau', 'adminpromo', 'admin_promo'))):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        classroom = self.get_object(classroom_id)
        if not classroom:
            return Response({'error': 'Classe non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ClassroomSerializer(classroom, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response({'error': 'Invalid data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, classroom_id):
        role = (getattr(request.user, 'role', '') or '').lower()
        if not (request.user and (request.user.is_staff or request.user.is_superuser or role in ('admin', 'bureau', 'adminpromo', 'admin_promo'))):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        classroom = self.get_object(classroom_id)
        if not classroom:
            return Response({'error': 'Classe non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        classroom.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SubjectListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, classroom_id):
        subjects = Subject.objects.filter(classroom_id=classroom_id).order_by('display_order', 'title')
        serializer = SubjectSerializer(subjects, many=True, context={'request': request})
        return Response({'data': serializer.data})

    def post(self, request, classroom_id):
        role = (getattr(request.user, 'role', '') or '').lower()
        if not (request.user and (request.user.is_staff or request.user.is_superuser or role in ('admin', 'bureau', 'adminpromo', 'admin_promo'))):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy()
        data['classroom'] = classroom_id
        serializer = SubjectSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'error': 'Invalid data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class SubjectDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, classroom_id, subject_id):
        try:
            return Subject.objects.get(pk=subject_id, classroom_id=classroom_id)
        except Subject.DoesNotExist:
            return None

    def get(self, request, classroom_id, subject_id):
        subject = self.get_object(classroom_id, subject_id)
        if not subject:
            return Response({'error': 'Matière non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SubjectSerializer(subject, context={'request': request})
        return Response(serializer.data)

    def put(self, request, classroom_id, subject_id):
        role = (getattr(request.user, 'role', '') or '').lower()
        if not (request.user and (request.user.is_staff or request.user.is_superuser or role in ('admin', 'bureau', 'adminpromo', 'admin_promo'))):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        subject = self.get_object(classroom_id, subject_id)
        if not subject:
            return Response({'error': 'Matière non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SubjectSerializer(subject, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response({'error': 'Invalid data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, classroom_id, subject_id):
        role = (getattr(request.user, 'role', '') or '').lower()
        if not (request.user and (request.user.is_staff or request.user.is_superuser or role in ('admin', 'bureau', 'adminpromo', 'admin_promo'))):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        subject = self.get_object(classroom_id, subject_id)
        if not subject:
            return Response({'error': 'Matière non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        subject.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResourceListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, classroom_id, subject_id):
        resources = Resource.objects.filter(subject_id=subject_id).order_by('-created_at')
        serializer = ResourceSerializer(resources, many=True, context={'request': request})
        return Response({'data': serializer.data})

    def post(self, request, classroom_id, subject_id):
        role = (getattr(request.user, 'role', '') or '').lower()
        if not (request.user and (request.user.is_staff or request.user.is_superuser or role in ('admin', 'bureau', 'adminpromo', 'admin_promo'))):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy()
        data['subject'] = subject_id
        serializer = ResourceSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'error': 'Invalid data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ResourceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, classroom_id, subject_id, resource_id):
        try:
            return Resource.objects.get(pk=resource_id, subject_id=subject_id)
        except Resource.DoesNotExist:
            return None

    def get(self, request, classroom_id, subject_id, resource_id):
        resource = self.get_object(classroom_id, subject_id, resource_id)
        if not resource:
            return Response({'error': 'Ressource non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ResourceSerializer(resource, context={'request': request})
        return Response(serializer.data)

    def put(self, request, classroom_id, subject_id, resource_id):
        if not (request.user and (request.user.is_staff or request.user.is_superuser or getattr(request.user, 'role', None) in ('admin', 'bureau'))):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        resource = self.get_object(classroom_id, subject_id, resource_id)
        if not resource:
            return Response({'error': 'Ressource non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ResourceSerializer(resource, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response({'error': 'Invalid data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, classroom_id, subject_id, resource_id):
        if not (request.user and (request.user.is_staff or request.user.is_superuser or getattr(request.user, 'role', None) in ('admin', 'bureau'))):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        resource = self.get_object(classroom_id, subject_id, resource_id)
        if not resource:
            return Response({'error': 'Ressource non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        resource.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
