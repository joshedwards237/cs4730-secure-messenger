from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import ChatSession, ChatParticipant, Message
from .serializers import (
    ChatSessionSerializer, 
    CreateChatSessionSerializer, 
    MessageSerializer
)
from encryption.utils import (
    encrypt_message_for_participants,
    decrypt_with_private_key,
    decrypt_with_aes
)
import uuid
import logging
import json
import base64

logger = logging.getLogger(__name__)

User = get_user_model()


class ChatSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get chat sessions where the user is an active participant."""
        user = self.request.user
        logger.info(f"Getting chat sessions for user: {user.username}")
        
        if self.action == 'retrieve':
            # For retrieving a specific chat session, check if user is a participant
            chat_id = self.kwargs.get('pk')
            logger.info(f"Retrieving specific chat session: {chat_id}")
            if chat_id:
                queryset = ChatSession.objects.filter(
                    id=chat_id,
                    participants__user=user,
                    participants__is_active=True
                )
                logger.info(f"Found {queryset.count()} matching chat sessions")
                return queryset
        # For list view, return all active chat sessions for the user
        queryset = ChatSession.objects.filter(
            participants__user=user,
            participants__is_active=True
        )
        logger.info(f"Found {queryset.count()} active chat sessions for user")
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateChatSessionSerializer
        return ChatSessionSerializer
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete a chat session for the current user."""
        chat_session = self.get_object()
        
        # Check if user is a participant
        try:
            participant = ChatParticipant.objects.get(chat_session=chat_session, user=request.user)
            # Set the participant's is_active to False instead of deleting the chat
            participant.is_active = False
            participant.save()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ChatParticipant.DoesNotExist:
            return Response(
                {'error': 'You are not a participant in this chat session'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    def create(self, request):
        """Create a new chat session."""
        # Generate a session ID if not provided
        if 'session_id' not in request.data:
            request.data['session_id'] = str(uuid.uuid4())
        
        # Add the current user to participants if not already included
        if 'participant_usernames' not in request.data:
            request.data['participant_usernames'] = []
        
        if request.user.username not in request.data['participant_usernames']:
            request.data['participant_usernames'].append(request.user.username)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        chat_session = serializer.save()
        
        return Response(
            ChatSessionSerializer(chat_session).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def add_participant(self, request, pk=None):
        """Add a participant to a chat session."""
        chat_session = self.get_object()
        username = request.data.get('username')
        
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(username=username)
            
            # Check if user is already a participant
            if ChatParticipant.objects.filter(chat_session=chat_session, user=user).exists():
                return Response({'error': 'User is already a participant'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Add user as participant
            ChatParticipant.objects.create(chat_session=chat_session, user=user)
            
            return Response(ChatSessionSerializer(chat_session).data)
        
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def remove_participant(self, request, pk=None):
        """Remove a participant from a chat session."""
        chat_session = self.get_object()
        username = request.data.get('username')
        
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(username=username)
            participant = ChatParticipant.objects.get(chat_session=chat_session, user=user)
            participant.is_active = False
            participant.save()
            
            return Response(ChatSessionSerializer(chat_session).data)
        
        except (User.DoesNotExist, ChatParticipant.DoesNotExist):
            return Response({'error': 'Participant not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get', 'post'])
    def messages(self, request, pk=None):
        """Handle messages for a specific chat session."""
        chat_session = self.get_object()
        
        if request.method == 'GET':
            messages = Message.objects.filter(chat_session=chat_session)
            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Check if user is a participant
            if not ChatParticipant.objects.filter(
                chat_session=chat_session,
                user=request.user,
                is_active=True
            ).exists():
                return Response(
                    {'error': 'You are not an active participant in this chat session'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get all active participants and their public keys
            participants = ChatParticipant.objects.filter(
                chat_session=chat_session,
                is_active=True
            ).select_related('user')
            
            participants_public_keys = {
                participant.user.username: participant.user.public_key
                for participant in participants
            }
            
            # Encrypt the message for all participants
            encrypted_data = encrypt_message_for_participants(
                request.data.get('content', ''),
                participants_public_keys
            )
            
            # Log encryption details
            print(f"Message encryption details:")
            print(f"Original content: {request.data.get('content', '')}")
            print(f"Encrypted content: {encrypted_data['encrypted_content']}")
            print(f"IV: {encrypted_data['iv']}")
            print(f"Encrypted keys: {json.dumps(encrypted_data['encrypted_keys'], indent=2)}")
            
            # Create encrypted message
            message = Message.objects.create(
                chat_session=chat_session,
                sender=request.user,
                content=encrypted_data['encrypted_content'],
                encryption_key=encrypted_data['encrypted_keys'][request.user.username],
                encrypted_keys=encrypted_data['encrypted_keys'],
                iv=encrypted_data['iv']
            )
            
            serializer = MessageSerializer(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific chat session."""
        logger.info(f"Retrieve request for chat session {kwargs.get('pk')} from user {request.user.username}")
        try:
            instance = self.get_object()
            logger.info(f"Found chat session: {instance.id}")
            serializer = self.get_serializer(instance)
            logger.info(f"Serialized chat session data: {serializer.data}")
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error retrieving chat session: {str(e)}")
            raise


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get messages for a specific chat session."""
        chat_session_id = self.request.query_params.get('chat_session_id')
        if chat_session_id:
            try:
                chat_session = ChatSession.objects.get(id=chat_session_id)
                # Check if user is a participant
                if ChatParticipant.objects.filter(chat_session=chat_session, user=self.request.user).exists():
                    return Message.objects.filter(chat_session=chat_session)
            except ChatSession.DoesNotExist:
                pass
        return Message.objects.none()
    
    def create(self, request):
        """Create a new message."""
        chat_session_id = request.data.get('chat_session_id')
        
        if not chat_session_id:
            return Response({'error': 'Chat session ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            chat_session = ChatSession.objects.get(id=chat_session_id)
            
            # Check if user is a participant
            if not ChatParticipant.objects.filter(chat_session=chat_session, user=request.user, is_active=True).exists():
                return Response({'error': 'You are not an active participant in this chat session'}, 
                                status=status.HTTP_403_FORBIDDEN)
            
            # Get the message content
            content = request.data.get('content', '')
            
            # Get all active participants and their public keys
            participants = ChatParticipant.objects.filter(
                chat_session=chat_session,
                is_active=True
            ).select_related('user')
            
            participants_public_keys = {
                participant.user.username: participant.user.public_key
                for participant in participants
            }
            
            # Encrypt the message for all participants
            encrypted_data = encrypt_message_for_participants(content, participants_public_keys)
            
            # Log encryption details
            logger.info(f"Message encryption details:")
            logger.info(f"Original content: {content}")
            logger.info(f"Encrypted content: {encrypted_data['encrypted_content']}")
            logger.info(f"IV: {encrypted_data['iv']}")
            logger.info(f"Encrypted keys: {json.dumps(encrypted_data['encrypted_keys'], indent=2)}")
            
            # Create encrypted message
            message = Message.objects.create(
                chat_session=chat_session,
                sender=request.user,
                content=encrypted_data['encrypted_content'],
                encryption_key=encrypted_data['encrypted_keys'][request.user.username],
                encrypted_keys=encrypted_data['encrypted_keys'],
                iv=encrypted_data['iv']
            )
            
            # Log message creation
            logger.info(f"Message created:")
            logger.info(f"Message ID: {message.id}")
            logger.info(f"Chat Session: {chat_session.id}")
            logger.info(f"Sender: {request.user.username}")
            logger.info(f"Content: {message.content}")
            
            return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
        
        except ChatSession.DoesNotExist:
            return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve and decrypt a message."""
        message = self.get_object()
        
        # Decrypt the AES key using the user's private key
        try:
            aes_key_str = decrypt_with_private_key(
                request.user.private_key,
                message.encryption_key
            )
            aes_key = base64.b64decode(aes_key_str)
            
            # Decrypt the message content
            decrypted_content = decrypt_with_aes(
                aes_key,
                message.iv,
                message.content
            )
            
            # Add decrypted content to the response
            response_data = MessageSerializer(message).data
            response_data['decrypted_content'] = decrypted_content
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Failed to decrypt message: {str(e)}")
            return Response(
                {'error': 'Failed to decrypt message'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )