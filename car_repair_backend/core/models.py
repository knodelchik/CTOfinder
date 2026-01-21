from django.db import models
from django.contrib.gis.db.models import PointField
from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models as gis_models # Для роботи з картами (PostGIS)

# 1. КОРИСТУВАЧ (Розширюємо стандартного)
class User(AbstractUser):
    ROLE_CHOICES = (
        ('client', 'Клієнт'),
        ('mechanic', 'Майстер'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    telegram_id = models.CharField(max_length=50, null=True, blank=True)
    
    # Рейтинг майстра (рахуватимемо автоматично)
    rating = models.FloatField(default=0.0)

# 2. КАТЕГОРІЇ ПОСЛУГ (Щоб не писати "Ремонт" руками)
class ServiceCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True) # для URL (напр. /services/electrician)

    def __str__(self):
        return self.name

# 3. ЗАЯВКА КЛІЄНТА
class Request(models.Model):
    STATUS_CHOICES = (
        ('new', 'Нова'),
        ('active', 'В роботі'),
        ('done', 'Виконана'),
        ('canceled', 'Скасована'),
    )

    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True)
    
    car_model = models.CharField(max_length=100, help_text="Напр. BMW X5 2015")
    description = models.TextField(help_text="Опис проблеми")
    
    # ГЕОЛОКАЦІЯ: Де знаходиться машина
    location = gis_models.PointField(null=True, blank=True) 
    address = models.CharField(max_length=255, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)

# 4. ПРОПОЗИЦІЯ ВІД МАЙСТРА (ОФЕР)
class Offer(models.Model):
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='offers')
    mechanic = models.ForeignKey(User, on_delete=models.CASCADE, related_name='offers')
    
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Запропонована ціна")
    comment = models.TextField(blank=True, help_text="Коментар майстра")
    
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # ... (твої попередні імпорти)

class ServiceStation(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stations')
    name = models.CharField(max_length=255, verbose_name="Назва СТО")
    address = models.CharField(max_length=255, verbose_name="Адреса словами")
    description = models.TextField(blank=True, verbose_name="Опис послуг")
    phone = models.CharField(max_length=20, verbose_name="Телефон")
    
    # Найважливіше - точка на карті
    location = PointField(srid=4326) 
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
class Car(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cars')
    
    # Основні дані
    license_plate = models.CharField(max_length=20, unique=True) # Номер
    brand_model = models.CharField(max_length=100) # TOYOTA HIGHLANDER
    year = models.IntegerField(null=True, blank=True) # 2020
    
    # Детальні дані (нові поля)
    vin = models.CharField(max_length=50, null=True, blank=True) # 5TDD...
    color = models.CharField(max_length=50, null=True, blank=True) # СІРИЙ
    type = models.CharField(max_length=50, null=True, blank=True) # ЛЕГКОВИЙ
    body = models.CharField(max_length=50, null=True, blank=True) # УНІВЕРСАЛ
    fuel = models.CharField(max_length=50, null=True, blank=True) # БЕНЗИН
    engine_volume = models.CharField(max_length=50, null=True, blank=True) # 3456 см³
    weight = models.CharField(max_length=50, null=True, blank=True) # 2085 кг

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.license_plate} - {self.brand_model}"
