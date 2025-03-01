from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from .models import UserSession
from .serializers import UserSerializer, UserRegistrationSerializer, UserSessionSerializer
import uuid
from encryption.utils import generate_key_pair

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action == 'create' or self.action == 'login':
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    def create(self, request):
        """Register a new user."""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            # Generate key pair if not provided
            if 'public_key' not in request.data:
                key_pair = generate_key_pair()
                serializer.validated_data['public_key'] = key_pair['public_key']
                private_key = key_pair['private_key']
            else:
                private_key = None
            
            user = serializer.save()
            
            # Log the user in
            login(request, user)
            
            # Create a session
            session_id = str(uuid.uuid4())
            UserSession.objects.create(user=user, session_id=session_id)
            
            response_data = {
                'user': UserSerializer(user).data,
                'session_id': session_id
            }
            
            # Include private key in response if generated
            if private_key:
                response_data['private_key'] = private_key
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """Log in a user."""
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': 'Please provide both username and password'},
                            status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if user:
            login(request, user)
            
            # Create a session
            session_id = str(uuid.uuid4())
            UserSession.objects.create(user=user, session_id=session_id)
            
            return Response({
                'user': UserSerializer(user).data,
                'session_id': session_id
            })
        
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """Log out a user."""
        session_id = request.data.get('session_id')
        
        if session_id:
            # Mark session as inactive
            try:
                session = UserSession.objects.get(session_id=session_id)
                session.is_active = False
                session.save()
            except UserSession.DoesNotExist:
                pass
        
        logout(request)
        return Response({'success': 'Logged out successfully'})
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get the current user's information."""
        return Response(UserSerializer(request.user).data)


class UserSessionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserSession.objects.filter(user=self.request.user) 