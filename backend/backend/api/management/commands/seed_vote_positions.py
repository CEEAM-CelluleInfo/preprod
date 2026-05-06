from datetime import datetime, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from api.models import BureauPosition, Candidate, Position, Vote, VoteSession, User


OFFICIAL_POSITIONS = [
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


class Command(BaseCommand):
    help = "Create yearly vote session and official positions"

    def add_arguments(self, parser):
        parser.add_argument("--year", type=int, default=timezone.now().year)
        parser.add_argument(
            "--start",
            type=str,
            default=None,
            help="Start datetime in ISO format, example: 2026-10-01T08:00:00",
        )
        parser.add_argument(
            "--end",
            type=str,
            default=None,
            help="End datetime in ISO format, example: 2026-10-07T23:59:59",
        )
        parser.add_argument(
            "--activate",
            action="store_true",
            help="Set session status to active if period includes now",
        )

    def handle(self, *args, **options):
        year = options["year"]

        admin_user = User.objects.filter(is_superuser=True).first() or User.objects.first()
        if not admin_user:
            raise CommandError("No user found. Create at least one user first.")

        if options["start"]:
            start_date = timezone.make_aware(datetime.fromisoformat(options["start"]))
        else:
            start_date = timezone.make_aware(datetime(year, 10, 1, 8, 0, 0))

        if options["end"]:
            end_date = timezone.make_aware(datetime.fromisoformat(options["end"]))
        else:
            end_date = start_date + timedelta(days=6, hours=15, minutes=59, seconds=59)

        candidacy_start_date = start_date - timedelta(days=14)
        candidacy_end_date = start_date - timedelta(minutes=1)

        now = timezone.now()
        status = "draft"
        if options["activate"] and start_date <= now <= end_date:
            status = "active"
        elif end_date < now:
            status = "closed"

        session_title = f"Elections Bureau CEEAM {year}"
        session_description = (
            f"Session annuelle des elections du bureau CEEAM pour l'annee {year}."
        )

        session, created = VoteSession.objects.get_or_create(
            title=session_title,
            defaults={
                "description": session_description,
                "candidacy_start_date": candidacy_start_date,
                "candidacy_end_date": candidacy_end_date,
                "start_date": start_date,
                "end_date": end_date,
                "status": status,
                "created_by": admin_user,
            },
        )

        if not created:
            session.description = session_description
            session.candidacy_start_date = candidacy_start_date
            session.candidacy_end_date = candidacy_end_date
            session.start_date = start_date
            session.end_date = end_date
            session.status = status
            session.save(update_fields=["description", "candidacy_start_date", "candidacy_end_date", "start_date", "end_date", "status"])

        created_positions = 0
        deduplicated_positions = 0

        def _position_data_score(pos: Position):
            candidates_count = Candidate.objects.filter(position=pos).count()
            votes_count = Vote.objects.filter(position=pos).count()
            return candidates_count + votes_count

        for index, position_data in enumerate(OFFICIAL_POSITIONS):
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

            # Keep reference table synchronized over time.
            bureau_position.title = position_data["title"]
            bureau_position.requires_one_year_min = position_data["requires_one_year_min"]
            bureau_position.display_order = index
            bureau_position.is_active = True
            bureau_position.save(update_fields=["title", "requires_one_year_min", "display_order", "is_active"])

            existing_positions = list(
                Position.objects.filter(vote_session=session, title=position_data["title"]).order_by("id")
            )

            if existing_positions:
                # Prefer position already carrying data (candidates/votes), fallback to first.
                main_position = max(
                    existing_positions,
                    key=lambda p: (_position_data_score(p), -(p.pk or 0)),
                )
                main_position.bureau_position = bureau_position
                main_position.display_order = index
                if not main_position.description:
                    main_position.description = "Poste du bureau CEEAM"
                main_position.save(update_fields=["bureau_position", "display_order", "description"])

                duplicates = [p for p in existing_positions if p.pk != main_position.pk]
                for duplicate in duplicates:
                    if Candidate.objects.filter(position=duplicate).exists() or Vote.objects.filter(position=duplicate).exists():
                        self.stdout.write(
                            self.style.WARNING(
                                f"Duplicate with data kept (manual review needed): {duplicate.title} (id={duplicate.pk})"
                            )
                        )
                        continue
                    duplicate.delete()
                    deduplicated_positions += 1
            else:
                Position.objects.create(
                    vote_session=session,
                    bureau_position=bureau_position,
                    title=position_data["title"],
                    display_order=index,
                    description="Poste du bureau CEEAM",
                )
                created_positions += 1

        total_positions = Position.objects.filter(vote_session=session).count()

        self.stdout.write(self.style.SUCCESS(f"Session: {session.title} (status={session.status})"))
        self.stdout.write(self.style.SUCCESS(f"Positions total: {total_positions}"))
        self.stdout.write(self.style.SUCCESS(f"Positions newly created: {created_positions}"))
        self.stdout.write(self.style.SUCCESS(f"Positions deduplicated: {deduplicated_positions}"))
