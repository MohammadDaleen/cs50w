# network/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.authtoken.models import Token

from .models import Content, Doc


# Serializer for the register information
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ["id", "username", "password", "email"]

    # Implement create(), it's used when calling serializer.save()
    def create(self, validated_data):
        user = get_user_model().objects.create_user(
            validated_data["username"],
            validated_data["email"],
            validated_data["password"],
        )
        # Create a token for the newly created user
        token, isCreated = Token.objects.get_or_create(user=user)
        return user, token


# Serializer for the user information
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ["id", "username", "email"]

    # Implement create(), it's used when calling serializer.save()
    def create(self, validated_data):
        user = get_user_model().objects.create_user(
            validated_data["username"],
            validated_data["email"],
            validated_data["password"],
        )
        # Create a token for the newly created user
        token, isCreated = Token.objects.get_or_create(user=user)
        return user, token


# Serializer for the document information
class DocSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doc
        # Fields to be returned by the serializer
        fields = [
            "id",
            "name",
            "description",
            "author",
            "timestamp",
            "root_content_node_id",
        ]
        read_only_fields = ["owner", "timestamp", "root_content_node_id"]

    def create(self, validated_data):
        # Extract the user from the context
        user = self.context["request"].user
        # Create the Doc instance without root_content_node (null initially)
        doc = Doc.objects.create(**validated_data)

        # Create the root Content node
        root_content = Content.objects.create(
            name=validated_data["name"],  # Use the doc's name or a default
            document=doc,  # Link to the created Doc
            author=user,  # Set the author to the authenticated user
            level=0,  # Root node has level 0
            parent=None,  # Root node has no parent
            file=None,  # Set to a default or leave blank
        )

        # Update the Doc instance to link the root Content node
        doc.root_content_node = root_content
        doc.save()

        return doc


class ContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = [
            "id",
            "name",
            "file",
            "parent",
            "order",
            "document",
            "level",
            "number",
            "author",
            "timestamp",
        ]
        read_only_fields = ["author", "timestamp"]


class ContentTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Content
        fields = [
            "id",
            "name",
            "file",
            "parent",
            "order",
            "document",
            "level",
            "number",
            "author",
            "timestamp",
            "children",
        ]

    def get_children(self, obj):
        # Recursively get children for tree structure
        children = obj.children.all().order_by("order")
        return ContentTreeSerializer(children, many=True).data
