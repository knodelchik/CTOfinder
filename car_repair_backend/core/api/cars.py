from typing import List
from ninja import Router
from django.shortcuts import get_object_or_404
from ninja_jwt.authentication import JWTAuth
from core.models import Car
from core.schemas import CarIn, CarOut
from core.utils.scraper import parse_unda_car  # Імпорт нашого парсера

router = Router()

@router.get("/my-cars", auth=JWTAuth(), response=List[CarOut])
def get_my_cars(request):
    return Car.objects.filter(owner=request.auth)

@router.post("/my-cars", auth=JWTAuth(), response=CarOut)
def add_car(request, data: CarIn):
    car, created = Car.objects.update_or_create(
        owner=request.auth,
        license_plate=data.license_plate,
        defaults=data.dict(exclude={'license_plate'})
    )
    return car

@router.delete("/my-cars/{car_id}", auth=JWTAuth())
def delete_car(request, car_id: int):
    car = get_object_or_404(Car, id=car_id, owner=request.auth)
    car.delete()
    return {"success": True}

@router.get("/lookup-car", auth=JWTAuth())
def lookup_car_by_plate(request, plate: str):
    # Викликаємо РЕАЛЬНИЙ парсер
    data, error = parse_unda_car(plate)
    
    if error:
        # Повертаємо помилку, яку фронтенд покаже в toast.error
        return {"error": error}
    
    # Повертаємо знайдені дані
    return data