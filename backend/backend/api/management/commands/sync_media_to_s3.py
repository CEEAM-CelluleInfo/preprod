from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Sync local media files to the configured default storage (for example S3)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            default=None,
            help="Local media directory to upload. Defaults to <BASE_DIR>/media.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="List what would be uploaded without sending files.",
        )
        parser.add_argument(
            "--overwrite",
            action="store_true",
            help="Replace files that already exist in the destination storage.",
        )

    def handle(self, *args, **options):
        source_dir = Path(options["source"] or (Path(settings.BASE_DIR) / "media")).resolve()
        if not source_dir.exists() or not source_dir.is_dir():
            raise CommandError(f"Media directory not found: {source_dir}")

        storage_backend = (
            f"{default_storage.__class__.__module__}.{default_storage.__class__.__name__}"
        )
        if "storages.backends.s3" not in storage_backend:
            self.stdout.write(
                self.style.WARNING(
                    "Default storage is not S3. Files will be copied to the currently configured storage: "
                    f"{storage_backend}"
                )
            )

        files = sorted(path for path in source_dir.rglob("*") if path.is_file())
        if not files:
            self.stdout.write(self.style.WARNING("No local media files found to sync."))
            return

        uploaded_count = 0
        skipped_count = 0

        self.stdout.write(f"Source: {source_dir}")
        self.stdout.write(f"Storage: {storage_backend}")

        for file_path in files:
            relative_name = file_path.relative_to(source_dir).as_posix()

            if default_storage.exists(relative_name):
                if not options["overwrite"]:
                    skipped_count += 1
                    self.stdout.write(f"SKIP {relative_name}")
                    continue

                if not options["dry_run"]:
                    default_storage.delete(relative_name)

            if options["dry_run"]:
                uploaded_count += 1
                self.stdout.write(f"UPLOAD {relative_name}")
                continue

            with file_path.open("rb") as handle:
                default_storage.save(relative_name, File(handle, name=relative_name))

            uploaded_count += 1
            self.stdout.write(f"UPLOADED {relative_name}")

        action = "would be uploaded" if options["dry_run"] else "uploaded"
        self.stdout.write(
            self.style.SUCCESS(
                f"Done: {uploaded_count} file(s) {action}, {skipped_count} skipped."
            )
        )