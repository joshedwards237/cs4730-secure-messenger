from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CustomUser, UserSession

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'public_key', 'private_key', 'date_joined', 'last_login']
        read_only_fields = ['id', 'date_joined', 'last_login']
        extra_kwargs = {
            'private_key': {'write_only': False}  # Allow private_key to be read
        }


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    public_key = serializers.CharField(required=False)
    private_key = serializers.CharField(required=False, write_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['username', 'password', 'public_key', 'private_key']
    
    def create(self, validated_data):
        print("UserRegistrationSerializer: Starting user creation")
        print(f"UserRegistrationSerializer: Validated data keys: {validated_data.keys()}")
        
        # Extract private key before creating user
        private_key = validated_data.pop('private_key', None)
        print(f"UserRegistrationSerializer: Private key extracted, length: {len(private_key) if private_key else 0}")
        
        # Create user with remaining data
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            public_key=validated_data.get('public_key', ''),
            private_key=private_key or ''
        )
        print(f"UserRegistrationSerializer: User created with private key length: {len(user.private_key) if user.private_key else 0}")
        
        # Verify the private key was saved
        user.refresh_from_db()
        print(f"UserRegistrationSerializer: After refresh - Private key length: {len(user.private_key) if user.private_key else 0}")
        
        return user


class UserSessionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserSession
        fields = ['id', 'user', 'session_id', 'created_at', 'last_active', 'is_active', 'username']
        read_only_fields = ['id', 'created_at', 'last_active'] 