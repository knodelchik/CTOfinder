from typing import List
from ninja import Router, UploadedFile, File
from django.shortcuts import get_object_or_404
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from ninja_jwt.authentication import JWTAuth
from ninja.errors import HttpError
from core.models import Request, Offer, ServiceCategory, Car, ServiceStation, RequestAttachment
from core.schemas import RequestCreateSchema, RequestOutSchema, OfferCreateSchema, OfferOutSchema, AttachmentOutSchema
from math import radians, cos, sin, asin, sqrt

router = Router()

# Функція розрахунку дистанції
def calculate_distance(lon1, lat1, lon2, lat2):
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 
    return c * r

# --- ЗАЯВКИ (REQUESTS) ---

@router.post("/requests", auth=JWTAuth(), response=RequestOutSchema)
def create_request(request, data: RequestCreateSchema):
    user = request.auth
    # Для MVP поки беремо першу категорію або знаходимо за ID, якщо передали
    # (Тут можна спростити, якщо у тебе category_id захардкоджений на фронті)
    category = None
    if data.category_id:
        category = ServiceCategory.objects.filter(id=data.category_id).first()
    
    new_request = Request.objects.create(
        client=user, 
        category=category, 
        car_model=data.car_model,
        description=data.description, 
        location=Point(data.lng, data.lat), 
        status='new',
        car_id=data.car_id if data.car_id else None,
    )
    return new_request

# 👇 ГОЛОВНЕ: Завантаження фото/відео до заявки
@router.post("/requests/{request_id}/attachments", auth=JWTAuth(), response=AttachmentOutSchema)
def upload_request_attachment(request, request_id: int, file: UploadedFile = File(...)):
    user = request.auth
    req = get_object_or_404(Request, id=request_id, client=user)
    
    # Визначаємо тип файлу
    file_type = 'image'
    if file.name.lower().endswith(('.mp4', '.mov', '.avi')):
        file_type = 'video'

    attachment = RequestAttachment.objects.create(request=req, file=file, file_type=file_type)
    return attachment

@router.get("/requests/nearby", auth=JWTAuth(), response=List[RequestOutSchema])
def get_nearby_requests(request, lat: float, lng: float, radius_km: int = 10):
    user_location = Point(lng, lat)
    # prefetch_related('attachments') дозволяє майстру бачити фото водія
    requests = Request.objects.filter(
        location__distance_lte=(user_location, D(km=radius_km)),
        status='new'
    ).prefetch_related('attachments').order_by('-created_at')
    return requests

@router.get("/my-requests", auth=JWTAuth(), response=List[RequestOutSchema])
def get_my_requests(request):
    return Request.objects.filter(client=request.auth).prefetch_related('attachments').order_by('-created_at')

@router.post("/requests/{request_id}/finish", auth=JWTAuth())
def finish_request(request, request_id: int):
    req = get_object_or_404(Request, id=request_id)
    if req.client.id != request.auth.id:
         raise HttpError(403, "Це не ваша заявка")
    req.status = 'done'
    req.save()
    return {"success": True}

# --- ПРОПОЗИЦІЇ (OFFERS) ---

@router.post("/offers", auth=JWTAuth(), response=OfferOutSchema)
def create_offer(request, data: OfferCreateSchema):
    user = request.auth
    req = get_object_or_404(Request, id=data.request_id)
    
    station = ServiceStation.objects.filter(owner=user).first()
    if not station or not station.location:
         raise HttpError(403, "Створіть профіль СТО з локацією, щоб відповідати!")

    if Offer.objects.filter(mechanic=user, request=req).exists():
        raise HttpError(409, "Ви вже надіслали пропозицію")

    offer = Offer.objects.create(mechanic=user, request=req, price=data.price, comment=data.comment)
    
    dist = calculate_distance(req.location.x, req.location.y, station.location.x, station.location.y)

    return {
        "id": offer.id,
        "mechanic_name": user.username,
        "mechanic_phone": station.phone or user.phone,
        "price": offer.price,
        "comment": offer.comment,
        "is_accepted": offer.is_accepted,
        "station_address": station.address,
        "distance_km": round(dist, 1),
        "station_lat": station.location.y,
        "station_lng": station.location.x
    }

@router.get("/requests/{request_id}/offers", auth=JWTAuth(), response=List[OfferOutSchema])
def get_offers_for_request(request, request_id: int):
    offers = Offer.objects.filter(request_id=request_id).select_related('mechanic')
    req = get_object_or_404(Request, id=request_id)
    
    result = []
    for o in offers:
        station = ServiceStation.objects.filter(owner=o.mechanic).first()
        dist = None
        addr = "Адреса не вказана"
        lat, lng = None, None
        
        if station and station.location:
            addr = station.address
            dist = calculate_distance(req.location.x, req.location.y, station.location.x, station.location.y)
            lat, lng = station.location.y, station.location.x

        result.append({
            "id": o.id,
            "mechanic_name": o.mechanic.username,
            "mechanic_phone": station.phone if station else o.mechanic.phone,
            "price": o.price,
            "comment": o.comment,
            "is_accepted": o.is_accepted,
            "station_address": addr,
            "distance_km": round(dist, 1) if dist else None,
            "station_lat": lat,
            "station_lng": lng
        })
    return result

@router.post("/offers/{offer_id}/accept", auth=JWTAuth())
def accept_offer(request, offer_id: int):
    offer = get_object_or_404(Offer, id=offer_id)
    if offer.request.client.id != request.auth.id:
            raise HttpError(403, "Це не ваша заявка")
    offer.is_accepted = True
    offer.save()
    offer.request.status = 'active'
    offer.request.save()
    return {"success": True}