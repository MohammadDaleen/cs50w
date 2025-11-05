import uuid
from email import message_from_bytes
from typing import Any, Dict

from django.contrib.auth import authenticate, get_user_model, logout
from django.contrib.auth.models import update_last_login
from django.db import transaction
from django.http import HttpRequest, HttpResponse

# Create your views here.
from django.shortcuts import get_object_or_404
from django.urls import resolve
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Attachment, AttachmentType, Content, Doc, Resource, User
from .serializers import (
    AttachmentSerializer,
    ContentSerializer,
    ContentTreeSerializer,
    DocSerializer,
    RegisterSerializer,
    ResourceSerializer,
    UserSerializer,
)


@api_view(["POST"])
def register(request: Request) -> Response:
    if request.method == "POST":
        serializer = RegisterSerializer(data=request.data)
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
def document_detail(request: Request, doc_id: uuid.UUID) -> Response:
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
def document_content_tree(request: Request, doc_id: uuid.UUID) -> Response:
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


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def content_node_detail(request: Request, content_id: uuid.UUID) -> Response:
    """Update or delete a specific content node"""
    content_node = get_object_or_404(Content, id=content_id, author=request.user)

    if request.method == "PATCH":
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_resources(request):
    """Get all active resources"""
    resources = Resource.objects.filter(is_active=True).order_by("order", "name")
    serializer = ResourceSerializer(resources, many=True, context={"request": request})
    return Response(serializer.data)


# Helper function to parse a raw HTTP request from a string
def _parse_http_request(request_str: str) -> tuple[str, str, dict, bytes]:
    """Parses a raw HTTP request string into method, path, headers, and body."""
    lines = request_str.split("\r\n")
    request_line = lines[0]
    method, path, _ = request_line.split(" ", 2)

    headers = {}
    body_start_index = 1
    for i, line in enumerate(lines[1:], 1):
        if not line:
            body_start_index = i + 1
            break
        key, value = line.split(": ", 1)
        headers[key] = value

    body = "\r\n".join(lines[body_start_index:]).encode("utf-8")
    return method, path, headers, body


# Helper function to format an HTTP response
def _format_http_response(response: Response) -> str:
    """Formats a DRF Response object into a raw HTTP response string."""

    # FIX: Manually set renderer if it's not already set
    if not getattr(response, "accepted_renderer", None):
        response.accepted_renderer = JSONRenderer()
        response.accepted_media_type = "application/json"
        response.renderer_context = {}

    # Render the response to get status code, headers, and body
    response.render()

    status_line = f"HTTP/1.1 {response.status_code} {response.reason_phrase}"

    headers = "\r\n".join([f"{key}: {value}" for key, value in response.items()])

    body = response.content.decode("utf-8") if response.content else ""

    return f"{status_line}\r\n{headers}\r\n\r\n{body}"


