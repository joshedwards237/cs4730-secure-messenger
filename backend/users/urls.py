from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, UserSessionViewSet

router = DefaultRouter()
router.register(r'', AuthViewSet, basename='auth')
router.register(r'sessions', UserSessionViewSet, basename='session')

urlpatterns = [
    path('', include(router.urls)),
] 