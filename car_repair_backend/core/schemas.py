
from ninja import Schema
from typing import Optional
from datetime import datetime

# Що ми чекаємо від фронтенда при реєстрації
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
    phone: Optional[str] = None

    # ... (попередні імпорти)

# 1. Схема для створення заявки (Вхідні дані)
class RequestCreateSchema(Schema):
    car_model: str
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

# ... твій попередній код ...

class StationOutSchema(Schema):
    id: int
    name: str
    description: str = None  # type: ignore # Може бути пустим
    address: str
    phone: str
    location: dict  # Ми повернемо це як {x: 30.5, y: 50.4}