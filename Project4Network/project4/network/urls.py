
from django.urls import path

from . import views

app_name = "network"
urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("newPost", views.newPost, name='newPost'),
    path("<str:user>", views.profilePage, name="profilePage"),
    path("<str:user>/follow", views.follow, name="follow")
]
