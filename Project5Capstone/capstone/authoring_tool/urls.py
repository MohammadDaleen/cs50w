from django.urls import path

from . import views

urlpatterns = [
    # Auth URLs
    path("api/auth-status", views.auth_status, name="api_auth_status"),
    path("api/register", views.register, name="api_register"),
    path("api/login", views.login_view, name="api_login"),
    path("api/logout", views.logout_view, name="api_logout"),
    # Docs URLs
    path("api/document", views.document, name="api_document"),
    path("api/documents", views.user_documents, name="api_user_documents"),
    path(
        "api/document/<int:doc_id>", views.document_detail, name="api_document_detail"
    ),
    path(
        "api/document/<int:doc_id>/content",
        views.document_content_tree,
        name="api_document_content_tree",
    ),
    # Content URLs
    path("api/content", views.content_node, name="api_content"),
    path(
        "api/content/<int:content_id>",
        views.content_node_detail,
        name="api_content_detail",
    ),
    path("api/content/batch", views.content_batch_update, name="api_content_batch"),
    # Resouces URLs
    path("api/resources", views.get_resources, name="api_resources"),
]
