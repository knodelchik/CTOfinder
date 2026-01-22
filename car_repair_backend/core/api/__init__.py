from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import NinjaJWTDefaultController
from core.api.categories import router as categories_router
from .auth import router as auth_router
from .cars import router as cars_router
from .stations import station_router, geo_router 
from .service import router as service_router
from core.api.offers import router as offers_router
from core.api.reviews import router as reviews_router

api = NinjaExtraAPI()
api.register_controllers(NinjaJWTDefaultController)

# --- ПІДКЛЮЧЕННЯ РОУТЕРІВ ---

# 1. Авторизація 
# БУЛО: api.add_router("/auth", auth_router)
# СТАЛО: (підключаємо в корінь, шляхи прописані всередині auth.py)
api.add_router("", auth_router)

# 2. Машини
api.add_router("", cars_router)

# 3. Особисте СТО
api.add_router("", station_router)

# 4. Пошук СТО
api.add_router("/stations", geo_router)

# 5. Заявки
api.add_router("", service_router)

api.add_router("/offers", offers_router)

api.add_router("/reviews", reviews_router)

api.add_router("/categories", categories_router)

