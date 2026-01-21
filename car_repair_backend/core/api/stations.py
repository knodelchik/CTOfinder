from typing import List
from ninja import Router
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from ninja_jwt.authentication import JWTAuth
from core.models import ServiceStation
from core.schemas import StationOutSchema, StationIn

# 1. Роутер для особистого кабінету (/my-station)
station_router = Router()

@station_router.get("/my-station", auth=JWTAuth(), response=StationOutSchema)
def get_my_station(request):
    station = ServiceStation.objects.filter(owner=request.auth).first()
    if not station:
        return 204, None
    return {
        "id": station.id, # type: ignore
        "name": station.name,
        "description": station.description,
        "address": station.address,
        "phone": station.phone,
        "location": {"x": station.location.x, "y": station.location.y}
    }

@station_router.post("/my-station", auth=JWTAuth())
def update_my_station(request, data: StationIn):
    user = request.auth
    new_location = Point(data.lng, data.lat)
    
    station, created = ServiceStation.objects.update_or_create(
        owner=user,
        defaults={
            "name": data.name,
            "address": data.address,
            "phone": data.phone,
            "location": new_location,
            "description": getattr(data, 'description', '')
        }
    )
    
    if user.role != 'mechanic':
        user.role = 'mechanic'
        user.save()

    return {"success": True}

# 2. Роутер для гео-пошуку (/stations/nearby)
geo_router = Router()

@geo_router.get("/nearby", response=List[StationOutSchema]) 
def get_nearby_stations(request, lat: float, lng: float, radius_km: int = 20):
    user_location = Point(lng, lat)
    stations = ServiceStation.objects.filter(
        location__distance_lte=(user_location, D(km=radius_km))
    )
    result = []
    for s in stations:
        result.append({
            "id": s.id, # type: ignore
            "name": s.name,
            "description": s.description,
            "address": s.address,
            "phone": s.phone,
            "location": {"x": s.location.x, "y": s.location.y}
        })
    return result