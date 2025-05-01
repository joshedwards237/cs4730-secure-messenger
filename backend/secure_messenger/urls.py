"""
URL configuration for secure_messenger project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework.routers import DefaultRouter
from chat.views import ChatSessionViewSet, MessageViewSet

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'chats', ChatSessionViewSet, basename='chat')
router.register(r'messages', MessageViewSet, basename='message')

# API URLs
api_urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('users.urls')),  # Auth URLs
]

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include((api_urlpatterns, 'api'))),
    
    # Redirect root URL to API root
    path('', RedirectView.as_view(url='/api/', permanent=False)),

    path('api/users/', include('users.urls')),
]
