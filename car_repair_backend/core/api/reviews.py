from typing import List
from ninja import Router, Schema
from ninja_jwt.authentication import JWTAuth
from django.shortcuts import get_object_or_404
from django.db.models import Avg  # 👈 ДОДАНО ЦЕЙ ІМПОРТ
from core.models import Review, Request, ClientReview

router = Router()

class ReviewCreateSchema(Schema):
    request_id: int
    rating: int
    comment: str

class ReviewOutSchema(Schema):
    id: int
    author_name: str
    rating: int
    comment: str
    created_at: str

    @staticmethod
    def resolve_author_name(obj):
        return obj.author.username
    
    @staticmethod
    def resolve_created_at(obj):
        return obj.created_at.strftime('%Y-%m-%d')

@router.post("/", auth=JWTAuth())
def create_review(request, data: ReviewCreateSchema):
    user = request.auth
    
    req_obj = get_object_or_404(Request, id=data.request_id)
    
    # Тільки автор заявки може лишити відгук
    if req_obj.client != user:
        from ninja.errors import HttpError
        raise HttpError(403, "Це не ваша заявка")
        
    if req_obj.status != 'done':
        from ninja.errors import HttpError
        raise HttpError(400, "Заявка ще не завершена")

    # Знаходимо майстра, який виконував роботу
    accepted_offer = req_obj.offers.filter(is_accepted=True).first()
    if not accepted_offer:
        from ninja.errors import HttpError
        raise HttpError(400, "Виконавця не знайдено")

    if Review.objects.filter(request=req_obj).exists():
        from ninja.errors import HttpError
        raise HttpError(409, "Відгук вже існує")

    review = Review.objects.create(
        request=req_obj,
        author=user,
        mechanic=accepted_offer.mechanic,
        rating=data.rating,
        comment=data.comment
    )
    
    return {"success": True, "id": review.id}

@router.get("/mechanic/{mechanic_id}", response=List[ReviewOutSchema])
def get_mechanic_reviews(request, mechanic_id: int):
    return Review.objects.filter(mechanic_id=mechanic_id).order_by('-created_at')

# 👇 НОВИЙ ЕНДПОІНТ: Майстер оцінює клієнта
@router.post("/client/", auth=JWTAuth())
def create_client_review(request, data: ReviewCreateSchema):
    user = request.auth # Це майстер
    
    req_obj = get_object_or_404(Request, id=data.request_id)
    
    # Перевірка: чи цей майстер виконував цю заявку?
    accepted_offer = req_obj.offers.filter(is_accepted=True, mechanic=user).first()
    if not accepted_offer:
        from ninja.errors import HttpError
        raise HttpError(403, "Ви не виконували це замовлення")
        
    if req_obj.status != 'done':
        from ninja.errors import HttpError
        raise HttpError(400, "Заявка ще не завершена")

    # Перевірка на дублікат
    if ClientReview.objects.filter(request=req_obj).exists():
        from ninja.errors import HttpError
        raise HttpError(409, "Ви вже оцінили цього клієнта")

    review = ClientReview.objects.create(
        request=req_obj,
        author=user,
        client=req_obj.client,
        rating=data.rating,
        comment=data.comment
    )
    
    # Оновлення рейтингу юзера (тепер Avg працюватиме)
    client = req_obj.client
    avg_rating = ClientReview.objects.filter(client=client).aggregate(Avg('rating'))['rating__avg']
    
    # Якщо це перший відгук, рейтинг буде None, тому ставимо поточний
    if avg_rating is None:
        client.rating = float(data.rating)
    else:
        client.rating = float(avg_rating)
        
    client.save()
    
    return {"success": True, "id": review.id}