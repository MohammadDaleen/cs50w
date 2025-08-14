from django.urls import path

from . import views

urlpatterns = [
    # Auth URLs
    path("api/auth-status", views.auth_status, name="api_auth_status"),
    path("api/register", views.register, name="api_register"),
    path("api/login", views.login_view, name="api_login"),
    path("api/logout", views.logout_view, name="api_logout"),
]
