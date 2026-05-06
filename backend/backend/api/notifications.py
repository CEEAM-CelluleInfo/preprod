from __future__ import annotations

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone

from .models import Notification


User = get_user_model()


def create_notification(user, notification_type: str, title: str, message: str, link_url: str = ""):
    if not user or not getattr(user, "is_active", False):
        return None

    notification, _ = Notification.objects.get_or_create(
        user=user,
        type=notification_type,
        title=title,
        message=message,
        link_url=link_url,
        defaults={"is_read": False},
    )
    return notification


def bulk_create_notifications(users, notification_type: str, title: str, message: str, link_url: str = "", exclude_user_id: int | None = None):
    recipients = []
    seen_user_ids = set()

    for user in users:
        if not user or not getattr(user, "is_active", False):
            continue
        if exclude_user_id and user.id == exclude_user_id:
            continue
        if user.id in seen_user_ids:
            continue
        seen_user_ids.add(user.id)
        recipients.append(user)

    if not recipients:
        return 0

    existing_user_ids = set(
        Notification.objects.filter(
            user__in=recipients,
            type=notification_type,
            title=title,
            message=message,
            link_url=link_url,
        ).values_list("user_id", flat=True)
    )

    notifications_to_create = [
        Notification(
            user=user,
            type=notification_type,
            title=title,
            message=message,
            link_url=link_url,
        )
        for user in recipients
        if user.id not in existing_user_ids
    ]

    if notifications_to_create:
        Notification.objects.bulk_create(notifications_to_create)

    return len(notifications_to_create)


def _format_activity_date(activity) -> str:
    if not getattr(activity, "event_date", None):
        return "une date à venir"

    event_date = timezone.localtime(activity.event_date)
    return event_date.strftime("%d/%m/%Y à %H:%M")


def notify_new_activity_published(activity):
    title = f"Nouvelle activité : {activity.title}"
    message = f"Une nouvelle activité vient d'être publiée pour le { _format_activity_date(activity) }."
    recipients = User.objects.filter(is_active=True)
    return bulk_create_notifications(
        recipients,
        "activity",
        title,
        message,
        link_url=f"/activity/{activity.id}",
        exclude_user_id=activity.created_by_id,
    )


def notify_activity_registration(registration):
    activity = registration.activity
    title = f"Inscription confirmée : {activity.title}"
    message = f"Votre inscription est confirmée. Rendez-vous le {_format_activity_date(activity)}."
    return create_notification(
        registration.user,
        "activity",
        title,
        message,
        link_url=f"/activity/{activity.id}",
    )


def ensure_upcoming_activity_notifications(user):
    now = timezone.now()
    soon_limit = now + timedelta(days=3)

    registrations = (
        user.activity_registrations.select_related("activity")
        .filter(
            status="confirmed",
            activity__is_published=True,
            activity__event_date__isnull=False,
            activity__event_date__gte=now,
            activity__event_date__lte=soon_limit,
        )
    )

    for registration in registrations:
        activity = registration.activity
        title = f"Rappel : {activity.title} approche"
        message = f"L'activité commence bientôt, le {_format_activity_date(activity)}."
        create_notification(
            user,
            "activity",
            title,
            message,
            link_url=f"/activity/{activity.id}",
        )


def notify_vote_submitted(vote):
    candidate_name = vote.candidate.user.full_name if vote.candidate and vote.candidate.user else "le candidat sélectionné"
    title = "Vote enregistré"
    message = f"Votre vote pour {candidate_name} a bien été pris en compte."
    return create_notification(
        vote.user,
        "vote",
        title,
        message,
        link_url="/votes",
    )


def _bureau_and_admin_users():
    return User.objects.filter(
        is_active=True,
    ).filter(
        Q(role__in=["bureau", "admin"]) | Q(is_staff=True) | Q(is_superuser=True)
    ).distinct()


def notify_laureat_request_submitted(join_request):
    create_notification(
        join_request.user,
        "system",
        "Demande lauréat envoyée",
        "Votre demande pour devenir lauréat a bien été envoyée et attend une validation.",
        link_url="/laureats-connected",
    )

    title = f"Nouvelle demande lauréat : {join_request.nom}"
    message = f"Une nouvelle demande lauréat a été soumise pour la promotion {join_request.promotion}."
    bulk_create_notifications(
        _bureau_and_admin_users(),
        "system",
        title,
        message,
        link_url="/cpanel",
        exclude_user_id=join_request.user_id,
    )


def notify_laureat_request_status(join_request):
    if not join_request.user:
        return None

    if join_request.status == "approved":
        title = "Demande lauréat approuvée"
        message = "Votre demande a été approuvée. Vous pouvez maintenant accéder à votre espace lauréat."
    elif join_request.status == "rejected":
        title = "Demande lauréat rejetée"
        message = "Votre demande lauréat n'a pas été retenue pour le moment."
    else:
        return None

    return create_notification(
        join_request.user,
        "system",
        title,
        message,
        link_url="/laureats-connected",
    )


def notify_activity_proposal_submitted(proposal):
    if proposal.created_by:
        create_notification(
            proposal.created_by,
            "system",
            "Proposition d'activité envoyée",
            "Votre proposition d'activité a bien été envoyée et sera examinée prochainement.",
            link_url="/activities",
        )

    title = f"Nouvelle proposition d'activité : {proposal.title}"
    message = "Une nouvelle proposition d'activité attend une relecture."
    bulk_create_notifications(
        _bureau_and_admin_users(),
        "system",
        title,
        message,
        link_url="/cpanel",
        exclude_user_id=proposal.created_by_id,
    )


def notify_activity_proposal_reviewed(proposal):
    if not proposal.created_by:
        return None

    if proposal.status == "approved":
        title = "Proposition d'activité approuvée"
        message = "Votre proposition a été approuvée et publiée dans les activités."
    elif proposal.status == "rejected":
        title = "Proposition d'activité rejetée"
        message = "Votre proposition d'activité a été refusée après examen."
    else:
        return None

    return create_notification(
        proposal.created_by,
        "system",
        title,
        message,
        link_url="/activities",
    )


def notify_new_announcement(announcement):
    title = f"Nouvelle annonce : {announcement.title}"
    message = announcement.content[:180]
    return bulk_create_notifications(
        User.objects.filter(is_active=True),
        "announcement",
        title,
        message,
        link_url="/dashboard-connected",
        exclude_user_id=announcement.created_by_id,
    )