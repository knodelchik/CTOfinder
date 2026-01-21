from django.contrib import admin
from django.urls import path
from core.api import api # <-- Імпортуємо наш API

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls), # <-- Підключаємо API
]