from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin
from django.contrib.auth.admin import UserAdmin
from .models import User, ServiceCategory, Request, Offer, ServiceStation

# 1. Налаштовуємо відображення Користувача
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Додаємо нові поля у відображення списку
    list_display = ('username', 'email', 'role', 'phone', 'rating')
    # Додаємо фільтри справа
    list_filter = ('role', 'is_staff')
    # Додаємо поля у форму редагування (fieldsets)
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'telegram_id', 'rating')}),
    )

# 2. Категорії послуг
@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)} # Автоматично створює slug з назви

# 3. Заявки
@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'car_model', 'category', 'status', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('description', 'car_model')

# 4. Пропозиції (Офери)
@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ('id', 'mechanic', 'request', 'price', 'is_accepted')
    list_filter = ('is_accepted',)

@admin.register(ServiceStation)
class ServiceStationAdmin(OSMGeoAdmin):
    list_display = ('name', 'owner', 'phone', 'address')
    search_fields = ('name', 'address')