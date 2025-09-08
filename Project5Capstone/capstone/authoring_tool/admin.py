from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Content, Doc, Resource, User

admin.site.register(User, UserAdmin)


@admin.register(Doc)
class DocAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "author", "timestamp")
    search_fields = ("name", "author__username")
    list_filter = ("timestamp",)


@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "parent",
        "document",
        "order",
        "level",
        "author",
        "timestamp",
    )
    search_fields = ("name", "document__name", "author__username")
    list_filter = ("level", "timestamp")


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "type", "is_active", "created_at", "updated_at")
    search_fields = ("name", "type")
    list_filter = ("type", "is_active", "created_at")
