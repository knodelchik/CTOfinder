from typing import List
from ninja import Router, UploadedFile, File
from django.shortcuts import get_object_or_404
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from ninja_jwt.authentication import JWTAuth
from core.models import ServiceStation, StationPhoto
from core.schemas import StationOutSchema, PhotoOutSchema, StationIn

# Роутер для власника СТО (приватний)
station_router = Router()

# Роутер для пошуку та перегляду (публічний)
geo_router = Router()

@station_router.post("/my-station", auth=JWTAuth(), response=StationOutSchema)
def create_or_update_station(request, data: StationIn):
    user = request.auth
    
    # postgis Point потребує (lng, lat)
    location = Point(data.lng, data.lat)

    station, created = ServiceStation.objects.update_or_create(
        owner=user,
        defaults={
            "name": data.name,
            "description": data.description,
            "services_list": data.services_list,
            "address": data.address,
            "phone": data.phone,
            "location": location
        }
    )
    return station

# --- КАБІНЕТ ВЛАСНИКА СТО ---


@station_router.get("/my-station", auth=JWTAuth(), response=StationOutSchema)
def get_my_station(request):
    # .prefetch_related('photos') завантажує фото разом зі станцією
    station = ServiceStation.objects.filter(owner=request.auth).prefetch_related('photos').first()
    if not station:
        return 204, None
    return station

@station_router.post("/my-station/photos", auth=JWTAuth(), response=PhotoOutSchema)
def upload_station_photo(request, file: UploadedFile = File(...)):
    user = request.auth
    # Шукаємо станцію користувача
    station = get_object_or_404(ServiceStation, owner=user)
    
    # Створюємо фото
    photo = StationPhoto.objects.create(station=station, image=file)
    return photo

@station_router.delete("/my-station/photos/{photo_id}", auth=JWTAuth())
def delete_station_photo(request, photo_id: int):
    user = request.auth
    # Видаляємо тільки якщо фото належить станції цього юзера
    photo = get_object_or_404(StationPhoto, id=photo_id, station__owner=user)
    photo.delete()
    return {"success": True}


# --- ПУБЛІЧНИЙ ПОШУК ---

@geo_router.get("/nearby", response=List[StationOutSchema]) 
def get_nearby_stations(request, lat: float, lng: float, radius_km: int = 20):
    user_location = Point(lng, lat)
    
    # Шукаємо станції в радіусі + завантажуємо їх фото
    stations = ServiceStation.objects.filter(
        location__distance_lte=(user_location, D(km=radius_km))
    ).prefetch_related('photos')
    
    return stations

@geo_router.get("/{station_id}", response=StationOutSchema)
def get_station_details(request, station_id: int):
    # Додаємо prefetch_related('owner__received_reviews')
    # owner__received_reviews - це зв'язок від User до Review (related_name='received_reviews')
    
    station = get_object_or_404(ServiceStation.objects.prefetch_related('photos'), id=station_id)
    
    # Мануально дістаємо відгуки про власника цього СТО
    # Бо модель Review прив'язана до User (mechanic), а не до Station напряму
    reviews = station.owner.received_reviews.all().order_by('-created_at')
    
    # Ninja Schema сама схаває цей список, якщо імена полів співпадають
    station.reviews = list(reviews) 
    
    return station
    # Отримуємо детальну інфо про станцію + фото
    station = get_object_or_404(ServiceStation.objects.prefetch_related('photos'), id=station_id)
    return station