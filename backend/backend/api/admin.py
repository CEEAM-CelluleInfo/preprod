"""
Administration Django - Plateforme CEEAM
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .laureat_requests import apply_laureat_join_request_approval, build_frontend_url
from .models import (
    Country, Specialite, User, LaureatProfile, LaureatJoinRequest,
    HistoriqueEntry, CompetenceCategory, UserCompetence,
    Activity, ActivityLike, ActivityRegistration, GuestActivityRegistration, Media, ActivityProposal, GuestActivityProposal, Comment,
    BureauMember,
    ContentSection, AcademicDate, Club,
    VoteSession, Position, Candidate, Vote,
    BureauPosition,
    Announcement, ContactMessage, Notification,
    SchoolGuide, Document, FAQ,
    AuditLog, AboutStat, Leader, AboutContent, PracticalInfo, SchoolMedia, StudentGuide,
        Classroom, Semester, Subject, Resource,

)


# =====================================================
# UTILISATEURS & AUTHENTIFICATION
# =====================================================

@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ["name", "code_iso", "flag_emoji", "continent", "is_active"]
    list_filter = ["continent", "is_active"]
    search_fields = ["name", "code_iso"]


@admin.register(Specialite)
class SpecialiteAdmin(admin.ModelAdmin):
    list_display = ["code", "intitule", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["code", "intitule"]
    ordering = ["code"]


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ["email", "first_name", "last_name", "role", "country", "is_active"]
    list_filter = ["role", "country", "is_active", "is_staff"]
    search_fields = ["email", "first_name", "last_name", "username"]
    ordering = ["email"]
    
    fieldsets = UserAdmin.fieldsets + (
        ("Profil CEEAM", {
            "fields": ("phone", "whatsapp", "country", "promotion", "specialite", "role", "avatar_url", "biographie", "preferred_language")
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Profil CEEAM", {
            "fields": ("email", "first_name", "last_name", "phone", "country", "role")
        }),
    )


@admin.register(LaureatProfile)
class LaureatProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "current_position", "company", "work_country", "is_public"]
    list_filter = ["work_country", "is_public", "available_for_mentoring"]
    search_fields = ["user__email", "user__first_name", "user__last_name", "company"]


@admin.register(LaureatJoinRequest)
class LaureatJoinRequestAdmin(admin.ModelAdmin):
    list_display = ["nom", "contact", "promotion", "specialite", "status", "submitted_at", "user"]
    list_filter = ["status", "promotion", "specialite", "submitted_at"]
    search_fields = ["nom", "contact", "entreprise", "user__email"]
    readonly_fields = ["submitted_at", "user"]
    list_editable = ["status"]

    def save_model(self, request, obj, form, change):
        previous_status = None
        if change and obj.pk:
            previous_status = LaureatJoinRequest.objects.filter(pk=obj.pk).values_list("status", flat=True).first()

        super().save_model(request, obj, form, change)

        if obj.status == "approved" and previous_status != "approved":
            self._apply_approval(obj)

    def _apply_approval(self, join_request):
        apply_laureat_join_request_approval(join_request, build_frontend_url())

    actions = ["approve_selected_requests", "reject_selected_requests"]

    @admin.action(description="Approuver les demandes sélectionnées")
    def approve_selected_requests(self, request, queryset):
        for join_request in queryset:
            if join_request.status != "approved":
                join_request.status = "approved"
                join_request.save(update_fields=["status"])
                self._apply_approval(join_request)

    @admin.action(description="Rejeter les demandes sélectionnées")
    def reject_selected_requests(self, request, queryset):
        queryset.exclude(status="rejected").update(status="rejected")


@admin.register(HistoriqueEntry)
class HistoriqueEntryAdmin(admin.ModelAdmin):
    list_display = ["laureat", "entry_type", "title", "organization", "start_date", "is_current"]
    list_filter = ["entry_type", "is_current"]
    search_fields = ["title", "organization", "laureat__user__email"]
    date_hierarchy = "start_date"
    ordering = ["-start_date"]


@admin.register(CompetenceCategory)
class CompetenceCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "icon", "is_predefined", "order"]
    list_filter = ["is_predefined"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["order", "name"]


@admin.register(UserCompetence)
class UserCompetenceAdmin(admin.ModelAdmin):
    list_display = ["laureat", "category", "name", "level"]
    list_filter = ["category", "level"]
    search_fields = ["name", "laureat__user__email"]
    ordering = ["category__order", "name"]


# =====================================================
# ACTIVITÉS & INTERACTIONS
# =====================================================

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "event_date", "is_upcoming", "is_published", "likes_count"]
    list_filter = ["category", "is_upcoming", "is_published", "event_date"]
    search_fields = ["title", "description"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "event_date"


@admin.register(ActivityLike)
class ActivityLikeAdmin(admin.ModelAdmin):
    list_display = ["activity", "user", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["activity__title", "user__email"]


@admin.register(ActivityRegistration)
class ActivityRegistrationAdmin(admin.ModelAdmin):
    list_display = ["activity", "user", "status", "registered_at"]
    list_filter = ["status", "registered_at"]
    search_fields = ["activity__title", "user__email"]


@admin.register(GuestActivityRegistration)
class GuestActivityRegistrationAdmin(admin.ModelAdmin):
    list_display = ["activity", "nom_complet", "email", "status", "registered_at"]
    list_filter = ["status", "registered_at", "niveau_etude"]
    search_fields = ["activity__title", "nom_complet", "email", "telephone"]


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ["activity", "media_type", "caption", "display_order", "uploaded_at"]
    list_filter = ["media_type", "uploaded_at"]
    search_fields = ["activity__title", "caption"]


@admin.register(ActivityProposal)
class ActivityProposalAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "category", "status", "submitted_at", "created_by"]
    list_filter = ["status", "category", "submitted_at"]
    search_fields = ["title", "description", "contact_email"]
    readonly_fields = ["submitted_at"]


@admin.register(GuestActivityProposal)
class GuestActivityProposalAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "category", "contact_email", "status", "submitted_at"]
    list_filter = ["status", "category", "submitted_at"]
    search_fields = ["title", "description", "contact_email"]
    readonly_fields = ["submitted_at"]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ["activity", "user", "is_approved", "created_at"]
    list_filter = ["is_approved", "created_at"]
    search_fields = ["activity__title", "user__email", "content"]


# =====================================================
# BUREAU & LEADERSHIP
# =====================================================

@admin.register(BureauMember)
class BureauMemberAdmin(admin.ModelAdmin):
    list_display = ["user", "position", "mandate_year", "is_current", "display_order"]
    list_filter = ["position", "mandate_year", "is_current"]
    search_fields = ["user__email", "user__first_name", "user__last_name"]


# =====================================================
# CONTENU & RESSOURCES
# =====================================================

@admin.register(ContentSection)
class ContentSectionAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "language", "last_updated"]
    list_filter = ["language", "last_updated"]
    search_fields = ["id", "title", "content"]


@admin.register(AcademicDate)
class AcademicDateAdmin(admin.ModelAdmin):
    list_display = ["date_id", "label", "academic_year", "semester", "updated_at"]
    list_filter = ["academic_year", "semester"]
    search_fields = ["date_id", "label"]


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ["name", "interest", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "interest", "description"]


# =====================================================
# SYSTÈME DE VOTE
# =====================================================

@admin.register(VoteSession)
class VoteSessionAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "status",
        "candidacy_start_date",
        "candidacy_end_date",
        "start_date",
        "end_date",
        "results_published",
    ]
    list_filter = ["status", "results_published"]
    search_fields = ["title", "description"]


@admin.register(BureauPosition)
class BureauPositionAdmin(admin.ModelAdmin):
    list_display = ["code", "title", "requires_one_year_min", "display_order", "is_active"]
    list_filter = ["requires_one_year_min", "is_active"]
    search_fields = ["code", "title", "description"]


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ["title", "bureau_position", "vote_session", "display_order"]
    list_filter = ["vote_session"]
    search_fields = ["title"]


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ["user", "position", "is_approved", "registered_at"]
    list_filter = ["position__vote_session", "is_approved"]
    search_fields = ["user__email", "user__first_name", "user__last_name"]


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ["vote_session", "position", "user", "voted_at"]
    list_filter = ["vote_session", "position", "voted_at"]
    search_fields = ["user__email", "vote_hash"]


# =====================================================
# COMMUNICATION
# =====================================================

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "priority", "is_published", "is_pinned", "valid_from"]
    list_filter = ["category", "priority", "is_published", "is_pinned"]
    search_fields = ["title", "content"]
    date_hierarchy = "valid_from"


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["sender", "recipient", "subject", "is_read", "sent_at"]
    list_filter = ["is_read", "sent_at"]
    search_fields = ["sender__email", "recipient__email", "subject"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["user", "type", "title", "is_read", "created_at"]
    list_filter = ["type", "is_read", "created_at"]
    search_fields = ["user__email", "title", "message"]


# =====================================================
# DOCUMENTATION
# =====================================================

@admin.register(SchoolGuide)
class SchoolGuideAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "language", "is_published", "display_order"]
    list_filter = ["category", "language", "is_published"]
    search_fields = ["title", "content"]


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ["title", "file_type", "category", "language", "is_public", "uploaded_at"]
    list_filter = ["file_type", "category", "language", "is_public"]
    search_fields = ["title"]


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ["question", "category", "language", "is_published", "display_order"]
    list_filter = ["category", "language", "is_published"]
    search_fields = ["question", "answer"]


# =====================================================
# AUDIT
# =====================================================

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["action", "entity_type", "entity_id", "user", "timestamp", "ip_address"]
    list_filter = ["action", "entity_type", "timestamp"]
    search_fields = ["entity_type", "changes", "user__email"]
    readonly_fields = ["action", "entity_type", "entity_id", "changes", "user", "ip_address", "timestamp"]

@admin.register(PracticalInfo)
class PracticalInfoAdmin(admin.ModelAdmin):
    list_display = ['title', 'link_label', 'order']
    list_editable = ['order']
    ordering = ['order']

@admin.register(AboutStat)
class AboutStatAdmin(admin.ModelAdmin):
    list_display = ['value', 'label', 'order']
    list_editable = ['order']

@admin.register(Leader)
class LeaderAdmin(admin.ModelAdmin):
    list_display = ['prenom', 'nom', 'position', 'mandat', 'is_active', 'order']
    list_editable = ['order', 'is_active']
    list_filter = ['mandat', 'is_active']
    search_fields = ['nom', 'prenom']

@admin.register(AboutContent)
class AboutContentAdmin(admin.ModelAdmin):
    pass

@admin.register(SchoolMedia)
class SchoolMediaAdmin(admin.ModelAdmin):
    list_display = ['position', 'alt', 'url']
    list_editable = ['position']
    list_display_links = ['alt']   # ← ajoutez cette ligne (lie le premier champ éditable à un autre champ)


@admin.register(StudentGuide)
class StudentGuideAdmin(admin.ModelAdmin):
    list_display = ['filename', 'updated_at']


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "code"]


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ["classroom", "number"]
    list_filter = ["classroom"]
    ordering = ["classroom", "number"]


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ["title", "semester", "display_order"]
    list_filter = ["semester__classroom"]
    search_fields = ["title"]
    ordering = ["semester", "display_order"]


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ["title", "subject", "category", "resource_type", "allow_preview", "created_at"]
    list_filter = ["category", "resource_type", "allow_preview"]
    search_fields = ["title", "url", "subject__title"]
