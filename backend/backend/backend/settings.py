
from pathlib import Path
import os
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-kfw*o=4ou#mkj*bj10jsxy-#o^z%0)jawkh8(3k0l58#e=)g**'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
     # Third-party
    'rest_framework',
    'rest_framework_simplejwt',  # JWT pour l'authentification
    'rest_framework_simplejwt.token_blacklist',  # Blacklist pour les tokens révoqués
    'corsheaders',
    'storages',

    # Local
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


DB_NAME = config('DB_NAME', default='')
DB_USER = config('DB_USER', default='')
DB_PASSWORD = config('DB_PASSWORD', default='')
DB_HOST = config('DB_HOST', default='')
DB_PORT = config('DB_PORT', default='5432')
DB_SSLMODE = config('DB_SSLMODE', default='require')

USE_POSTGRES = config('USE_POSTGRES', default=False, cast=bool)

if USE_POSTGRES:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": DB_NAME,
            "USER": DB_USER,
            "PASSWORD": DB_PASSWORD,
            "HOST": DB_HOST,
            "PORT": DB_PORT,
            "CONN_MAX_AGE": 60,
            "OPTIONS": {
                "sslmode": DB_SSLMODE,
            },
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / 'db.sqlite3',
            "OPTIONS": {
                "timeout": 20,
            },
        }
    }


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    # TODO: Réactiver en production
    # {
    #     'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    # },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


STATIC_URL = 'static/'

AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', default='')
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', default='')
AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default='')
AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='')
AWS_QUERYSTRING_AUTH = config('AWS_QUERYSTRING_AUTH', default=False, cast=bool)
AWS_LOCATION = config('AWS_LOCATION', default='media')

USE_S3 = config(
    'USE_S3',
    default=bool(AWS_STORAGE_BUCKET_NAME),
    cast=bool,
)

if USE_S3:
    AWS_DEFAULT_ACL = None
    AWS_S3_FILE_OVERWRITE = False
    AWS_S3_SIGNATURE_VERSION = 's3v4'
    if not AWS_QUERYSTRING_AUTH:
        if AWS_S3_REGION_NAME:
            AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com'
        else:
            AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'

    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3.S3Storage',
            'OPTIONS': {
                'location': AWS_LOCATION,
                'default_acl': AWS_DEFAULT_ACL,
                'file_overwrite': AWS_S3_FILE_OVERWRITE,
            },
        },
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
        },
    }
    if AWS_QUERYSTRING_AUTH:
        if AWS_S3_REGION_NAME:
            MEDIA_URL = f'https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com/{AWS_LOCATION}/'
        else:
            MEDIA_URL = f'https://{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{AWS_LOCATION}/'
    else:
        MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/{AWS_LOCATION}/'
else:
    # Media files (uploads utilisateurs : photos de profil, etc.)
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'



# Spécifier le modèle User personnalisé
AUTH_USER_MODEL = 'api.User'


REST_FRAMEWORK = {
    # Utiliser JWT pour l'authentification par défaut
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'api.authentication.JWTCookieAuthentication',  # Auth par cookie (custom)
        'rest_framework_simplejwt.authentication.JWTAuthentication',  # Auth par header (fallback)
    ),
    
    # Permissions par défaut : nécessite d'être authentifié
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    
    # Format de rendu par défaut
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    
    # Filtres par défaut
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
    ],
    
    # Pagination par défaut
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    
    # Format des dates
    'DATETIME_FORMAT': '%Y-%m-%d %H:%M:%S',
}


# ====================================================
# CONFIGURATION SIMPLE JWT
# ====================================================

from datetime import timedelta

SIMPLE_JWT = {
    # Durée de vie du access token (court terme)
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1) if DEBUG else timedelta(minutes=15),
    
    # Durée de vie du refresh token (longue durée)
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    
    # Rotation des refresh tokens : génère un nouveau refresh token à chaque utilisation
    'ROTATE_REFRESH_TOKENS': True,
    
    # Blacklister l'ancien refresh token après rotation
    'BLACKLIST_AFTER_ROTATION': True,
    
    # Mettre à jour le last_login de l'utilisateur à chaque nouveau token
    'UPDATE_LAST_LOGIN': True,
    
    # Algorithme de signature des tokens
    'ALGORITHM': 'HS256',
    
    # Clé secrète pour signer les tokens (utilise SECRET_KEY par défaut)
    'SIGNING_KEY': SECRET_KEY,
    
    # Vérifier la signature des tokens
    'VERIFYING_KEY': None,
    
    # Audience et issuer du token (optionnel, pour plus de sécurité)
    'AUDIENCE': None,
    'ISSUER': None,
    
    # Nom du claim pour l'ID utilisateur
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    # Type de token
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    
    # Autoriser le refresh token à être utilisé plusieurs fois (si ROTATE=False)
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
    'SLIDING_TOKEN_LIFETIME': timedelta(days=7),
}


# ====================================================
# CONFIGURATION CORS (pour le frontend)
# ====================================================

FRONTEND_ORIGINS = [
    'https://ceaam.org',
    'https://www.ceaam.org',
]

LOCAL_DEV_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
]

# En production, spécifier les origines autorisées
if DEBUG:
    CORS_ALLOWED_ORIGINS = FRONTEND_ORIGINS + LOCAL_DEV_ORIGINS
else:
    CORS_ALLOWED_ORIGINS = FRONTEND_ORIGINS

# Autoriser les cookies dans les requêtes cross-origin
CORS_ALLOW_CREDENTIALS = True

# Headers autorisés
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]


# ====================================================
# CONFIGURATION DES COOKIES (SÉCURITÉ)
# ====================================================

# En production avec HTTPS, activer ces paramètres :
if not DEBUG:
    # Forcer HTTPS
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # Protection contre le clickjacking
    X_FRAME_OPTIONS = 'DENY'
    
    # Forcer le navigateur à utiliser HTTPS
    SECURE_HSTS_SECONDS = 31536000  # 1 an
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Protection XSS
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True

# Configuration CSRF (avec cookies)
CSRF_COOKIE_HTTPONLY = False  # False car le frontend a besoin de lire le CSRF token
CSRF_COOKIE_SAMESITE = 'Lax'
if DEBUG:
    CSRF_TRUSTED_ORIGINS = FRONTEND_ORIGINS + LOCAL_DEV_ORIGINS
else:
    CSRF_TRUSTED_ORIGINS = FRONTEND_ORIGINS


# ====================================================
# CONFIGURATION EMAIL
# ====================================================

# # En développement, utiliser la console pour voir les emails
# if DEBUG:
#     EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
#     # Les emails s'afficheront dans la console Django
# else:
# En production, utiliser votre fournisseur d'email
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'souleonetraore.940@gmail.com')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', 'quwq ijtt lrpv zhaa')

# Email par défaut pour les envois
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'CEEAM<souleonetraore.940@gmail.com>')

# URL du frontend pour les liens dans les emails
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:8080')

# Durée de validité des tokens de vérification et reset password
PASSWORD_RESET_TIMEOUT = 15 * 60  # 15 minutes en secondes

# Auth token TTL in seconds (used by legacy API login/verify endpoints)
AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24
