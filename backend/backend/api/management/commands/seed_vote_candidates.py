from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from api.models import Candidate, Position, User, VoteSession


TEST_USERS = [
    ("Amadou", "Diallo"),
    ("Fatou", "Camara"),
    ("Ibrahima", "Keita"),
    ("Mariam", "Sow"),
    ("Oumar", "Barry"),
    ("Aicha", "Traore"),
    ("Moussa", "Ba"),
    ("Kadiatou", "Ndiaye"),
    ("Abdou", "Kone"),
    ("Aminata", "Sy"),
    ("Cheikh", "Fofana"),
    ("Nafissatou", "Kante"),
    ("Issa", "Toure"),
    ("Hawa", "Bah"),
    ("Mamadou", "Diop"),
]


def _normalize_slug(value: str) -> str:
    return (
        value.lower()
        .replace(" ", ".")
        .replace("'", "")
        .replace("-", ".")
    )


class Command(BaseCommand):
    help = "Seed approved candidates for each position in yearly vote session"

    def add_arguments(self, parser):
        parser.add_argument("--year", type=int, default=timezone.now().year)
        parser.add_argument("--per-position", type=int, default=2)
        parser.add_argument(
            "--activate-now",
            action="store_true",
            help="Force session active now and close other active sessions",
        )
        parser.add_argument(
            "--candidacy-now",
            action="store_true",
            help="Open candidature phase now (and keep voting in the future)",
        )
        parser.add_argument(
            "--create-users",
            action="store_true",
            help="Create test users if not enough active users",
        )

    def handle(self, *args, **options):
        year = options["year"]
        per_position = max(1, int(options["per_position"]))

        session_title = f"Elections Bureau CEEAM {year}"
        session = VoteSession.objects.filter(title=session_title).first()
        if not session:
            raise CommandError(
                f"Session '{session_title}' not found. Run seed_vote_positions first."
            )

        if options["activate_now"]:
            now = timezone.now()
            VoteSession.objects.filter(status="active").exclude(pk=session.pk).update(
                status="closed",
                end_date=now,
            )
            session.status = "active"
            session.candidacy_start_date = now - timedelta(days=7)
            session.candidacy_end_date = now - timedelta(hours=1)
            session.start_date = now - timedelta(hours=1)
            session.end_date = now + timedelta(days=7)
            session.save(update_fields=["status", "candidacy_start_date", "candidacy_end_date", "start_date", "end_date"])

        if options["candidacy_now"]:
            now = timezone.now()
            session.status = "active"
            session.candidacy_start_date = now - timedelta(days=2)
            session.candidacy_end_date = now + timedelta(days=5)
            session.start_date = now + timedelta(days=6)
            session.end_date = now + timedelta(days=13)
            session.save(update_fields=["status", "candidacy_start_date", "candidacy_end_date", "start_date", "end_date"])

        users = list(
            User.objects.filter(is_active=True, is_superuser=False).order_by("id")
        )

        if len(users) < per_position and options["create_users"]:
            needed = per_position - len(users)
            self._create_test_users(needed)
            users = list(
                User.objects.filter(is_active=True, is_superuser=False).order_by("id")
            )

        if len(users) < per_position:
            raise CommandError(
                f"Not enough active non-superusers ({len(users)}). Need at least {per_position}."
            )

        created_candidates = 0
        total_positions = Position.objects.filter(vote_session=session).count()

        for position in Position.objects.filter(vote_session=session).order_by("display_order", "id"):
            existing_users_ids = set(
                Candidate.objects.filter(position=position).values_list("user_id", flat=True)
            )
            approved_count = Candidate.objects.filter(position=position, is_approved=True).count()
            missing = per_position - approved_count

            if missing <= 0:
                continue

            user_cursor = 0
            added_for_position = 0
            while added_for_position < missing and user_cursor < len(users) * 4:
                user = users[user_cursor % len(users)]
                user_cursor += 1

                if user.pk in existing_users_ids:
                    continue

                Candidate.objects.create(
                    position=position,
                    user=user,
                    motivation=f"Candidature de {user.full_name} pour {position.title}.",
                    program="Programme de test: transparence, engagement et actions concretes.",
                    is_approved=True,
                )
                existing_users_ids.add(user.pk)
                created_candidates += 1
                added_for_position += 1

        self.stdout.write(self.style.SUCCESS(f"Session: {session.title}"))
        self.stdout.write(self.style.SUCCESS(f"Status: {session.status}"))
        self.stdout.write(self.style.SUCCESS(f"Positions: {total_positions}"))
        self.stdout.write(self.style.SUCCESS(f"Candidates created: {created_candidates}"))

    def _create_test_users(self, needed: int):
        created = 0
        index = 0

        while created < needed and index < len(TEST_USERS):
            first_name, last_name = TEST_USERS[index]
            index += 1

            base = _normalize_slug(f"{first_name}.{last_name}")
            username = f"vote.{base}"
            email = f"{username}@ceeam.test"

            if User.objects.filter(email=email).exists() or User.objects.filter(username=username).exists():
                continue

            User.objects.create_user(
                email=email,
                username=username,
                first_name=first_name,
                last_name=last_name,
                password="VoteTest123!",
                role="student",
                email_verified=True,
                is_active=True,
            )
            created += 1

        if created:
            self.stdout.write(self.style.WARNING(f"Created test users: {created}"))
