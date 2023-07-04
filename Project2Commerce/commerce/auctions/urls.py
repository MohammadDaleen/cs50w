from django.urls import path

from . import views

app_name = "commerce"
urlpatterns = [
    path("", views.index, name="index"),
    path("addBid", views.addBid, name="addBid"),
    path("addComment", views.addComment, name="addComment"),
    path("categories", views.categories, name="categories"),
    path("category/<str:key>", views.category, name="category"),
    path("closeAuction", views.closeAuction, name="closeAuction"),
    path("listing/<str:id>", views.listing, name="listing"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("newListing", views.newListing, name="newListing"),
    path("register", views.register, name="register"),
    path("removeWatchlist", views.removeWatchlist, name="removeWatchlist"),
    path("watchlist", views.watchlist, name="watchlist")
]
