import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatSession, ChatParticipant, Message
from encryption.utils import (
    encrypt_message_for_participants,
    decrypt_with_private_key,
    decrypt_with_aes
)
import logging
import base64

User = get_user_model()

logger = logging.getLogger(__name__)


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
            content = data.get('content', '')
            
            # Get all active participants and their public keys
            participants = await self.get_participants(self.chat_session_id)
            participants_public_keys = {
                participant.user.username: participant.user.public_key
                for participant in participants
            }
            
            # Encrypt the message for all participants
            encrypted_data = encrypt_message_for_participants(content, participants_public_keys)
            
            # Log encryption details
            logger.info(f"WebSocket message encryption details:")
            logger.info(f"Original content: {content}")
            logger.info(f"Encrypted content: {encrypted_data['encrypted_content']}")
            logger.info(f"IV: {encrypted_data['iv']}")
            logger.info(f"Encrypted keys: {json.dumps(encrypted_data['encrypted_keys'], indent=2)}")
            
            # Save message to database
            message = await self.save_message(
                self.scope['user'],
                self.chat_session_id,
                encrypted_data['encrypted_content'],
                encrypted_data['encrypted_keys'][self.scope['user'].username],
                encrypted_data['iv']
            )
            
            # Log message details
            logger.info(f"WebSocket message created:")
            logger.info(f"Message ID: {message.id}")
            logger.info(f"Chat Session: {self.chat_session_id}")
            logger.info(f"Sender: {self.scope['user'].username}")
            logger.info(f"Content: {encrypted_data['encrypted_content']}")
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message_id': message.id,
                    'sender_username': self.scope['user'].username,
                    'content': encrypted_data['encrypted_content'],
                    'encryption_key': encrypted_data['encrypted_keys'],
                    'iv': encrypted_data['iv'],
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
        # Get the encrypted key for the current user
        user_key = event['encryption_key'].get(self.scope['user'].username)
        if not user_key:
            logger.error(f"No encryption key found for user {self.scope['user'].username}")
            return
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message_id': event['message_id'],
            'sender_username': event['sender_username'],
            'content': event['content'],
            'encryption_key': user_key,
            'iv': event['iv'],
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
    def get_participants(self, chat_session_id):
        chat_session = ChatSession.objects.get(id=chat_session_id)
        return list(ChatParticipant.objects.filter(
            chat_session=chat_session,
            is_active=True
        ).select_related('user'))
    
    @database_sync_to_async
    def save_message(self, user, chat_session_id, encrypted_content, encryption_key, iv):
        chat_session = ChatSession.objects.get(id=chat_session_id)
        message = Message.objects.create(
            chat_session=chat_session,
            sender=user,
            content=encrypted_content,
            encryption_key=encryption_key,
            iv=iv
        )
        return message