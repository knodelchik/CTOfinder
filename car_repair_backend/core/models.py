import uuid
import os
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db.models import PointField  # Для PostGIS

# --- HELPER FUNCTIONS ---

def station_photo_path(instance, filename):
    # Генерує шлях: station_photos/ID_СТО/унікальне_імя.jpg
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    # instance.station.id може ще не існувати при створенні, тому краще owner.id
    return os.path.join('station_photos', str(instance.station.owner.id), filename)

def request_attachment_path(instance, filename):
    # Генерує шлях: request_attachments/ID_Клієнта/унікальне_імя.jpg
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('request_attachments', str(instance.request.client.id), filename)

# --- MODELS ---

# 1. КОРИСТУВАЧ
class User(AbstractUser):
    ROLE_CHOICES = (
        ('client', 'Клієнт'),
        ('mechanic', 'Майстер'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    telegram_id = models.CharField(max_length=50, null=True, blank=True)
    rating = models.FloatField(default=0.0)

    def __str__(self):
        return self.username

# 2. КАТЕГОРІЇ ПОСЛУГ
class ServiceCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True) 

    def __str__(self):
        return self.name

# 3. СТО (SERVICE STATION)
class ServiceStation(models.Model):
    # Використовуємо OneToOne, бо логіка "Мій профіль СТО" передбачає одне СТО на акаунт
    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name='station')
    
    name = models.CharField(max_length=255, verbose_name="Назва СТО")
    description = models.TextField(blank=True, verbose_name="Опис")
    services_list = models.TextField(blank=True, help_text="Перелік послуг через кому")
    
    address = models.CharField(max_length=255, verbose_name="Адреса словами")
    location = PointField(srid=4326, blank=True, null=True) # Точка на карті
    phone = models.CharField(max_length=20, blank=True)
    
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0) # type: ignore
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class StationPhoto(models.Model):
    station = models.ForeignKey(ServiceStation, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to=station_photo_path)
    created_at = models.DateTimeField(auto_now_add=True)

# 4. АВТОМОБІЛІ (CARS)
class Car(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cars')
    license_plate = models.CharField(max_length=20, unique=True)
    brand_model = models.CharField(max_length=100)
    year = models.IntegerField(null=True, blank=True)
    
    vin = models.CharField(max_length=50, null=True, blank=True)
    color = models.CharField(max_length=50, null=True, blank=True)
    type = models.CharField(max_length=50, null=True, blank=True)
    body = models.CharField(max_length=50, null=True, blank=True)
    fuel = models.CharField(max_length=50, null=True, blank=True)
    engine_volume = models.CharField(max_length=50, null=True, blank=True)
    weight = models.CharField(max_length=50, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.license_plate} - {self.brand_model}"

# 5. ЗАЯВКИ (REQUESTS)
class Request(models.Model):
    STATUS_CHOICES = (
        ('new', 'Нова'),
        ('active', 'В роботі'),
        ('done', 'Виконана'),
        ('canceled', 'Скасована'),
    )

    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True)
    
    car_model = models.CharField(max_length=255)
    description = models.TextField()
    
    location = PointField(srid=4326) # Геолокація поломки
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request {self.id} by {self.client}" # type: ignore

class RequestAttachment(models.Model):
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to=request_attachment_path)
    file_type = models.CharField(max_length=20, default='image') # image / video
    created_at = models.DateTimeField(auto_now_add=True)

# 6. ОФЕРИ (OFFERS)
class Offer(models.Model):
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='offers')
    mechanic = models.ForeignKey(User, on_delete=models.CASCADE, related_name='offers')
    
    price = models.DecimalField(max_digits=10, decimal_places=2)
    comment = models.TextField(blank=True)
    
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)