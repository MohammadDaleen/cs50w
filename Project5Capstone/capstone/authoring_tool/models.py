import os
import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Doc(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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

    def delete(self, *args, **kwargs):
        # Check if there is a file associated with this object
        if self.file:
            # If so, delete the file from the filesystem
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        # Call the superclass's delete method to remove the database record
        super().delete(*args, **kwargs)

    def get_descendants(self, include_self=False):
        """Get all descendants of this node in tree structure"""
        descendants = []

        if include_self:
            descendants.append(self)

        for child in self.children.all().order_by("order"):
            descendants.extend(child.get_descendants(include_self=True))

        return descendants

    def get_aggregated_content(self, include_children: bool = False) -> str:
        """
        Reads and concatenates the file content for this node and, optionally, its descendants.
        """
        nodes_to_process = []
        if include_children:
            # Get the node itself and all its children in the correct order
            nodes_to_process = self.get_descendants(include_self=True)
        else:
            nodes_to_process = [self]

        aggregated_html = ""
        for node in nodes_to_process:
            if node.file and hasattr(node.file, "path"):
                try:
                    with open(node.file.path, "r", encoding="utf-8") as f:
                        aggregated_html += f.read() + "\n"
                except FileNotFoundError:
                    # Handle case where file is missing from storage
                    pass
        return aggregated_html

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
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class AttachmentType(models.TextChoices):
    IMAGE = "IMAGE", "Image"
    VIDEO = "VIDEO", "Video"
    AUDIO = "AUDIO", "Audio"
    MODEL = "MODEL", "Interactive Model"
    OTHER = "OTHER", "Other"


def attachment_upload_path(instance, filename):
    """Generates a unique path for each attachment file."""
    # file will be uploaded to MEDIA_ROOT/attachments/<content_id>/<filename>
    return f"attachments/{instance.content.id}/{filename}"


class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content = models.ForeignKey(
        Content, on_delete=models.CASCADE, related_name="attachments"
    )
    name = models.CharField(max_length=255)  # Original filename
    file = models.FileField(upload_to=attachment_upload_path)
    type = models.CharField(
        max_length=10, choices=AttachmentType.choices, default=AttachmentType.OTHER
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def delete(self, *args, **kwargs):
        """Deletes the file from storage when the model instance is deleted."""
        if self.file and os.path.isfile(self.file.path):
            os.remove(self.file.path)
        super().delete(*args, **kwargs)

    def __str__(self):
        return self.name
