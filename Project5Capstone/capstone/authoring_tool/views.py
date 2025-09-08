from typing import Any, Dict, List

from django.contrib.auth import authenticate, get_user_model, logout
from django.contrib.auth.models import update_last_login
from django.db import transaction

# Create your views here.
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Content, Doc, Resource, User
from .serializers import (
    ContentSerializer,
    ContentTreeSerializer,
    DocSerializer,
    ResourceSerializer,
    UserSerializer,
)


@api_view(["POST"])
def register(request: Request) -> Response:
    if request.method == "POST":
        serializer = UserSerializer(data=request.data)
        data: Dict[str, str | Dict] = {}
        if serializer.is_valid():
            user: User
            token: Token
            user, token = serializer.save()  # Save the user to the database
            update_last_login(None, user)
            userSerializer: UserSerializer = UserSerializer(
                user, context={"request": request}
            )
            data["user"] = userSerializer.data
            data["token"] = token.key
            data["message"] = "User registered successfully"
            return Response(data, status=status.HTTP_201_CREATED)
        else:
            data = serializer.errors
            return Response(data, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def login_view(request: Request) -> Response:
    if request.method == "POST":
        username: str | None = request.data.get("username")
        password: str | None = request.data.get("password")
        user = authenticate(request, username=username, password=password)
        data: Dict[str, str | Dict] = {}
        if user is not None:
            update_last_login(None, user)
            userSerializer: UserSerializer = UserSerializer(
                user, context={"request": request}
            )
            data["user"] = userSerializer.data
            # Generate token for the user
            token, created = Token.objects.get_or_create(user=user)
            data["token"] = token.key
            data["message"] = "Login successful"
            return Response(data, status=status.HTTP_200_OK)
        else:
            data["message"] = "Invalid username or password"
            return Response(data, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request: Request) -> Response:
    logout(request)
    data: Dict[str, str] = {}
    data["message"] = "Logged out successfully"
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])  # Ensure the user is authenticated
def auth_status(request: Request) -> Response:
    # If the user is authenticated, return their information
    data: Dict[str, str | Dict] = {}
    user: User = request.user
    update_last_login(None, user)
    userSerializer: UserSerializer = UserSerializer(user, context={"request": request})
    data["user"] = userSerializer.data
    token: Token = Token.objects.get(user=user)
    data["token"] = token.key
    data["message"] = "User is authenticated"
    return Response(data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])  # Ensure the user is authenticated
def document(request: Request) -> Response:
    """
    Create a document for the signed in specific user.

    Expects a JSON payload with 'name' and optional 'description' fields.
    Returns the created document data on success.
    """
    # Initialize data dictionary for response
    data: Dict[str, Any] = {}

    # Retrieve the document data from the request data.
    name = request.data.get("name")
    description = request.data.get("description")
    if not name:
        # Return a 400 error if no content is provided.
        data["message"] = "A name for the document is required."
        return Response(data, status=status.HTTP_400_BAD_REQUEST)

    # Initialize the DocSerializer with the provided data.
    serializer = DocSerializer(
        data={"name": name, "description": description, "author": request.user.id},
        context={"request": request},
    )

    # Validate the data provided to the serializer.
    if serializer.is_valid():
        with transaction.atomic():  # Ensure atomic transaction
            # Save the new document; set the author to the authenticated user and associate the comment with the post.
            serializer.save(author=request.user)
            data["document"] = serializer.data
            data["message"] = "Document and root content node created successfully."
            return Response(data, status=status.HTTP_201_CREATED)
    else:
        # Return serializer errors if validation fails.
        data = serializer.errors
        return Response(data, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_documents(request: Request) -> Response:
    """Get all documents for the authenticated user"""
    documents = Doc.objects.filter(author=request.user)
    serializer = DocSerializer(documents, many=True)
    return Response({"documents": serializer.data})


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def document_detail(request: Request, doc_id: int) -> Response:
    """Update or delete a specific document"""

    # Initialize data dictionary for response
    data: Dict[str, Any] = {}

    document = get_object_or_404(Doc, id=doc_id, author=request.user)

    if request.method == "PATCH":
        serializer = DocSerializer(document, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        document.delete()
        data["message"] = "Document deleted successfully"
        return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def document_content_tree(request: Request, doc_id: int) -> Response:
    """Get all content nodes for a document as a tree"""
    document = get_object_or_404(Doc, id=doc_id, author=request.user)

    # Get the root content node and its descendants
    root_content = document.root_content_node
    content_tree = root_content.get_descendants(include_self=True)

    # Serialize the tree structure
    serializer = ContentTreeSerializer(content_tree, many=True)
    return Response(serializer.data)


@api_view(["POST", "GET"])
@permission_classes([IsAuthenticated])
def content_node(request: Request) -> Response:
    """Create a new content node or get all content nodes for user"""
    if request.method == "POST":
        serializer = ContentSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "GET":
        content_nodes = Content.objects.filter(author=request.user)
        serializer = ContentSerializer(content_nodes, many=True)
        return Response(serializer.data)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def content_node_detail(request: Request, content_id: int) -> Response:
    """Update or delete a specific content node"""
    content_node = get_object_or_404(Content, id=content_id, author=request.user)

    if request.method == "PUT":
        serializer = ContentSerializer(content_node, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        # This will delete the node and all its children due to on_delete=CASCADE
        content_node.delete()
        return Response(
            {"message": "Content node deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def content_batch_update(request: Request) -> Response:
    """Batch update content nodes (for reordering trees)"""
    updates = request.data.get("updates", [])

    try:
        with transaction.atomic():
            for update in updates:
                content_id = update.get("id")
                content_node = get_object_or_404(
                    Content, id=content_id, author=request.user
                )

                # Update allowed fields
                for field in ["name", "file", "parent", "order", "level"]:
                    if field in update:
                        setattr(content_node, field, update[field])

                content_node.save()

            return Response({"message": "Batch update successful"})

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_resources(request):
    """Get all active resources"""
    resources = Resource.objects.filter(is_active=True).order_by("type", "name")
    serializer = ResourceSerializer(resources, many=True, context={"request": request})
    return Response(serializer.data)
