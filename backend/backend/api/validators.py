"""
Validateurs réutilisables pour les champs uploadés par les utilisateurs
(y compris des visiteurs anonymes, ex: GuestActivityProposal).

Objectif: empêcher l'upload de fichiers arbitraires déguisés en image
(ex: .php, .svg avec script, .html) en vérifiant l'extension, la taille
et en s'assurant que Pillow peut réellement décoder le fichier comme
une image.
"""

from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator

IMAGE_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"]
IMAGE_MAX_SIZE_MB = 5
IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024

validate_image_extension = FileExtensionValidator(allowed_extensions=IMAGE_ALLOWED_EXTENSIONS)


def validate_image_size(file):
    if file.size > IMAGE_MAX_SIZE_BYTES:
        raise ValidationError(
            f"Le fichier dépasse la taille maximale autorisée ({IMAGE_MAX_SIZE_MB} Mo)."
        )


def validate_image_content(file):
    """Vérifie que le fichier est une image valide et non un fichier renommé."""
    from PIL import Image

    try:
        file.seek(0)
        with Image.open(file) as img:
            img.verify()
    except Exception:
        raise ValidationError("Le fichier fourni n'est pas une image valide.")
    finally:
        file.seek(0)


IMAGE_FIELD_VALIDATORS = [validate_image_extension, validate_image_size, validate_image_content]
