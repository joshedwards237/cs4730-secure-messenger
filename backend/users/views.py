from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from .models import CustomUser, UserSession
from .serializers import UserSerializer, UserRegistrationSerializer, UserSessionSerializer
import uuid
from encryption.utils import generate_key_pair

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def login(self, request):
        """Log in a user."""
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Please provide both username and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=username, password=password)
        
        if user:
            login(request, user)
            
            # Create or get token
            token, _ = Token.objects.get_or_create(user=user)
            
            # Create a session
            session_id = str(uuid.uuid4())
            UserSession.objects.create(user=user, session_id=session_id)
            
            # Get the user's private key
            private_key = user.private_key
            print(f"Login: User {username} private key length: {len(private_key) if private_key else 0}")
            
            # Serialize user data
            user_data = UserSerializer(user).data
            
            response_data = {
                'user': user_data,
                'token': token.key,
                'session_id': session_id
            }
            
            if private_key:
                response_data['private_key'] = private_key
                print(f"Login: Private key included in response for user {username}")
            else:
                print(f"Login: No private key found for user {username}")
            
            return Response(response_data)
        
        return Response(
            {'error': 'Invalid credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

    @action(detail=False, methods=['post'])
    def register(self, request):
        """Register a new user."""
        print(f"Register: Starting registration process for username: {request.data.get('username')}")
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            print("Register: Serializer validation successful")
            
            # Always generate a new key pair for security
            print("Register: Generating new key pair...")
            key_pair = generate_key_pair()
            print(f"Register: Key pair generated - Private key length: {len(key_pair['private_key'])}, Public key length: {len(key_pair['public_key'])}")
            
            # Update serializer data with keys
            serializer.validated_data['public_key'] = key_pair['public_key']
            serializer.validated_data['private_key'] = key_pair['private_key']
            print("Register: Keys added to serializer validated data")
            
            # Create the user
            print("Register: Saving user with serializer...")
            user = serializer.save()
            print(f"Register: User saved - Username: {user.username}")
            print(f"Register: User model private key length: {len(user.private_key) if user.private_key else 0}")
            print(f"Register: User model public key length: {len(user.public_key) if user.public_key else 0}")
            
            # Verify the keys were saved
            user.refresh_from_db()
            print(f"Register: After refresh - Private key length: {len(user.private_key) if user.private_key else 0}")
            print(f"Register: After refresh - Public key length: {len(user.public_key) if user.public_key else 0}")
            
            login(request, user)
            print("Register: User logged in")
            
            # Create token
            token = Token.objects.create(user=user)
            print("Register: Auth token created")
            
            # Create a session
            session_id = str(uuid.uuid4())
            UserSession.objects.create(user=user, session_id=session_id)
            print(f"Register: Session created with ID: {session_id}")
            
            response_data = {
                'user': UserSerializer(user).data,
                'token': token.key,
                'session_id': session_id
            }
            
            if user.private_key:
                response_data['private_key'] = user.private_key
                print(f"Register: Private key included in response, length: {len(user.private_key)}")
            else:
                print("Register: WARNING - No private key found in user model for response")
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        else:
            print(f"Register: Serializer validation failed - Errors: {serializer.errors}")
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        """Log out a user."""
        if request.user.is_authenticated:
            session_id = request.data.get('session_id')
            if session_id:
                try:
                    session = UserSession.objects.get(session_id=session_id)
                    session.is_active = False
                    session.save()
                except UserSession.DoesNotExist:
                    pass
            
            # Delete the user's token
            Token.objects.filter(user=request.user).delete()
            
            logout(request)
        return Response({'success': 'Logged out successfully'})

    @action(detail=False, methods=['get'])
    def user(self, request):
        """Get the current user's information."""
        if request.user.is_authenticated:
            return Response(UserSerializer(request.user).data)
        return Response(
            {'error': 'Not authenticated'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        """Update user profile information."""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Not authenticated'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserSessionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserSession.objects.filter(user=self.request.user) 