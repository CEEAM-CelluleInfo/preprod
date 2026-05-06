from __future__ import annotations

from django.conf import settings

from .emails import EmailService
from .models import LaureatProfile, Specialite


def build_frontend_url(request=None) -> str:
    configured = getattr(settings, "FRONTEND_URL", "").strip()
    if configured:
        return configured.rstrip("/")

    if request is not None:
        origin = request.headers.get("Origin") or request.META.get("HTTP_ORIGIN")
        if origin:
            return origin.rstrip("/")

    return "http://localhost:8080"


def send_laureat_approval_email(join_request, frontend_url: str) -> bool:
    if not join_request.contact:
        return False

    user = join_request.user
    user_name = join_request.nom or (user.full_name if user else "") or "Cher membre"
    login_email = join_request.contact
    reset_password_link = f"{frontend_url}/mot-de-passe-oublie"
    login_link = f"{frontend_url}/connexion"

    return EmailService.send_email(
        subject="Votre demande lauréat a été approuvée - CEEAM",
        recipient_email=join_request.contact,
        template_name="emails/laureat_approved.html",
        context={
            "user_name": user_name,
            "login_email": login_email,
            "login_link": login_link,
            "reset_password_link": reset_password_link,
            "frontend_url": frontend_url,
            "poste": join_request.poste,
            "entreprise": join_request.entreprise,
            "promotion": join_request.promotion,
            "specialite": join_request.specialite,
        },
    )


def apply_laureat_join_request_approval(join_request, frontend_url: str | None = None) -> None:
    user = join_request.user
    if not user:
        return

    if user.role != "laureat":
        user.role = "laureat"

    if not user.promotion:
        user.promotion = join_request.promotion

    if not user.specialite and join_request.specialite:
        specialite = Specialite.objects.filter(intitule__iexact=join_request.specialite).first()
        if specialite:
            user.specialite = specialite

    if not user.first_name and not user.last_name and join_request.nom:
        parts = join_request.nom.split(maxsplit=1)
        user.first_name = parts[0]
        if len(parts) > 1:
            user.last_name = parts[1]

    user.save()

    profile, created = LaureatProfile.objects.get_or_create(
        user=user,
        defaults={
            "current_position": join_request.poste,
            "company": join_request.entreprise,
            "work_city": join_request.ville,
            "is_public": True,
        },
    )

    if not created:
        updated_fields = []
        if join_request.poste and not profile.current_position:
            profile.current_position = join_request.poste
            updated_fields.append("current_position")
        if join_request.entreprise and not profile.company:
            profile.company = join_request.entreprise
            updated_fields.append("company")
        if join_request.ville and not profile.work_city:
            profile.work_city = join_request.ville
            updated_fields.append("work_city")
        if not profile.is_public:
            profile.is_public = True
            updated_fields.append("is_public")
        if updated_fields:
            profile.save(update_fields=updated_fields)

    if frontend_url:
        send_laureat_approval_email(join_request, frontend_url)