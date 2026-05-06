from datetime import timedelta

from django.utils import timezone

from api.models import Activity, Notification, User


def run() -> None:
    now = timezone.now()

    creator = User.objects.filter(is_superuser=True).first() or User.objects.first()
    if creator is None:
        print("No users found. Create at least one user first.")
        return

    # Keep existing real data intact, only replace previous test fixtures.
    Activity.objects.filter(title__startswith="[TEST EVENT]").delete()
    Notification.objects.filter(title__startswith="[TEST NOTIF]").delete()

    events = [
        {
            "title": "[TEST EVENT] Networking Laureats Avril",
            "description": "Session networking entre promotions.",
            "long_description": "Rencontre de partage entre laureats et etudiants.",
            "category": "networking",
            "event_date": now + timedelta(days=2),
            "event_time": "18:30",
            "location": "Salle polyvalente CEEAM",
            "max_participants": 120,
            "is_upcoming": True,
        },
        {
            "title": "[TEST EVENT] Atelier CV et LinkedIn",
            "description": "Atelier pratique pour booster votre profil.",
            "long_description": "Optimisation CV, pitch et profil LinkedIn.",
            "category": "formation",
            "event_date": now + timedelta(days=5),
            "event_time": "10:00",
            "location": "Amphi B",
            "max_participants": 80,
            "is_upcoming": True,
        },
        {
            "title": "[TEST EVENT] Tournoi Sport Inter-Promo",
            "description": "Competition amicale entre promotions.",
            "long_description": "Tournoi football et basketball avec remise des prix.",
            "category": "sport",
            "event_date": now + timedelta(days=8),
            "event_time": "15:00",
            "location": "Complexe sportif",
            "max_participants": 200,
            "is_upcoming": True,
        },
    ]

    created_events = []
    for payload in events:
        event = Activity.objects.create(
            created_by=creator,
            is_published=True,
            image_url="",
            **payload,
        )
        created_events.append(event)

    target_users = User.objects.filter(is_active=True, is_superuser=False)
    if not target_users.exists():
        target_users = User.objects.filter(is_active=True)

    notif_templates = [
        {
            "type": "activity",
            "title": "[TEST NOTIF] Nouvel evenement publie",
            "message": "Un nouvel evenement est disponible: {event_title}",
            "link_url": "/activities",
        },
        {
            "type": "announcement",
            "title": "[TEST NOTIF] Rappel inscription evenement",
            "message": "Pensez a confirmer votre presence pour: {event_title}",
            "link_url": "/activities",
        },
        {
            "type": "system",
            "title": "[TEST NOTIF] Mise a jour plateforme",
            "message": "Le module notifications est actif. Test en cours.",
            "link_url": "/notifications",
        },
    ]

    total_notifications = 0
    for user in target_users:
        for idx, event in enumerate(created_events):
            template = notif_templates[idx % len(notif_templates)]
            Notification.objects.create(
                user=user,
                type=template["type"],
                title=template["title"],
                message=template["message"].format(event_title=event.title),
                link_url=template["link_url"],
                is_read=(idx == 2),
                read_at=now - timedelta(hours=3) if idx == 2 else None,
            )
            total_notifications += 1

    print(f"Created events: {len(created_events)}")
    print(f"Target users: {target_users.count()}")
    print(f"Created notifications: {total_notifications}")


run()
