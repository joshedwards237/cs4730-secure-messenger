import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatSession, ChatParticipant, Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_session_id = self.scope['url_route']['kwargs']['chat_session_id']
        self.room_group_name = f'chat_{self.chat_session_id}'
        
        # Check if user is authenticated
        if not self.scope['user'].is_authenticated:
            await self.close()
            return
        
        # Check if user is a participant in the chat session
        is_participant = await self.is_participant(self.scope['user'], self.chat_session_id)
        if not is_participant:
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Notify other participants that this user has joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_join',
                'username': self.scope['user'].username
            }
        )
    
    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            
            # Notify other participants that this user has left
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_leave',
                    'username': self.scope['user'].username
                }
            )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type', 'message')
        
        if message_type == 'message':
            encrypted_content = data.get('encrypted_content', '')
            encryption_method = data.get('encryption_method', 'AES')
            
            # Save message to database
            message = await self.save_message(
                self.scope['user'],
                self.chat_session_id,
                encrypted_content,
                encryption_method
            )
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message_id': message.id,
                    'sender_username': self.scope['user'].username,
                    'encrypted_content': encrypted_content,
                    'encryption_method': encryption_method,
                    'timestamp': message.timestamp.isoformat()
                }
            )
        
        elif message_type == 'typing':
            # Send typing notification to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_typing',
                    'username': self.scope['user'].username,
                    'is_typing': data.get('is_typing', False)
                }
            )
    
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message_id': event['message_id'],
            'sender_username': event['sender_username'],
            'encrypted_content': event['encrypted_content'],
            'encryption_method': event['encryption_method'],
            'timestamp': event['timestamp']
        }))
    
    async def user_typing(self, event):
        # Send typing notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'username': event['username'],
            'is_typing': event['is_typing']
        }))
    
    async def user_join(self, event):
        # Send user join notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user_join',
            'username': event['username']
        }))
    
    async def user_leave(self, event):
        # Send user leave notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user_leave',
            'username': event['username']
        }))
    
    @database_sync_to_async
    def is_participant(self, user, chat_session_id):
        try:
            chat_session = ChatSession.objects.get(id=chat_session_id)
            return ChatParticipant.objects.filter(
                chat_session=chat_session,
                user=user,
                is_active=True
            ).exists()
        except ChatSession.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_message(self, user, chat_session_id, encrypted_content, encryption_method):
        chat_session = ChatSession.objects.get(id=chat_session_id)
        message = Message.objects.create(
            chat_session=chat_session,
            sender=user,
            encrypted_content=encrypted_content,
            encryption_method=encryption_method
        )
        return message 