# Main Batch View
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def batch(request: Request) -> HttpResponse:
    """
    Processes a batch request containing multiple API calls.
    Parses a multipart/mixed request, handles each part as a sub-request,
    and returns a multipart/mixed response.
    """
    content_type = request.content_type
    params = request.content_params

    if not content_type.startswith("multipart/mixed") or "boundary" not in params:
        return HttpResponse(
            "Invalid Content-Type. Expected 'multipart/mixed' with a boundary.",
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Add headers to the raw body to make it a valid MIME message
    raw_body = request.body
    # Reconstruct the full Content-Type header string
    full_content_type_header = (
        f"Content-Type: {content_type}; boundary={params['boundary']}"
    )
    headers = f"{full_content_type_header}\r\n\r\n".encode("utf-8")
    full_message_body = headers + raw_body

    # Parse the multipart message
    msg = message_from_bytes(full_message_body)

    responses = []
    # Use uuid to generate random, unique boundaries
    response_boundary = f"batchresponse_{uuid.uuid4().hex}"

    for part in msg.get_payload():
        if part.get_content_type() == "multipart/mixed":  # It's a changeset
            changeset_responses = []
            changeset_boundary = f"changesetresponse_{uuid.uuid4().hex}"
            try:
                with transaction.atomic():
                    for sub_part in part.get_payload():
                        if sub_part.get_content_type() == "application/http":
                            content_id = sub_part.get("Content-ID", "")
                            http_request_str = sub_part.get_payload(decode=True).decode(
                                "utf-8"
                            )

                            # Process the sub-request
                            method, path, headers, body = _parse_http_request(
                                http_request_str
                            )

                            # Resolve the URL to the corresponding view
                            resolver_match = resolve(path)
                            view_func = resolver_match.func

                            # Create a new HttpRequest for the sub-request
                            sub_request = HttpRequest()
                            sub_request.method = method
                            sub_request.path = path
                            sub_request.user = request.user  # Crucial for permissions
                            sub_request.META.update(request.META)
                            sub_request.META["HTTP_CONTENT_TYPE"] = headers.get(
                                "Content-Type", "application/json"
                            )
                            sub_request._body = body

                            # The target view expects a raw HttpRequest, so we pass sub_request directly.
                            # The @api_view decorator on the target view will handle the wrapping.
                            view_response = view_func(
                                sub_request,
                                *resolver_match.args,
                                **resolver_match.kwargs,
                            )

                            # Format response
                            response_part = f"--{changeset_boundary}\r\n"
                            response_part += "Content-Type: application/http\r\n"
                            response_part += "Content-Transfer-Encoding: binary\r\n"
                            if content_id:
                                response_part += f"Content-ID: {content_id}\r\n"
                            response_part += "\r\n"
                            response_part += _format_http_response(view_response)
                            changeset_responses.append(response_part)

            except Exception as e:
                # If any request in the transaction fails, the whole changeset fails
                error_response = Response(
                    {"error": "Changeset failed", "detail": str(e)},
                    status=status.HTTP_400_BAD_REQUEST,
                )

                # Create a single failure response for the entire changeset
                response_part = f"--{response_boundary}\r\n"
                response_part += f"Content-Type: multipart/mixed; boundary={changeset_boundary}\r\n\r\n"
                response_part += f"--{changeset_boundary}\r\n"
                response_part += "Content-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\n"
                response_part += _format_http_response(error_response)
                response_part += f"\r\n--{changeset_boundary}--\r\n"
                responses.append(response_part)
                continue  # Move to the next part in the main request

            # If changeset succeeded
            response_part = f"--{response_boundary}\r\n"
            response_part += (
                f"Content-Type: multipart/mixed; boundary={changeset_boundary}\r\n\r\n"
            )
            response_part += "".join(changeset_responses)
            response_part += f"\r\n--{changeset_boundary}--\r\n"
            responses.append(response_part)

        elif part.get_content_type() == "application/http":  # Standalone request
            # This logic is very similar to the one inside the changeset loop
            # For brevity, this part can be refactored into a helper function
            content_id = part.get("Content-ID", "")
            http_request_str = part.get_payload(decode=True).decode("utf-8")
            method, path, headers, body = _parse_http_request(http_request_str)
            resolver_match = resolve(path)
            view_func = resolver_match.func
            sub_request = HttpRequest()
            sub_request.method = method
            sub_request.path = path
            sub_request.user = request.user
            sub_request.META.update(request.META)
            sub_request.META["HTTP_CONTENT_TYPE"] = headers.get(
                "Content-Type", "application/json"
            )
            sub_request._body = body
            # Pass the raw HttpRequest here as well.
            view_response = view_func(
                sub_request, *resolver_match.args, **resolver_match.kwargs
            )

            response_part = f"--{response_boundary}\r\n"
            response_part += "Content-Type: application/http\r\n"
            response_part += "Content-Transfer-Encoding: binary\r\n"
            if content_id:
                response_part += f"Content-ID: {content_id}\r\n"
            response_part += "\r\n"
            response_part += _format_http_response(view_response)
            responses.append(response_part)

    final_response_body = "".join(responses) + f"\r\n--{response_boundary}--\r\n"

    return HttpResponse(
        final_response_body,
        status=status.HTTP_200_OK,
        content_type=f"multipart/mixed; boundary={response_boundary}",
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def content_file(request: Request, content_id: uuid.UUID) -> Response:
    """
    Retrieves the aggregated file content for a given content node.
    Accepts an 'include_children' query parameter (true/false).
    """
    # Fetch the content node, ensuring the user is the author
    content_node = get_object_or_404(Content, id=content_id, author=request.user)

    # Check for the 'include_children' query parameter
    include_children_param = request.query_params.get(
        "include_children", "false"
    ).lower()
    include_children = include_children_param == "true"

    # Use the model method to get the aggregated content
    aggregated_content = content_node.get_aggregated_content(
        include_children=include_children
    )

    return Response({"content": aggregated_content})


def get_attachment_type(mime_type):
    """Determines the attachment type from the file's MIME type."""
    if mime_type.startswith("image/"):
        return AttachmentType.IMAGE
    if mime_type.startswith("video/"):
        return AttachmentType.VIDEO
    if mime_type.startswith("audio/"):
        return AttachmentType.AUDIO
    # Add other specific types as needed
    return AttachmentType.OTHER


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def content_attachments(request: Request, content_id: uuid.UUID) -> Response:
    """
    GET: List all attachments for a content node.
    POST: Upload a new attachment for a content node.
    """
    content_node = get_object_or_404(Content, id=content_id, author=request.user)

    if request.method == "GET":
        attachments = Attachment.objects.filter(content=content_node)
        serializer = AttachmentSerializer(
            attachments, many=True, context={"request": request}
        )
        return Response(serializer.data)

    elif request.method == "POST":
        if "file" not in request.FILES:
            return Response(
                {"detail": "No file was attached."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Manually construct a dictionary for the serializer.
        # This avoids the deepcopy error on the file object.
        file_obj = request.FILES["file"]
        serializer_data = {
            "name": request.data.get(
                "name", file_obj.name
            ),  # Use provided name or default to filename
            "file": file_obj,
            "type": get_attachment_type(file_obj.content_type),
        }

        serializer = AttachmentSerializer(
            data=serializer_data, context={"request": request}
        )

        if serializer.is_valid():
            # Pass the content_node directly to the save method for association.
            serializer.save(content=content_node)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def attachment_detail(request: Request, attachment_id: uuid.UUID) -> Response:
    """
    DELETE: Deletes a specific attachment and returns its ID.
    """
    attachment = get_object_or_404(
        Attachment, id=attachment_id, content__author=request.user
    )

    # Store the ID before deleting the object
    deleted_attachment_id = str(attachment.id)

    attachment.delete()

    # Return a 200 OK response with the ID of the deleted object
    return Response({"id": deleted_attachment_id}, status=status.HTTP_200_OK)


# TODO: remove unused parts of code
# TODO: build a custom dark mode skin for Tinymce editor
# TODO: grid/list docs view toggle
# TODO: order docs by options