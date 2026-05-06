"""
Classe d'authentification personnalisée pour lire les JWT depuis les cookies httpOnly.
Par défaut, SimpleJWT lit le token depuis le header Authorization.
Cette classe permet de lire le token depuis le cookie 'access_token'.
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed


class JWTCookieAuthentication(JWTAuthentication):
    """
    Authentification JWT personnalisée qui lit le token depuis les cookies.
    """
    
    def authenticate(self, request):
        """
        Authentifier une requête en utilisant le JWT stocké dans un cookie.
        
        Args:
            request: L'objet Request de Django/DRF
        
        Returns:
            tuple: (user, validated_token) si l'authentification réussit
            None: si aucun token n'est trouvé
        
        Raises:
            InvalidToken: Si le token est invalide
            AuthenticationFailed: Si l'utilisateur n'existe pas
        """
        # Récupérer le token depuis le cookie
        raw_token = request.COOKIES.get('access_token')
        
        if raw_token is None:
            # Aucun token trouvé dans les cookies
            # Retourner None pour permettre à d'autres méthodes d'auth de s'exécuter
            return None
        
        # Valider le token et récupérer l'utilisateur
        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
        except (InvalidToken, AuthenticationFailed):
            # Un cookie JWT invalide ne doit pas casser les routes publiques.
            # Les vues protégées continueront à être refusées via les permissions.
            return None
        
        # Retourner l'utilisateur et le token validé
        return user, validated_token
