from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CustomUser, UserSession

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'public_key']
        read_only_fields = ['id']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    public_key = serializers.CharField(required=False)
    
    class Meta:
        model = CustomUser
        fields = ['username', 'password', 'public_key']
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            public_key=validated_data.get('public_key', '')
        )
        return user


class UserSessionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserSession
        fields = ['id', 'user', 'session_id', 'created_at', 'last_active', 'is_active', 'username']
        read_only_fields = ['id', 'created_at', 'last_active'] 