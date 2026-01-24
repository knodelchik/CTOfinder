import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        if self.user.is_anonymous:
            await self.close()
            return

        # Підписуємо юзера на його особистий канал (user_1, user_2...)
        self.room_group_name = f"user_{self.user.id}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Якщо це майстер, підписуємо на розсилку нових заявок
        # (Тут спрощено, в ідеалі перевіряти роль)
        if hasattr(self.user, 'station'): 
             await self.channel_layer.group_add("mechanics", self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        if hasattr(self.user, 'station'):
            await self.channel_layer.group_discard("mechanics", self.channel_name)

    # Отримання повідомлення від групи і відправка на фронтенд
    async def send_notification(self, event):
        message = event['message']
        data = event.get('data', {})
        
        await self.send(text_data=json.dumps({
            'type': event['type'], # 'new_request', 'new_offer', 'request_updated'
            'message': message,
            'data': data
        }))