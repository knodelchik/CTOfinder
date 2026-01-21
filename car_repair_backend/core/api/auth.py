from ninja import Router
from django.contrib.auth import get_user_model
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth
from core.schemas import UserRegisterSchema, UserOutSchema

router = Router()
User = get_user_model()

# ЗМІНА ТУТ: додаємо /auth до шляху реєстрації явно
@router.post("/auth/register", response=UserOutSchema)
def register(request, data: UserRegisterSchema):
    if User.objects.filter(username=data.username).exists():
        raise HttpError(409, "Користувач з таким логіном вже існує")
    if User.objects.filter(phone=data.phone).exists():
        raise HttpError(409, "Цей номер телефону вже зареєстрований")
        
    user = User(
        username=data.username, 
        phone=data.phone, 
        role=data.role, 
        telegram_id=data.telegram_id
    )
    user.set_password(data.password)
    user.save()
    return user

# А тут залишаємо /me (без префікса)
@router.get("/me", auth=JWTAuth(), response=UserOutSchema)
def me(request):
    return request.auth