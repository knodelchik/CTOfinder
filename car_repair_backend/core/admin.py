from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, ServiceCategory, ServiceStation, StationPhoto, 
    Car, Request, Offer, Review, ClientReview, RequestAttachment
)

# 1. Налаштування для КАТЕГОРІЙ (Те, що ти просив)
@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    # Які колонки показувати у списку
    list_display = ('get_full_path', 'slug', 'id')
    
    # Пошук по назві (важливо для autocomplete)
    search_fields = ['name', 'slug']
    
    # Замінює звичайний список батьків на поле з пошуком! 
    # Це рятує, коли категорій сотні.
    autocomplete_fields = ['parent']
    
    # Фільтр збоку (показувати тільки кореневі або всі)
    list_filter = [('parent', admin.EmptyFieldListFilter)]

    # Метод, щоб в адмінці було видно "Двигун -> Звуки -> Стук"
    def get_full_path(self, obj):
        return str(obj)
    get_full_path.short_description = "Повна категорія"

# 2. Налаштування для ЮЗЕРІВ
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Додаємо нові поля в адмінку (роль, телефон, рейтинг)
    fieldsets = UserAdmin.fieldsets + (
        ('Додаткова інформація', {'fields': ('role', 'phone', 'rating')}),
    )
    list_display = ('username', 'email', 'role', 'phone', 'is_staff')
    list_filter = ('role', 'is_staff')

# 3. Налаштування для СТО
class StationPhotoInline(admin.TabularInline):
    model = StationPhoto
    extra = 1

@admin.register(ServiceStation)
class ServiceStationAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'phone', 'rating', 'created_at')
    search_fields = ('name', 'owner__username')
    inlines = [StationPhotoInline]

# 4. Налаштування для АВТО
@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ('brand_model', 'license_plate', 'owner', 'year')
    search_fields = ('license_plate', 'brand_model', 'owner__username')
    list_filter = ('year',)

# 5. Налаштування для ЗАЯВОК
class RequestAttachmentInline(admin.TabularInline):
    model = RequestAttachment
    extra = 0

@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'car_model', 'category', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('description', 'client__username', 'car_model')
    autocomplete_fields = ['category', 'client'] # Теж додаємо зручний пошук
    inlines = [RequestAttachmentInline]

# 6. Решта моделей (проста реєстрація)
admin.site.register(Offer)
admin.site.register(Review)
admin.site.register(ClientReview)