from rest_framework import serializers
from .models import ChatSession, ChatParticipant, Message
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ChatParticipant
        fields = ['id', 'username', 'joined_at', 'is_active']
        read_only_fields = ['joined_at']


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'sender_username', 'encrypted_content', 'encryption_method', 'timestamp']
        read_only_fields = ['timestamp']


class ChatSessionSerializer(serializers.ModelSerializer):
    participants = ChatParticipantSerializer(many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatSession
        fields = ['id', 'session_id', 'created_at', 'is_active', 'participants', 'messages']
        read_only_fields = ['created_at']


class CreateChatSessionSerializer(serializers.ModelSerializer):
    participant_usernames = serializers.ListField(
        child=serializers.CharField(),
        write_only=True
    )
    
    class Meta:
        model = ChatSession
        fields = ['session_id', 'participant_usernames']
    
    def create(self, validated_data):
        participant_usernames = validated_data.pop('participant_usernames')
        chat_session = ChatSession.objects.create(**validated_data)
        
        # Add participants
        for username in participant_usernames:
            try:
                user = User.objects.get(username=username)
                ChatParticipant.objects.create(
                    chat_session=chat_session,
                    user=user
                )
            except User.DoesNotExist:
                pass
        
        return chat_session 