# backend/core/api/offers.py

from typing import List, Optional
from ninja import Router, Schema
from ninja_jwt.authentication import JWTAuth
from django.shortcuts import get_object_or_404
from core.models import Offer, Request

router = Router()

# --- СХЕМА ДЛЯ СТВОРЕННЯ ---
class OfferCreateSchema(Schema):
    request_id: int
    price: float
    comment: str

# --- СХЕМА ДЛЯ ВІДОБРАЖЕННЯ (My Jobs) ---
class MechanicJobSchema(Schema):
    id: int              # Це ID заявки (щоб фронтенд міг робити /finish/{id})
    offer_id: int        # Це ID самого оферу (унікальний ключ)
    car_model: str
    description: str
    price: float
    status: str          # pending / accepted / rejected
    client_name: str
    client_phone: Optional[str] = None
    request_status: str 
    location: Optional[dict] = None

    # 👇 1. Мапимо ID заявки
    @staticmethod
    def resolve_id(obj):
        return obj.request.id

    # 👇 2. Мапимо ID оферу (ВИПРАВЛЕНО ПОМИЛКУ "Field required offer_id")
    @staticmethod
    def resolve_offer_id(obj):
        return obj.id

    # 👇 3. Мапимо статус (ВИПРАВЛЕНО ПОМИЛКУ "Field required status")
    @staticmethod
    def resolve_status(obj):
        if obj.is_accepted:
            return 'accepted'
        # Якщо заявка вже не нова (хтось інший взяв або завершена), а цей офер не прийнятий -> rejected
        if obj.request.status != 'new':
            return 'rejected'
        return 'pending'

    @staticmethod
    def resolve_car_model(obj):
        return obj.request.car_model

    @staticmethod
    def resolve_description(obj):
        return obj.request.description

    @staticmethod
    def resolve_client_name(obj):
        return obj.request.client.username

    @staticmethod
    def resolve_client_phone(obj):
        return getattr(obj.request.client, 'phone', 'Не вказано')

    @staticmethod
    def resolve_request_status(obj):
        return obj.request.status

    @staticmethod
    def resolve_location(obj):
        if obj.request.location:
            return {"x": obj.request.location.x, "y": obj.request.location.y}
        return None

# --- ЕНДПОІНТИ ---

@router.post("/", auth=JWTAuth())
def create_offer(request, data: OfferCreateSchema):
    user = request.auth
    
    # Перевірка на СТО
    if not hasattr(user, 'service_station'):
        from ninja.errors import HttpError
        raise HttpError(403, "Створіть профіль СТО перед тим, як брати замовлення")

    req_obj = get_object_or_404(Request, id=data.request_id)
    
    # Перевірка на дублікат
    if Offer.objects.filter(request=req_obj, mechanic=user).exists():
        from ninja.errors import HttpError
        raise HttpError(409, "Ви вже відгукнулись на цю заявку")

    offer = Offer.objects.create(
        mechanic=user,
        request=req_obj,
        price=data.price,
        comment=data.comment
    )
    return {"success": True, "id": offer.id}

@router.get("/mechanic/my-offers", auth=JWTAuth(), response=List[MechanicJobSchema])
def get_mechanic_offers(request):
    user = request.auth
    # Беремо офери поточного майстра
    # select_related оптимізує запити до БД
    offers = Offer.objects.filter(mechanic=user)\
        .select_related('request', 'request__client')\
        .order_by('-created_at')
    return offers

@router.post("/{offer_id}/accept", auth=JWTAuth())
def accept_offer(request, offer_id: int):
    offer = get_object_or_404(Offer, id=offer_id)
    # Тільки власник заявки може прийняти
    if offer.request.client != request.auth:
         from ninja.errors import HttpError
         raise HttpError(403, "Це не ваша заявка")
    
    offer.is_accepted = True
    offer.save()
    
    # Оновлюємо статус заявки
    offer.request.status = 'in_progress'
    offer.request.save()
    
    return {"success": True}