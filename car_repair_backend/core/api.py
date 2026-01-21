from typing import List
from django.shortcuts import get_object_or_404
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.contrib.auth import get_user_model

from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import NinjaJWTDefaultController
from ninja_jwt.authentication import JWTAuth
from ninja.errors import HttpError

# Імпортуємо всі моделі з одного місця
from .models import ServiceCategory, Request, Offer, ServiceStation

# Імпортуємо всі схеми з одного місця
from .schemas import (
    UserRegisterSchema, UserOutSchema, 
    RequestCreateSchema, RequestOutSchema,
    OfferCreateSchema, OfferOutSchema,
    StationOutSchema
)

# Ініціалізація API
api = NinjaExtraAPI()
api.register_controllers(NinjaJWTDefaultController)

User = get_user_model()

# --- ЕНДПОІНТИ ---

@api.post("/auth/register", response=UserOutSchema)
def register(request, data: UserRegisterSchema):
    if User.objects.filter(username=data.username).exists():
        raise HttpError(409, "Користувач з таким логіном вже існує")
    
    if User.objects.filter(phone=data.phone).exists():
        raise HttpError(409, "Цей номер телефону вже зареєстрований")

    user = User(
        username=data.username,
        phone=data.phone,
        role=data.role,
        telegram_id=data.telegram_id
    )
    user.set_password(data.password)
    user.save()
    
    return user

@api.get("/me", auth=JWTAuth(), response=UserOutSchema)
def me(request):
    return request.auth

@api.post("/requests", auth=JWTAuth(), response=RequestOutSchema)
def create_request(request, data: RequestCreateSchema):
    user = request.auth
    category = get_object_or_404(ServiceCategory, id=data.category_id)
    
    # Створюємо точку: Point(довгота, широта)
    location = Point(data.lng, data.lat)
    
    new_request = Request.objects.create(
        client=user,
        category=category,
        car_model=data.car_model,
        description=data.description,
        location=location,
        status='new'
    )
    return new_request

@api.get("/requests/nearby", auth=JWTAuth(), response=List[RequestOutSchema])
def get_nearby_requests(request, lat: float, lng: float, radius_km: int = 10):
    user_location = Point(lng, lat)
    
    requests = Request.objects.filter(
        location__distance_lte=(user_location, D(km=radius_km)),
        status='new'
    ).order_by('-created_at')
    
    return requests

@api.post("/offers", auth=JWTAuth(), response=OfferOutSchema)
def create_offer(request, data: OfferCreateSchema):
    user = request.auth
    req = get_object_or_404(Request, id=data.request_id)
    
    offer = Offer.objects.create(
        mechanic=user,
        request=req,
        price=data.price,
        comment=data.comment
    )
    
    return {
        "id": offer.id, # type: ignore
        "mechanic_name": user.username,
        "price": offer.price,
        "comment": offer.comment,
        "is_accepted": offer.is_accepted
    }

@api.get("/requests/{request_id}/offers", auth=JWTAuth(), response=List[OfferOutSchema])
def get_offers_for_request(request, request_id: int):
    offers = Offer.objects.filter(request_id=request_id)
    
    result = []
    for o in offers:
        result.append({
            "id": o.id, # type: ignore
            "mechanic_name": o.mechanic.username,
            # Додаємо телефон, щоб водій міг подзвонити
            "mechanic_phone": o.mechanic.phone if o.mechanic.phone else "Не вказано", 
            "price": o.price,
            "comment": o.comment,
            "is_accepted": o.is_accepted
        })
    return result

@api.get("/stations/nearby", response=List[StationOutSchema])
def get_nearby_stations(request, lat: float, lng: float, radius_km: int = 20):
    """Показати всі СТО в радіусі N км"""
    user_location = Point(lng, lat)
    
    stations = ServiceStation.objects.filter(
        location__distance_lte=(user_location, D(km=radius_km))
    )
    
    result = []
    for s in stations:
        result.append({
            "id": s.id, # type: ignore
            "name": s.name,
            "description": s.description,
            "address": s.address,
            "phone": s.phone,
            "location": {"x": s.location.x, "y": s.location.y}
        })
        
    return result

@api.post("/offers/{offer_id}/accept", auth=JWTAuth())
def accept_offer(request, offer_id: int):
    """Водій приймає пропозицію майстра"""
    try:
        user = request.auth
        
        offer = get_object_or_404(Offer, id=offer_id)
        
        if offer.request.client.id != user.id: # type: ignore
             raise HttpError(403, "Ви не можете прийняти офер для чужої заявки")
    
        offer.is_accepted = True
        offer.save()
        
        # ВИПРАВЛЕННЯ ТУТ:
        # Було: 'in_progress' (11 символів, помилка бази)
        # Стало: 'active' (6 символів, відповідає твоїй моделі)
        offer.request.status = 'active' 
        offer.request.save()
    
        return {"success": True}
        
    except Exception as e:
        print(f"ERROR in accept_offer: {e}")
        raise e
    """Водій приймає пропозицію майстра"""
    try:
        user = request.auth
        
        # 1. Знаходимо офер
        offer = get_object_or_404(Offer, id=offer_id)
        
        # 2. Перевіряємо права (порівнюємо ID, це надійніше)
        if offer.request.client.id != user.id:  # type: ignore
             raise HttpError(403, "Ви не можете прийняти офер для чужої заявки")
    
        # 3. Маркуємо офер як прийнятий
        offer.is_accepted = True
        offer.save()
        
        # 4. Змінюємо статус заявки
        offer.request.status = 'in_progress'
        offer.request.save()
    
        return {"success": True}
        
    except Exception as e:
        # Цей принт покаже помилку у терміналі, де запущений Django
        print(f"ERROR in accept_offer: {e}")
        raise e
    
@api.get("/my-requests", auth=JWTAuth(), response=List[RequestOutSchema])
def get_my_requests(request):
    """Повертає історію заявок поточного користувача"""
    user = request.auth
    return Request.objects.filter(client=user).order_by('-created_at')

@api.post("/requests/{request_id}/finish", auth=JWTAuth())
def finish_request(request, request_id: int):
    """Клієнт підтверджує, що роботу виконано"""
    user = request.auth
    req = get_object_or_404(Request, id=request_id)
    
    # Перевірка, що це заявка цього користувача
    if req.client.id != user.id: # type: ignore
         raise HttpError(403, "Це не ваша заявка")

    req.status = 'done' # Використовуємо статус з твоєї моделі
    req.save()
    
    return {"success": True}