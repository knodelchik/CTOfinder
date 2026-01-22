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
    id: int              
    offer_id: int        
    car_model: str
    description: str
    price: float
    status: str          
    client_name: str
    client_phone: Optional[str] = None
    request_status: str 
    location: Optional[dict] = None
    
    # 👇 Це поле було, але воно завжди було False
    has_client_review: bool = False

    @staticmethod
    def resolve_id(obj):
        return obj.request.id

    @staticmethod
    def resolve_offer_id(obj):
        return obj.id

    @staticmethod
    def resolve_status(obj):
        if obj.is_accepted:
            return 'accepted'
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

    # 👇 ДОДАВ ЦЕЙ ВАЖЛИВИЙ МЕТОД 👇
    @staticmethod
    def resolve_has_client_review(obj):
        # Перевіряємо, чи є у заявки (request) пов'язаний client_review
        return hasattr(obj.request, 'client_review')

# --- ЕНДПОІНТИ ---

@router.post("/", auth=JWTAuth())
def create_offer(request, data: OfferCreateSchema):
    user = request.auth
    
    if not hasattr(user, 'service_station'):
        from ninja.errors import HttpError
        raise HttpError(403, "Створіть профіль СТО перед тим, як брати замовлення")

    req_obj = get_object_or_404(Request, id=data.request_id)
    
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
    # Додаємо select_related('request__client_review'), щоб не робити зайвих запитів до БД
    offers = Offer.objects.filter(mechanic=user)\
        .select_related('request', 'request__client')\
        .order_by('-created_at')
    return offers

@router.post("/{offer_id}/accept", auth=JWTAuth())
def accept_offer(request, offer_id: int):
    offer = get_object_or_404(Offer, id=offer_id)
    if offer.request.client != request.auth:
         from ninja.errors import HttpError
         raise HttpError(403, "Це не ваша заявка")
    
    offer.is_accepted = True
    offer.save()
    
    offer.request.status = 'in_progress'
    offer.request.save()
    
    return {"success": True}