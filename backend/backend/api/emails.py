"""
Service d'envoi d'emails pour l'authentification.
Niveau production avec gestion des erreurs et templates variables.
"""

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings


class EmailService:
    """
    Service centralisé pour envoyer les emails d'authentification.
    Permet de changer facilement le fournisseur d'email (SendGrid, AWS SES, etc.)
    """
    
    @staticmethod
    def send_email(
        subject: str,
        recipient_email: str,
        template_name: str | None = None,
        context: dict | None = None,
        plain_text_message: str | None = None
    ) -> bool:
        """
        Envoyer un email avec support des templates HTML.
        
        Args:
            subject: Sujet de l'email
            recipient_email: Email du destinataire
            template_name: Nom du template HTML (dans api/templates/emails/)
            context: Variables à passer au template
            plain_text_message: Message texte brut (fallback si pas de template)
        
        Returns:
            bool: True si l'email a été envoyé, False sinon
        
        Raises:
            Exception: En cas d'erreur lors de l'envoi
        """
        try:
            # Préparer le corps du message
            if template_name and context:
                # Utiliser un template HTML
                html_message = render_to_string(template_name, context)
                # Extraire le texte brut pour les clients email qui ne supportent pas HTML
                plain_message = strip_tags(html_message)
            else:
                # Utiliser le message texte brut fourni
                html_message = None
                plain_message = plain_text_message or ""
            
            # Envoyer l'email via Django
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient_email],
                html_message=html_message if html_message else None,
                fail_silently=False,  # Lever une exception en cas d'erreur
            )
            
            print(f"✅ Email envoyé à {recipient_email}")
            return True
            
        except Exception as e:
            # En production, logger cette erreur dans un système de monitoring
            print(f"❌ Erreur lors de l'envoi d'email à {recipient_email}: {str(e)}")
            # Ne pas relever l'exception pour ne pas bloquer l'utilisateur
            return False
    
    @staticmethod
    def send_verification_email(user, verification_token: str, frontend_url: str) -> bool:
        """
        Envoyer l'email de vérification lors de l'inscription.
        
        Args:
            user: Instance User
            verification_token: Token de vérification généré
            frontend_url: URL du frontend (ex: http://localhost:5173)
        
        Returns:
            bool: True si envoyé avec succès
        """
        # Construire le lien de vérification
        verification_link = f"{frontend_url}/verify-email?token={verification_token}"
        
        context = {
            'user_name': user.first_name or user.username,
            'verification_link': verification_link,
            'token': verification_token,
            'frontend_url': frontend_url,
            # Optionnel: ajouter un lien d'expiration
            'expiration_minutes': 15,  # 15 minutes max
        }
        
        return EmailService.send_email(
            subject="Vérifiez votre adresse email - CEEAM Platform",
            recipient_email=user.email,
            template_name='emails/verify_email.html',
            context=context
        )
    
    @staticmethod
    def send_password_reset_email(user, reset_token: str, frontend_url: str) -> bool:
        """
        Envoyer l'email de réinitialisation du mot de passe.
        
        Args:
            user: Instance User
            reset_token: Token de réinitialisation généré
            frontend_url: URL du frontend (ex: http://localhost:5173)
        
        Returns:
            bool: True si envoyé avec succès
        """
        # Construire le lien de réinitialisation
        reset_link = f"{frontend_url}/reinitialiser-mot-de-passe?token={reset_token}"
        
        context = {
            'user_name': user.first_name or user.username,
            'reset_link': reset_link,
            'token': reset_token,
            'frontend_url': frontend_url,
            # Optionnel: ajouter un lien d'expiration
            'expiration_minutes': 15,  # 15 minutes max
        }
        
        return EmailService.send_email(
            subject="Réinitialisez votre mot de passe - CEEAM Platform",
            recipient_email=user.email,
            template_name='emails/reset_password.html',
            context=context
        )
    
    @staticmethod
    def send_password_changed_notification(user) -> bool:
        """
        Envoyer une notification quand le mot de passe a été changé.
        Utile pour alerter en cas de changement non autorisé.
        
        Args:
            user: Instance User
        
        Returns:
            bool: True si envoyé avec succès
        """
        context = {
            'user_name': user.first_name or user.username,
            'email': user.email,
        }
        
        return EmailService.send_email(
            subject="Votre mot de passe a été modifié - CEEAM Platform",
            recipient_email=user.email,
            template_name='emails/password_changed.html',
            context=context
        )
