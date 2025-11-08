import json
import uuid
from email import message_from_bytes
from typing import Any, Dict

from django.contrib.auth import authenticate, get_user_model, logout
from django.contrib.auth.models import update_last_login
from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.test import RequestFactory
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

rf = (
    RequestFactory()
)  # RequestFactory used to build internal sub-requests for batch processing


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
    Batch handler that accepts a multipart/mixed request body containing one or more
    sub-requests. Sub-requests may be grouped into transactional "changeset" parts
    (multipart/mixed inside the batch). Each sub-request is executed in-process by
    constructing a WSGIRequest via Django's RequestFactory and invoking the resolved
    view callable directly.

    Important compatibility notes for the frontend:
    - Do NOT copy the outer batch request's CONTENT_TYPE/CONTENT_LENGTH into sub-requests.
      Doing so would make the sub-request appear to be 'multipart/mixed' (the batch),
      which most endpoint handlers will reject (HTTP 415). Instead, each sub-request's
      CONTENT_TYPE must match what that sub-request's headers specify.
    - Forward only the safe META/HTTP headers to the sub-request (e.g. HTTP_AUTHORIZATION,
      other HTTP_* headers). Do not blindly copy all request.META keys.
    - Authentication is preserved by assigning sub_request.user = request.user.
    """

    import json
    import uuid
    from email import message_from_bytes

    from django.http import HttpResponse
    from django.test import RequestFactory
    from django.urls import resolve

    # Use an existing module-level RequestFactory if present, otherwise create one.
    rf = globals().get("rf") or RequestFactory()

    # Validate content-type: we expect multipart/mixed with a boundary parameter.
    content_type = request.content_type or ""
    params = getattr(request, "content_params", {}) or {}
    if not content_type.startswith("multipart/mixed") or "boundary" not in params:
        return HttpResponse(
            "Invalid Content-Type. Expected 'multipart/mixed' with a boundary.",
            status=400,
        )

    # Build a bytes buffer that contains the Content-Type header + raw body so the
    # email parser can correctly interpret boundaries and parts.
    # (We avoid relying on the parser to magically know the original headers.)
    boundary = params["boundary"]
    full_content_type_header = f"Content-Type: {content_type}; boundary={boundary}"
    raw_body = request.body or b""
    mime_bytes = full_content_type_header.encode("utf-8") + b"\r\n\r\n" + raw_body

    # Parse the MIME structure for the batch
    mime_msg = message_from_bytes(mime_bytes)

    # Build top-level response boundary that we will return to the frontend.
    response_boundary = f"batchresponse_{uuid.uuid4().hex}"
    response_parts: list[str] = []

    # Helper to copy safe META keys from the outer request to a sub-request.
    # We forward HTTP_* headers and a small set of WSGI/server keys if present.
    def forward_request_meta(src_meta: dict) -> dict:
        allowed = {}
        for k, v in src_meta.items():
            # Forward only HTTP_* headers (these include Authorization as HTTP_AUTHORIZATION)
            if k.startswith("HTTP_"):
                allowed[k] = v
        # Optionally forward client/server info that might be useful to views
        for k in (
            "REMOTE_ADDR",
            "SERVER_NAME",
            "SERVER_PORT",
            "wsgi.url_scheme",
            "SERVER_PROTOCOL",
        ):
            if k in src_meta:
                allowed[k] = src_meta[k]
        return allowed

    # Iterate over leaf parts in the parsed MIME message
    for part in mime_msg.walk():
        # Skip multipart container nodes; we handle content parts only
        if part.get_content_maintype() == "multipart":
            continue

        # --- CHANGESSET (transactional group) ---
        if part.get_content_type() == "multipart/mixed":
            changeset_boundary = part.get_boundary() or f"changeset_{uuid.uuid4().hex}"
            changeset_responses: list[str] = []
            changeset_failed = False
            changeset_failure_detail = None

            # The changeset payload is a list of application/http parts
            for subpart in part.get_payload():
                if subpart.get_content_type() != "application/http":
                    # Skip unknown parts (robustness)
                    continue

                # Parse the raw HTTP text of the sub-request into its components.
                http_request_str = subpart.get_payload(decode=True).decode("utf-8")
                method, path, headers, body = _parse_http_request(http_request_str)

                # Resolve the path to a view callable and its args/kwargs
                resolver_match = resolve(path)
                view_func = resolver_match.func

                # Determine the sub-request content-type from the sub-request headers
                sub_content_type = headers.get("Content-Type", "application/json")
                # Decide whether to pass text (for JSON) or raw bytes (for multipart/form-data, files)
                data_arg = body
                if (
                    isinstance(body, (bytes, bytearray))
                    and "application/json" in sub_content_type
                ):
                    try:
                        data_arg = body.decode("utf-8")
                    except Exception:
                        # Fall back to bytes if decode fails
                        data_arg = body

                # Construct the WSGIRequest for the sub-request using RequestFactory.
                # Do NOT blindly copy outer request CONTENT_TYPE/CONTENT_LENGTH.
                sub_request = rf.generic(
                    method, path, data=data_arg, content_type=sub_content_type
                )

                # Preserve authentication and forward safe headers only
                sub_request.user = getattr(request, "user", None)
                forwarded_meta = forward_request_meta(getattr(request, "META", {}))
                # apply forwarded HTTP_* and server entries
                sub_request.META.update(forwarded_meta)

                # Explicitly set CONTENT_TYPE and CONTENT_LENGTH based on the sub-request's headers/body.
                # This prevents the sub-request from inheriting the *batch* content-type.
                if sub_content_type:
                    sub_request.META["CONTENT_TYPE"] = sub_content_type
                try:
                    sub_request.META["CONTENT_LENGTH"] = str(
                        len(body) if body is not None else 0
                    )
                except Exception:
                    # If length calculation fails, do not set CONTENT_LENGTH
                    pass

                # Execute the resolved view and capture/format the response.
                try:
                    view_response = view_func(
                        sub_request, *resolver_match.args, **resolver_match.kwargs
                    )
                except Exception as exc:
                    # Any exception inside a changeset causes the whole changeset to fail.
                    changeset_failed = True
                    changeset_failure_detail = (
                        f"Exception executing sub-request {method} {path}: {exc}"
                    )
                    break

                # Format the sub-response into a raw HTTP string suitable for embedding.
                try:
                    formatted = _format_http_response(view_response)
                except Exception as exc:
                    changeset_failed = True
                    changeset_failure_detail = (
                        f"Failed formatting sub-response for {method} {path}: {exc}"
                    )
                    break

                # If a sub-response indicates a client/server error, consider the changeset failed.
                status_code = getattr(view_response, "status_code", 200)
                if status_code >= 400:
                    changeset_failed = True
                    # try to get a helpful body text
                    try:
                        body_text = (
                            view_response.content.decode("utf-8")
                            if hasattr(view_response, "content")
                            else str(view_response)
                        )
                    except Exception:
                        body_text = repr(view_response)
                    changeset_failure_detail = (
                        f"Sub-request returned status {status_code}: {body_text}"
                    )
                    break

                changeset_responses.append(formatted)

            # Build response for this changeset part
            if changeset_failed:
                # Create a single JSON failure response inside the changeset
                err_obj = {
                    "error": "Changeset failed",
                    "detail": changeset_failure_detail,
                }
                fail_resp = HttpResponse(
                    json.dumps(err_obj), content_type="application/json", status=400
                )
                response_block = f"--{response_boundary}\r\n"
                response_block += f"Content-Type: multipart/mixed; boundary={changeset_boundary}\r\n\r\n"
                response_block += _format_http_response(fail_resp)
                response_block += f"\r\n--{changeset_boundary}--\r\n"
                response_parts.append(response_block)
            else:
                # All sub-requests in the changeset succeeded; include all formatted sub-responses.
                response_block = f"--{response_boundary}\r\n"
                response_block += f"Content-Type: multipart/mixed; boundary={changeset_boundary}\r\n\r\n"
                response_block += "".join(changeset_responses)
                response_block += f"\r\n--{changeset_boundary}--\r\n"
                response_parts.append(response_block)

        # --- STANDALONE application/http part ---
        elif part.get_content_type() == "application/http":
            content_id = part.get("Content-ID", "")
            http_request_str = part.get_payload(decode=True).decode("utf-8")
            method, path, headers, body = _parse_http_request(http_request_str)

            resolver_match = resolve(path)
            view_func = resolver_match.func

            # Determine sub-request content-type and data
            sub_content_type = headers.get("Content-Type", "application/json")
            data_arg = body
            if (
                isinstance(body, (bytes, bytearray))
                and "application/json" in sub_content_type
            ):
                try:
                    data_arg = body.decode("utf-8")
                except Exception:
                    data_arg = body

            # Construct sub-request using RequestFactory and forward safe headers only
            sub_request = rf.generic(
                method, path, data=data_arg, content_type=sub_content_type
            )
            sub_request.user = getattr(request, "user", None)
            forwarded_meta = forward_request_meta(getattr(request, "META", {}))
            sub_request.META.update(forwarded_meta)
            if sub_content_type:
                sub_request.META["CONTENT_TYPE"] = sub_content_type
            try:
                sub_request.META["CONTENT_LENGTH"] = str(
                    len(body) if body is not None else 0
                )
            except Exception:
                pass

            # Execute the view. Convert exceptions into a 500-like response for the batch part.
            try:
                view_response = view_func(
                    sub_request, *resolver_match.args, **resolver_match.kwargs
                )
            except Exception as exc:
                err_body = {"error": "Sub-request exception", "detail": str(exc)}
                view_response = HttpResponse(
                    json.dumps(err_body), content_type="application/json", status=500
                )

            # Format and append the single application/http response block
            formatted = _format_http_response(view_response)
            response_block = f"--{response_boundary}\r\n"
            response_block += "Content-Type: application/http\r\n"
            response_block += "Content-Transfer-Encoding: binary\r\n"
            if content_id:
                response_block += f"Content-ID: {content_id}\r\n"
            response_block += "\r\n"
            response_block += formatted
            response_parts.append(response_block)

        else:
            # Unknown part type: ignore it (or optionally return a 4xx error).
            continue

    # Finalize the multipart/mixed batch response body and return it
    final_body = "".join(response_parts) + f"\r\n--{response_boundary}--\r\n"
    return HttpResponse(
        final_body, content_type=f"multipart/mixed; boundary={response_boundary}"
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


# TODO: build a custom dark mode skin for Tinymce editor
# TODO: grid/list docs view toggle
# TODO: order docs by options
# TODO: order docs by options
