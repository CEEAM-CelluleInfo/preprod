"""
Service de génération et validation de tokens pour email verification et password reset.
Utilise les token generators natives de Django pour la sécurité maximale.
"""

from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth import get_user_model
from django.conf import settings
import secrets
import hashlib
from datetime import datetime, timedelta

User = get_user_model()


class TokenGenerator:
    """
    Classe pour générer et valider les tokens de vérification d'email et reset de mot de passe.
    Utilise les meilleures pratiques de sécurité Django.
    """
    
    @staticmethod
    def generate_email_verification_token(user) -> str:
        """
        Générer un token sécurisé pour la vérification d'email.
        
        SÉCURITÉ:
        - Utilise PasswordResetTokenGenerator de Django (éprouvé)
        - Le token contient un hash de l'email de l'utilisateur
        - Le token est lié à la date/heure (expiration contrôlée)
        - Le token devient invalide si le mot de passe change
        
        Args:
            user: Instance User
        
        Returns:
            str: Token sécurisé URL-safe (peut être inclus dans une URL)
        """
        # Utiliser le PasswordResetTokenGenerator car il offre :
        # - Signature cryptographique
        # - Lien avec l'utilisateur et son état
        # - Expiration basée sur la date
        generator = PasswordResetTokenGenerator()
        
        # Générer le token (c'est une signature de l'utilisateur)
        token = generator.make_token(user)
        
        # Encoder l'ID utilisateur en base64 (pour l'URL)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Retourner une chaîne format "uid-token" (sécurisée pour URL)
        return f"{uid}-{token}"
    
    @staticmethod
    def verify_email_token(token: str) -> tuple:
        """
        Vérifier et décoder un token de vérification d'email.
        
        SÉCURITÉ:
        - Vérifie que le token n'a pas été modifié
        - Vérifie que le token n'a pas expiré (par defaut 1 jour dans Django)
        - Retourne l'utilisateur si valide, None sinon
        
        Args:
            token: Token à vérifier (format "uid-token")
        
        Returns:
            tuple: (user, is_valid)
            - user: Instance User si token valide, None sinon
            - is_valid: bool
        """
        try:
            # Décoder le token
            if '-' not in token:
                return None, False
            
            # split('-', 1) coupe au PREMIER tiret (le token Django contient des tirets)
            uid, token_part = token.split('-', 1)
            
            # Décoder l'ID utilisateur depuis base64
            user_id = force_str(urlsafe_base64_decode(uid))
            
            # Récupérer l'utilisateur
            user = User.objects.get(pk=user_id)
            
            # Utiliser le même generator que pour la création
            generator = PasswordResetTokenGenerator()
            
            # Vérifier que le token est valide et pas expiré
            if generator.check_token(user, token_part):
                return user, True
            
            return None, False
            
        except Exception as e:
            # Token malformé, utilisateur inexistant, etc.
            print(f"❌ Erreur lors de la vérification du token: {str(e)}")
            return None, False
    
    @staticmethod
    def generate_password_reset_token(user) -> str:
        """
        Générer un token sécurisé pour la réinitialisation du mot de passe.
        Identique à email verification mais peut avoir une expiration différente.
        
        Args:
            user: Instance User
        
        Returns:
            str: Token sécurisé URL-safe
        """
        # Utiliser le même système que email verification
        # Django permet de configurer l'expiration globalement
        generator = PasswordResetTokenGenerator()
        token = generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        return f"{uid}-{token}"
    
    @staticmethod
    def verify_password_reset_token(token: str) -> tuple:
        """
        Vérifier et décoder un token de réinitialisation du mot de passe.
        
        Args:
            token: Token à vérifier (format "uid-token")
        
        Returns:
            tuple: (user, is_valid)
        """
        try:
            if '-' not in token:
                return None, False
            
            # split('-', 1) coupe au PREMIER tiret (le token Django contient des tirets)
            uid, token_part = token.split('-', 1)
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            
            generator = PasswordResetTokenGenerator()
            
            if generator.check_token(user, token_part):
                return user, True
            
            return None, False
            
        except Exception as e:
            print(f"❌ Erreur lors de la vérification du token de reset: {str(e)}")
            return None, False


class EmailVerificationTokenService:
    """
    Service spécialisé pour la gestion des tokens de vérification d'email.
    """
    
    @staticmethod
    def create_verification_token(user) -> str:
        """
        Créer et retourner un token de vérification d'email.
        """
        return TokenGenerator.generate_email_verification_token(user)
    
    @staticmethod
    def verify_token(token: str):
        """
        Vérifier un token et retourner l'utilisateur.
        """
        return TokenGenerator.verify_email_token(token)

    @staticmethod
    def is_expired_token(token: str) -> bool:
        """
        Vérifie si un token est expiré (par opposition à simplement invalide/malformé).
        À appeler UNIQUEMENT quand verify_token() a déjà retourné (None/user, False).

        Stratégie :
        - Décode l'uid pour confirmer que l'utilisateur existe
        - Extrait le timestamp base36 depuis la partie token Django (format: {ts_b36}-{hash})
        - Compare avec PASSWORD_RESET_TIMEOUT (défaut : 86400s = 1 jour)
        - Si le délai est dépassé → expiré (True), sinon invalide pour autre raison (False)

        Returns:
            bool: True si expiré, False si invalide ou malformé
        """
        try:
            if '-' not in token:
                return False

            uid, token_part = token.split('-', 1)
            user_id = force_str(urlsafe_base64_decode(uid))
            User.objects.get(pk=user_id)  # Doit exister, sinon → invalide, pas expiré

            # Le token_part Django a le format interne : "{ts_b36}-{hash}"
            if '-' not in token_part:
                return False

            ts_b36 = token_part.split('-')[0]
            ts = int(ts_b36, 36)  # Secondes depuis 2001-01-01 UTC (Django 3.1+)

            timeout = getattr(settings, 'PASSWORD_RESET_TIMEOUT', 86400)

            from django.utils.timezone import now as django_now
            from datetime import timezone as dt_timezone

            epoch = datetime(2001, 1, 1, tzinfo=dt_timezone.utc)
            now_ts = int((django_now() - epoch).total_seconds())

            return (now_ts - ts) > timeout

        except Exception:
            # Utilisateur inexistant, base64 invalide, ts_b36 illisible → pas expiré, juste invalide
            return False
        

class PasswordResetTokenService:
    """
    Service spécialisé pour la gestion des tokens de réinitialisation du mot de passe.
    """
    
    @staticmethod
    def create_reset_token(user) -> str:
        """
        Créer et retourner un token de réinitialisation du mot de passe.
        """
        return TokenGenerator.generate_password_reset_token(user)
    
    @staticmethod
    def verify_token(token: str):
        """
        Vérifier un token et retourner l'utilisateur.
        """
        return TokenGenerator.verify_password_reset_token(token)
