
from django.contrib import admin
from django.urls import include, path, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve as serve_static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

# Servir les fichiers media en développement, ou en production si S3 n'est pas actif.
# NB: le helper static() de Django ne génère aucune route si DEBUG=False (codé en
# dur dans Django, quelle que soit la condition autour) — on branche donc la vue
# django.views.static.serve directement pour que ça fonctionne aussi en prod.
if not getattr(settings, 'USE_S3', False):
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve_static, {'document_root': settings.MEDIA_ROOT}),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
