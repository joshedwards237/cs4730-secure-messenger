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
import uuid

User = get_user_model()


class ChatSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get chat sessions where the user is a participant."""
        user = self.request.user
        participant_sessions = ChatParticipant.objects.filter(user=user).values_list('chat_session', flat=True)
        return ChatSession.objects.filter(id__in=participant_sessions)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateChatSessionSerializer
        return ChatSessionSerializer
    
    def create(self, request):
        """Create a new chat session with participant validation."""
        # Generate a session ID if not provided
        if 'session_id' not in request.data:
            request.data['session_id'] = str(uuid.uuid4())

        # Add the current user to participants if not already included
        if 'participant_usernames' not in request.data:
            request.data['participant_usernames'] = []

        if request.user.username not in request.data['participant_usernames']:
            request.data['participant_usernames'].append(request.user.username)

        # ✅ Check all participant usernames exist
        usernames = request.data['participant_usernames']
        found_users = User.objects.filter(username__in=usernames)
        if found_users.count() != len(usernames):
            return Response(
                {'error': 'One or more users do not exist'},
                status=status.HTTP_400_BAD_REQUEST
            )

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
            
            # Create message
            message = Message.objects.create(
                chat_session=chat_session,
                sender=request.user,
                encrypted_content=request.data.get('encrypted_content', ''),
                encryption_method=request.data.get('encryption_method', 'RSA'),
                is_encrypted=request.data.get('is_encrypted', False)
            )
            
            serializer = MessageSerializer(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


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
            
            # Create message
            message = Message.objects.create(
                chat_session=chat_session,
                sender=request.user,
                encrypted_content=request.data.get('encrypted_content', ''),
                encryption_method=request.data.get('encryption_method', 'RSA'),
                is_encrypted=True
)
            
            return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
        
        except ChatSession.DoesNotExist:
            return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND) 