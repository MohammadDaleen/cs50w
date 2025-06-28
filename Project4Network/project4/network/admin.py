from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Comment, Follower, Like, Post, User

# Register your models here.


# Register and customize the User model in the admin interface.
class CustomUserAdmin(UserAdmin):
    # Add the profilePicture and is_announcer fields to the default fieldsets
    fieldsets = UserAdmin.fieldsets + (
        ("Additional Info", {"fields": ("profilePicture", "is_announcer")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Additional Info", {"fields": ("profilePicture", "is_announcer")}),
    )
    # Customize list display in the user changelist
    list_display = (
        "username",
        "email",
        "is_superuser",
        "is_staff",
        "is_announcer",
    )
    list_filter = ("is_staff", "is_superuser", "is_announcer")


# Register the customized User admin
admin.site.register(User, CustomUserAdmin)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "poster", "content", "timestamp")
    list_filter = ("poster", "timestamp")
    search_fields = ("content", "poster__username")
    readonly_fields = ("timestamp",)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "commenter", "content", "timestamp")
    list_filter = ("timestamp",)
    search_fields = ("content", "commenter__username", "post__id")
    readonly_fields = ("timestamp",)


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("id", "likedPost", "liker")
    search_fields = ("liker__username",)


@admin.register(Follower)
class FollowerAdmin(admin.ModelAdmin):
    list_display = ("id", "follower", "followee")
    search_fields = (
        "follower__username",
        "followee__username",
    )
