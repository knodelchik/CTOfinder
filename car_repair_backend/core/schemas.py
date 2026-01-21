from ninja import Schema
from typing import List, Optional
from datetime import datetime

# ==========================================
# 📸 СХЕМИ ДЛЯ МЕДІА (ФОТО ТА ФАЙЛИ)
# ==========================================
# backend/core/schemas.py

# ... імпорти

# Вкажи тут адресу свого бекенду
BACKEND_URL = "http://127.0.0.1:8000"

class PhotoOutSchema(Schema):
    id: int
    url: str

    @staticmethod
    def resolve_url(obj):
        if obj.image:
            # Додаємо домен до шляху
            return f"{BACKEND_URL}{obj.image.url}"
        return None

class AttachmentOutSchema(Schema):
    id: int
    url: str
    file_type: str

    @staticmethod
    def resolve_url(obj):
        if obj.file:
            return f"{BACKEND_URL}{obj.file.url}"
        return None

# ... решта коду

# ==========================================
# 🚗 СХЕМИ ДЛЯ АВТОМОБІЛІВ
# ==========================================

class CarIn(Schema):
    license_plate: str
    brand_model: str
    year: Optional[int] = None
    vin: Optional[str] = None
    color: Optional[str] = None
    type: Optional[str] = None
    body: Optional[str] = None
    fuel: Optional[str] = None
    engine_volume: Optional[str] = None
    weight: Optional[str] = None

class CarOut(Schema):
    id: int
    license_plate: str
    brand_model: str
    year: Optional[int] = None
    vin: Optional[str] = None
    color: Optional[str] = None
    type: Optional[str] = None
    body: Optional[str] = None
    fuel: Optional[str] = None
    engine_volume: Optional[str] = None
    weight: Optional[str] = None


# ==========================================
# 🛠 СХЕМИ ДЛЯ СТО (STATIONS)
# ==========================================

class StationIn(Schema):
    name: str
    address: str
    phone: str
    lat: float
    lng: float
    description: str = ""
    services_list: str = ""

# backend/core/schemas.py

# ... (інші схеми залишаються без змін)

class StationOutSchema(Schema):
    id: int
    name: str
    description: str
    services_list: Optional[str] = None
    rating: float
    
    address: str
    phone: str
    location: Optional[dict] = None # Робимо Optional, про всяк випадок
    
    photos: List[PhotoOutSchema] = [] 

    # 👇 ОСЬ ЦЕ ВИПРАВЛЯЄ ПОМИЛКУ 500
    @staticmethod
    def resolve_location(obj):
        # Якщо у об'єкта є location (це Point), перетворюємо його вручну
        if obj.location:
            return {"x": obj.location.x, "y": obj.location.y}
        return None

# ==========================================
# 📋 СХЕМИ ДЛЯ ЗАЯВОК (REQUESTS)
# ==========================================

class RequestCreateSchema(Schema):
    category_id: int
    car_model: str # Передаємо рядок, наприклад "BMW X5 (AA1234AA)"
    description: str
    lat: float
    lng: float


class RequestOutSchema(Schema):
    id: int
    car_model: str
    description: str
    status: str
    created_at: datetime
    location: dict
    
    # Вкладення (фото/відео поломки)
    attachments: List[AttachmentOutSchema] = []

    # 👇 ДОДАЙТЕ ЦЕЙ МЕТОД 👇
    @staticmethod
    def resolve_location(obj):
        # Перетворюємо об'єкт Point (GeoDjango) у звичайний dict для JSON
        if obj.location:
            return {"x": obj.location.x, "y": obj.location.y}
        return None
# ==========================================
# 🤝 СХЕМИ ДЛЯ ПРОПОЗИЦІЙ (OFFERS)
# ==========================================

class OfferCreateSchema(Schema):
    request_id: int
    price: float
    comment: str

class OfferOutSchema(Schema):
    id: int
    mechanic_name: str
    mechanic_phone: Optional[str] = None
    price: float
    comment: str
    is_accepted: bool
    
    # Геодані СТО майстра
    station_address: Optional[str] = None
    distance_km: Optional[float] = None
    station_lat: Optional[float] = None
    station_lng: Optional[float] = None


# ==========================================
# 👤 СХЕМИ ДЛЯ КОРИСТУВАЧІВ (AUTH)
# ==========================================

class UserRegisterSchema(Schema):
    username: str
    password: str
    phone: str
    role: str  # 'client' або 'mechanic'
    telegram_id: Optional[str] = None

class UserOutSchema(Schema):
    id: int
    username: str
    role: str
    phone: Optional[str] = None
    telegram_id: Optional[str] = None