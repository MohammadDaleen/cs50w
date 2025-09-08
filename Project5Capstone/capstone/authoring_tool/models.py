import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Doc(models.Model):
    name = models.CharField(max_length=1024)
    description = models.CharField(
        max_length=1024,
        null=True,  # Allow null initially for creation
    )
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_docs")
    timestamp = models.DateTimeField(auto_now_add=True)
    root_content_node = models.OneToOneField(
        "Content",
        on_delete=models.CASCADE,
        related_name="root_for_doc",  # Unique related_name for one-to-one
        null=True,  # Allow null initially for creation
    )  # One-to-one relation with root Content node

    def __str__(self):
        return self.name


class Content(models.Model):
    name = models.CharField(max_length=1024)
    file = models.FileField(
        upload_to="content_files/", blank=True, null=True
    )  # Stores HTML/files
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="children"
    )  # Recursive relationship for tree structure
    order = models.IntegerField(default=0)  # Global node's order (in hierarchy)
    document = models.ForeignKey(
        Doc, on_delete=models.CASCADE, related_name="content_nodes"
    )  # Links Content to its Doc
    level = models.IntegerField(default=0)  # Depth in the hierarchy
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="user_content_nodes"
    )
    timestamp = models.DateTimeField(auto_now_add=True)  # Auto-set on creation

    def get_descendants(self, include_self=False):
        """Get all descendants of this node in tree structure"""
        descendants = []

        if include_self:
            descendants.append(self)

        for child in self.children.all().order_by("order"):
            descendants.extend(child.get_descendants(include_self=True))

        return descendants

    def __str__(self):
        return self.name


class ResourceType(models.TextChoices):
    JS = "JS", "JavaScript"
    CSS = "CSS", "CSS"
    FONT = "FONT", "Font"
    SVG = "SVG", "SVG"
    HTML = "HTML", "HTML"


class Resource(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to="resources/")
    type = models.CharField(max_length=10, choices=ResourceType.choices)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
