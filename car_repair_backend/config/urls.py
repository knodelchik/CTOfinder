from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
# Імпортуємо наш API (залиш як було у тебе)
from core.api import api 

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
]

# 👇 ДОДАЙ ЦЕЙ БЛОК:
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)