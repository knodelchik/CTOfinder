from typing import List
from ninja import Router
from django.shortcuts import get_object_or_404
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from ninja_jwt.authentication import JWTAuth
from ninja.errors import HttpError
from core.models import Request, Offer, ServiceCategory, Car, ServiceStation
from core.schemas import RequestCreateSchema, RequestOutSchema, OfferCreateSchema, OfferOutSchema
from math import radians, cos, sin, asin, sqrt

router = Router()

# Функція для розрахунку відстані в км (Haversine formula)
def calculate_distance(lon1, lat1, lon2, lat2):
    # Конвертуємо градуси в радіани
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    # Формула
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 # Радіус Землі в км
    return c * r

# --- REQUESTS ---

@router.post("/requests", auth=JWTAuth(), response=RequestOutSchema)
def create_request(request, data: RequestCreateSchema):
    user = request.auth
    category = get_object_or_404(ServiceCategory, id=data.category_id)
    
    # 1. Шукаємо машину користувача
    car = get_object_or_404(Car, id=data.car_id, owner=user)
    # Формуємо красивий рядок: "Toyota Camry (AA1234AA)"
    car_str = f"{car.brand_model} ({car.license_plate})"
    
    location = Point(data.lng, data.lat)
    
    new_request = Request.objects.create(
        client=user, 
        category=category, 
        car_model=car_str, # Зберігаємо як рядок
        description=data.description, 
        location=location, 
        status='new'
    )
    return new_request

@router.get("/requests/nearby", auth=JWTAuth(), response=List[RequestOutSchema])
def get_nearby_requests(request, lat: float, lng: float, radius_km: int = 10):
    user_location = Point(lng, lat)
    requests = Request.objects.filter(
        location__distance_lte=(user_location, D(km=radius_km)),
        status='new'
    ).order_by('-created_at')
    return requests

@router.get("/my-requests", auth=JWTAuth(), response=List[RequestOutSchema])
def get_my_requests(request):
    return Request.objects.filter(client=request.auth).order_by('-created_at')

@router.post("/requests/{request_id}/finish", auth=JWTAuth())
def finish_request(request, request_id: int):
    req = get_object_or_404(Request, id=request_id)
    if req.client.id != request.auth.id: # type: ignore
         raise HttpError(403, "Це не ваша заявка")
    req.status = 'done'
    req.save()
    return {"success": True}

# --- OFFERS ---

@router.post("/offers", auth=JWTAuth(), response=OfferOutSchema)
def create_offer(request, data: OfferCreateSchema):
    user = request.auth
    req = get_object_or_404(Request, id=data.request_id)
    
    # Перевірка, чи не подавав майстер вже офер
    if Offer.objects.filter(mechanic=user, request=req).exists():
        raise HttpError(409, "Ви вже надіслали пропозицію на цю заявку")

    offer = Offer.objects.create(mechanic=user, request=req, price=data.price, comment=data.comment)
    
    # Спробуємо одразу порахувати дистанцію для відповіді
    dist = None
    addr = None
    station = ServiceStation.objects.filter(owner=user).first()
    if station:
        addr = station.address
        dist = calculate_distance(req.location.x, req.location.y, station.location.x, station.location.y)

    return {
        "id": offer.id,  # type: ignore
        "mechanic_name": user.username,
        "mechanic_phone": user.phone, # Телефон майстра
        "price": offer.price,
        "comment": offer.comment,
        "is_accepted": offer.is_accepted,
        "station_address": addr,
        "distance_km": round(dist, 1) if dist else None
    }

@router.get("/requests/{request_id}/offers", auth=JWTAuth(), response=List[OfferOutSchema])
def get_offers_for_request(request, request_id: int):
    offers = Offer.objects.filter(request_id=request_id).select_related('mechanic')
    req = get_object_or_404(Request, id=request_id)
    
    result = []
    for o in offers:
        # Шукаємо СТО майстра
        station = ServiceStation.objects.filter(owner=o.mechanic).first()
        dist = None
        addr = "Адреса не вказана"
        
        if station:
            addr = station.address
            # Рахуємо дистанцію від точки заявки до СТО
            dist = calculate_distance(req.location.x, req.location.y, station.location.x, station.location.y)
            dist = round(dist, 1) # Округляємо до 1 знаку після коми

        result.append({
            "id": o.id, # type: ignore
            "mechanic_name": o.mechanic.username,
            "mechanic_phone": o.mechanic.phone or "Не вказано",
            "price": o.price,
            "comment": o.comment,
            "is_accepted": o.is_accepted,
            "station_address": addr,
            "distance_km": dist
        })
    return result

@router.post("/offers/{offer_id}/accept", auth=JWTAuth())
def accept_offer(request, offer_id: int):
    offer = get_object_or_404(Offer, id=offer_id)
    if offer.request.client.id != request.auth.id: # type: ignore
            raise HttpError(403, "Ви не можете прийняти офер для чужої заявки")
    offer.is_accepted = True
    offer.save()
    offer.request.status = 'active'
    offer.request.save()
    return {"success": True}