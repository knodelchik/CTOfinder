# car_repair_backend/core/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Request, Offer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@receiver(post_save, sender=Request)
def request_created_handler(sender, instance, created, **kwargs):
    """
    Сигнал при створенні або оновленні Заявки.
    """
    channel_layer = get_channel_layer()
    
    if created:
        # 1. СТВОРЕННЯ: Сповіщаємо всіх механіків (група "mechanics")
        # Безпечно отримуємо координати
        lat = instance.location.y if instance.location else None
        lng = instance.location.x if instance.location else None

        async_to_sync(channel_layer.group_send)(
            "mechanics",
            {
                "type": "send_notification", # Метод, який має бути в Consumer
                "message": f"Нова заявка: {instance.car_model}",
                "data": {
                    "event": "new_request",
                    "request_id": instance.id,
                    "is_sos": instance.is_sos, # Беремо з поля моделі
                    "lat": lat,
                    "lng": lng,
                    "description": instance.description
                }
            }
        )
    else:
        # 2. ОНОВЛЕННЯ: Сповіщаємо водія про зміну статусу (група "user_{id}")
        if instance.client:
            async_to_sync(channel_layer.group_send)(
                f"user_{instance.client.id}",
                {
                    "type": "send_notification",
                    "message": f"Статус заявки змінено на: {instance.get_status_display()}", # Гарний текст статусу
                    "data": {
                        "event": "request_status_update",
                        "request_id": instance.id,
                        "status": instance.status
                    }
                }
            )

@receiver(post_save, sender=Offer)
def offer_created_handler(sender, instance, created, **kwargs):
    """
    Сигнал при створенні або прийнятті Офера.
    """
    channel_layer = get_channel_layer()
    
    # 🔥 ВИПРАВЛЕННЯ 1: Безпечно отримуємо ім'я СТО через механіка
    mechanic_name = instance.mechanic.username # Дефолтне ім'я
    if hasattr(instance.mechanic, 'station') and instance.mechanic.station:
        mechanic_name = instance.mechanic.station.name

    if created:
        # 1. НОВИЙ ОФЕР: Сповіщаємо водія
        if instance.request.client:
            async_to_sync(channel_layer.group_send)(
                f"user_{instance.request.client.id}",
                {
                    "type": "send_notification",
                    "message": f"Пропозиція від {mechanic_name}: {instance.price} грн",
                    "data": {
                        "event": "new_offer",
                        "request_id": instance.request.id,
                        "offer_id": instance.id,
                        "price": instance.price,
                        "mechanic_name": mechanic_name
                    }
                }
            )
            
    elif instance.is_accepted:
        # 2. ОФЕР ПРИЙНЯТО: Сповіщаємо майстра
        # 🔥 ВИПРАВЛЕННЯ 2: Шлемо прямо механіку, без station.owner
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.mechanic.id}", 
            {
                "type": "send_notification",
                "message": f"Вашу пропозицію на {instance.request.car_model} прийнято!",
                "data": {
                    "event": "offer_accepted",
                    "request_id": instance.request.id,
                    "client_phone": instance.request.client.phone # Передаємо телефон клієнта
                }
            }
        )