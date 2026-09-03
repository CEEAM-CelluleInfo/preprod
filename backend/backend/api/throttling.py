"""
Classes de rate limiting additionnelles.

En plus des limites "soutenues" par minute (anon/user), on ajoute une limite
de rafale (burst) à la seconde pour empêcher qu'une même personne (même IP
ou même compte) envoie de nombreuses requêtes en quelques secondes, avant
même d'atteindre le quota par minute.
"""

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AnonBurstRateThrottle(AnonRateThrottle):
    scope = "anon_burst"


class UserBurstRateThrottle(UserRateThrottle):
    scope = "user_burst"
