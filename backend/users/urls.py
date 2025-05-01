from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, check_user_exists

router = DefaultRouter()
router.register(r'', AuthViewSet, basename='auth')

urlpatterns = [
    path('', include(router.urls)),
    path('exists/<str:username>/', check_user_exists, name='check-user-exists'),
] 