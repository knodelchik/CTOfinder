# car_repair_backend/core/schemas.py

from ninja import Schema
from typing import List, Optional
from datetime import datetime

# Вкажи тут адресу свого бекенду
BACKEND_URL = "http://127.0.0.1:8000"

class PhotoOutSchema(Schema):
    id: int
    url: str

    @staticmethod
    def resolve_url(obj):
        if obj.image:
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

# --- АВТО ---
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

# --- СТО (STATIONS) ---

class StationIn(Schema):
    name: str
    address: str
    phone: str
    lat: float
    lng: float
    description: str = ""
    services_list: str = ""

class ReviewItemSchema(Schema):
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

class StationOutSchema(Schema):
    id: int
    name: str
    description: str
    services_list: Optional[str] = None
    rating: float
    
    address: str
    phone: str
    location: Optional[dict] = None
    
    photos: List[PhotoOutSchema] = [] 
    
    reviews: List[ReviewItemSchema] = []

    @staticmethod
    def resolve_location(obj):
        if obj.location:
            return {"x": obj.location.x, "y": obj.location.y}
        return None

# --- ЗАЯВКИ (REQUESTS) ---

class RequestCreateSchema(Schema):
    # 👇 ВИПРАВЛЕНО: Дозволяємо null
    category_id: Optional[int] = None 
    car_model: str
    description: str
    is_sos: bool = False
    lat: float
    lng: float
    car_id: Optional[int] = None

class RequestOutSchema(Schema):
    id: int
    car_model: str
    description: str
    status: str
    created_at: datetime
    location: dict
    has_review: bool = False
    car_id: Optional[int] = None
    
    attachments: List[AttachmentOutSchema] = []

    @staticmethod
    def resolve_has_review(obj):
        return hasattr(obj, 'review')

    @staticmethod
    def resolve_location(obj):
        if obj.location:
            return {"x": obj.location.x, "y": obj.location.y}
        return None

# --- ПРОПОЗИЦІЇ (OFFERS) ---

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
    
    station_address: Optional[str] = None
    distance_km: Optional[float] = None
    station_lat: Optional[float] = None
    station_lng: Optional[float] = None

# --- КОРИСТУВАЧІ (AUTH) ---

class UserRegisterSchema(Schema):
    username: str
    password: str
    phone: str
    role: str
    telegram_id: Optional[str] = None

class UserOutSchema(Schema):
    id: int
    username: str
    role: str
    phone: Optional[str] = None
    telegram_id: Optional[str] = None