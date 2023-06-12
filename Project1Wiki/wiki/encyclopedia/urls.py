from django.urls import path

from . import views

app_name = "wiki"
urlpatterns = [
    path("", views.index, name="index"),
    path("wiki/search", views.search, name="search"),
    path("wiki/newPage", views.newPage, name="newPage"),
    path("wiki/editPage", views.editPage, name="editPage"),
    path("wiki/saveEditedPage", views.saveEditedPage, name="saveEditedPage"),
    path("wiki/randomPage", views.randomPage, name="randomPage"),
    path("wiki/<str:title>", views.entry, name="title")
]
