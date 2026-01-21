
from ninja import Schema
from typing import Optional, List
from datetime import datetime

class CarIn(Schema):
    license_plate: str
    brand_model: str
    year: int = None # type: ignore
    vin: str = None# type: ignore
    color: str = None # type: ignore
    type: str = None # type: ignore
    body: str = None # type: ignore
    fuel: str = None # type: ignore
    engine_volume: str = None # type: ignore
    weight: str = None # type: ignore

class CarOut(Schema):
    id: int
    license_plate: str
    brand_model: str
    year: int = None # type: ignore
    vin: str = None # type: ignore
    color: str = None # type: ignore
    type: str = None # type: ignore
    body: str = None # type: ignore
    fuel: str = None # type: ignore
    engine_volume: str = None # type: ignore
    weight: str = None # type: ignore

# ... (StationIn, StationOut залишаються без змін)
# Що ми чекаємо від фронтенда при реєстрації
class StationIn(Schema):
    name: str
    address: str
    phone: str
    lat: float
    lng: float
    description: str = ""
class UserRegisterSchema(Schema):
    username: str
    password: str
    phone: str
    role: str  # 'client' або 'mechanic'
    telegram_id: Optional[str] = None # Це поле необов'язкове

# Що ми віддаємо назад (щоб не світити пароль)
class UserOutSchema(Schema):
    id: int
    username: str
    role: str
    phone: str = None # type: ignore

    # ... (попередні імпорти)

# 1. Схема для створення заявки (Вхідні дані)
class RequestCreateSchema(Schema):
    car_id: int
    description: str
    category_id: int # ID категорії (напр. 1 - Ходова)
    lat: float       # Широта (напр. 50.45)
    lng: float       # Довгота (напр. 30.52)

# 2. Схема для відповіді (Вихідні дані)
class RequestOutSchema(Schema):
    id: int
    car_model: str
    description: str
    status: str
    created_at: datetime  # Треба імпортувати datetime!
    # Ми не віддаємо Point об'єкт напряму, бо JSON його не розуміє.
    # Фронт зазвичай сам знає, де він знаходиться.

    # ... (твої попередні схеми)

# 1. Майстер створює пропозицію
class OfferCreateSchema(Schema):
    request_id: int
    price: float
    comment: str

# 2. Водій бачить пропозицію
class OfferOutSchema(Schema):
    id: int
    mechanic_name: str
    mechanic_phone: str = None  # type: ignore # <--- ДОДАЙ ЦЕ
    price: float
    comment: str
    is_accepted: bool
    station_address: str = None # type: ignore
    distance_km: float = None  # type: ignore

# ... твій попередній код ...

class StationOutSchema(Schema):
    id: int
    name: str
    description: str = None  # type: ignore # Може бути пустим
    address: str
    phone: str
    location: dict  # Ми повернемо це як {x: 30.5, y: 50.4}