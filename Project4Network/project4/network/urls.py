from django.conf import settings
from django.conf.urls.static import static
from django.urls import path

from . import views

urlpatterns = [
    # Auth URLs
    path("api/auth-status", views.auth_status, name="api_auth_status"),
    path("api/register", views.register, name="api_register"),
    path("api/login", views.login_view, name="api_login"),
    path("api/logout", views.logout_view, name="api_logout"),
    # Post(s) URLs
    path("api/post", views.post, name="api_post"),
    path("api/posts", views.posts, name="api_posts"),
    path("api/post/<int:post_id>", views.get_post, name="api_get_post"),
    path("api/post/<int:post_id>/delete", views.delete_post, name="api_delete_post"),
    path("api/post/<int:post_id>/edit", views.edit_post, name="api_edit_post"),
    path("api/post/<int:post_id>/like", views.toggle_like, name="api_toggle_like"),
    path("api/post/<int:post_id>/comment", views.comment, name="api_comment"),
    path("api/post/<int:post_id>/comments", views.comments, name="api_comments"),
    # Follow URLs
    path("api/follow", views.follow, name="api_follow"),
    path("api/following", views.following_posts, name="api_following_posts"),
    # Profile Picture URLs
    path(
        "api/profile-picture/upload",
        views.upload_profile_picture,
        name="api_upload_profile_picture",
    ),
    path(
        "api/profile-picture/remove",
        views.remove_profile_picture,
        name="api_remove_profile_picture",
    ),
    # Profile URLs
    path("api/<str:username>", views.user, name="api_user"),
    path(
        "api/<str:username>/followers", views.followers_list, name="api_followers_list"
    ),
    path(
        "api/<str:username>/followees", views.followees_list, name="api_followees_list"
    ),
]

# TODO: change for production
# The following line appends static() URL patterns to serve media files during development.
# It tells Django to serve any file requested from MEDIA_URL (e.g., /media/filename.jpg)
# using files from the directory specified by MEDIA_ROOT.
# This is only for development; in production, you'll need to configure your web server to serve media.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
