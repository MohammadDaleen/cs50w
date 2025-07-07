import json
from datetime import timedelta
from io import BytesIO
from typing import Any, Dict, List

from django.contrib.auth import authenticate, get_user_model, logout
from django.contrib.auth.models import update_last_login
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db.models import Count, Q, QuerySet
from django.utils import timezone
from PIL import Image

# from django.contrib.auth.models import AbstractUser
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Comment, Follower, Like, Post, User
from .serializers import (
    CommentSerializer,
    PostSerializer,
    RegisterSerializer,
    UserSerializer,
)

# Define a type alias for user model instance.
# UserType = get_user_model()  # Type checkers may treat this as the Django user model type


@api_view(["POST"])
def register(request: Request) -> Response:
    if request.method == "POST":
        serializer: RegisterSerializer = RegisterSerializer(data=request.data)
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
def post(request: Request) -> Response:
    data: Dict[str, Any] = {}
    # Determine if the request is multipart/form-data
    if request.content_type.startswith("multipart/form-data"):
        postContent: object = request.POST.get("post")
        image = request.FILES.get("image")
    else:
        # Extract data from the request body
        body: Dict[str, object] = json.loads(request.body)
        # Get the 'post' content from the JSON data
        postContent: object = body.get("post")
        image = None

    # Ensure 'postContent' is a string
    if type(postContent) is not str:
        data["message"] = "Post's type is not string"
        return Response(data, status=status.HTTP_400_BAD_REQUEST)

    # Remove leading and trailing whitespace from 'postContent'
    postContent = postContent.strip()
    # Ensure 'postContent' is not empty after stripping whitespace
    if not postContent:
        data["message"] = "The post is empty."
        return Response(data, status=status.HTTP_400_BAD_REQUEST)

    # If an image is attached, compress it using Pillow
    if image:
        try:
            # Open the uploaded image using Pillow
            im = Image.open(image)
            # Convert the image to RGB format.
            # This is necessary because JPEG format doesn't support transparency.
            im = im.convert("RGB")
            # Create a BytesIO object to hold the compressed image data in memory
            output = BytesIO()
            # Save the image to the BytesIO object as a JPEG.
            # The quality parameter (70) can be adjusted to balance image quality and file size.
            im.save(output, format="JPEG", quality=70)  # Adjust quality as needed
            # Reset the pointer of the BytesIO object to the beginning,
            # so that when the file is read, it starts from the beginning.
            output.seek(0)
            # Create a new InMemoryUploadedFile using the compressed image data.
            # This will be saved to the Post model.
            image = InMemoryUploadedFile(
                output,  # File object containing the image data
                "ImageField",  # Field name (as specified in the model)
                f"{image.name.split('.')[0]}.jpg",  # New filename with a .jpg extension
                "image/jpeg",  # MIME type for JPEG images
                output.tell(),  # Size of the file in bytes
                None,  # Charset (not applicable for binary files)
            )
        except Exception as e:
            data["message"] = "Error processing image: " + str(e)
            return Response(data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Create a Post object with 'postContent' and the current user as the poster
    post: Post = Post(content=postContent, poster=request.user, image=image)
    # Save Post object in database (Post(s) table)
    post.save()
    serializer: PostSerializer = PostSerializer(post, context={"request": request})
    # Adding the content of serializer.data: ReturnDict to data: dict
    data["post"] = serializer.data
    data["message"] = "Post published successfully"
    return Response(data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_post(request, post_id: int):
    """
    Fetch a single post by its ID.
    """
    data: Dict[str, str | Dict] = {}
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        data["message"] = "Post not found."
        return Response(data, status=status.HTTP_404_NOT_FOUND)

    serializer = PostSerializer(post, context={"request": request})
    data["post"] = serializer.data
    data["message"] = "Post fetched successfully."
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
def posts(request: Request) -> Response:
    """
    - Return a paginated list of posts.
    - If a 'username' query parameter is provided, filter posts by that user.
    """
    data: Dict[str, str | List | Dict] = {}
    username = request.query_params.get("username", None)
    # If username is in the query params, filter by that username
    if username is not None:
        try:
            user: User = get_user_model().objects.get(username=username)
        except get_user_model().DoesNotExist:
            data["message"] = f"{username} is not a valid username"
            return Response(data, status=status.HTTP_400_BAD_REQUEST)
        posts_qs: QuerySet[Post] = (
            Post.objects.filter(poster=user).order_by("-timestamp").all()
        )
        data["message"] = f"{user.username}'s posts found successfully"
    else:
        posts_qs: QuerySet[Post] = Post.objects.all().order_by("-timestamp").all()
        data["message"] = "The posts found successfully"
    paginator: PageNumberPagination = PageNumberPagination()
    paginator.page_size = 10
    result_page: List[Post] = paginator.paginate_queryset(posts_qs, request)
    serializer: PostSerializer = PostSerializer(
        result_page, many=True, context={"request": request}
    )
    data["posts"] = serializer.data
    # Return the paginated response including next/previous links and count
    return paginator.get_paginated_response(data)


@api_view(["GET"])
def user(request: Request, username: str) -> Response:
    data: Dict[str, str | Dict] = {}
    try:
        user: User = get_user_model().objects.get(username=username)
    except get_user_model().DoesNotExist:
        user = None
    if user is None:
        data["message"] = f"{username} is not a valid username"
        return Response(data, status=status.HTTP_400_BAD_REQUEST)
    userSerializer: UserSerializer = UserSerializer(user, context={"request": request})
    data["user"] = userSerializer.data
    data["message"] = f"{user.username}'s data found successfully"
    return Response(data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])  # Ensure the user is authenticated
def follow(request: Request) -> Response:
    """
    Toggle follow/unfollow for the authenticated user on another user's profile.
    Expected payload: { "username": target_username }
    """
    data: Dict[str, str | Dict] = {}
    followee_username = request.data.get("username")
    # Check that a username was provided
    if not followee_username:
        data["message"] = "Missing 'username' in request data."
        return Response(data, status=status.HTTP_400_BAD_REQUEST)
    # Make sure a user does not attempt to follow themselves
    if followee_username == request.user.username:
        data["message"] = "You cannot follow yourself."
        return Response(data, status=status.HTTP_400_BAD_REQUEST)
    # Attempt to retrieve the user to be followed
    try:
        followee: User = get_user_model().objects.get(username=followee_username)
    except get_user_model().DoesNotExist:
        data["message"] = f"User '{followee_username}' does not exist."
        return Response(data, status=status.HTTP_404_NOT_FOUND)
    # Check if a Follower relationship already exists
    existing_relationship = Follower.objects.filter(
        follower=request.user, followee=followee
    ).first()
    if existing_relationship:
        # If it exists, this means we should "unfollow" (toggle off)
        existing_relationship.delete()
        data["message"] = f"You have unfollowed '{followee_username}'."
        data["followee"] = {"username": followee_username, "isFollowee": False}
        return Response(data, status=status.HTTP_200_OK)
    else:
        # Otherwise, create a new follow record
        Follower.objects.create(follower=request.user, followee=followee)
        data["message"] = f"You are now following '{followee_username}'."
        data["followee"] = {"username": followee_username, "isFollowee": True}
        return Response(data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def following_posts(
    request: Request,
) -> Response:  # def following_posts(request: Request):
    """
    Return paginated posts from users that the current user follows,
    sorted by descending timestamp.
    """
    data: Dict[str, str | List | Dict] = {}
    # current user
    user: User = request.user
    # get all the "followee" relationships for this user (the user is the 'follower')
    # Return just the followee field as a simple list of user IDs
    followees_qs: QuerySet[int] = Follower.objects.filter(follower=user).values_list(
        "followee", flat=True
    )
    # now filter posts by these followees
    posts: QuerySet[Post] = Post.objects.filter(poster__in=followees_qs).order_by(
        "-timestamp"
    )
    paginator: PageNumberPagination = PageNumberPagination()
    paginator.page_size = 10  # Adjust the page size as needed
    result_page: List[Post] = paginator.paginate_queryset(posts, request)
    # serialize the posts
    serializer: PostSerializer = PostSerializer(
        result_page, many=True, context={"request": request}
    )
    data["posts"] = serializer.data
    data["message"] = "Following posts fetched successfully."
    # Return the paginated response including next/previous links and count
    return paginator.get_paginated_response(data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_post(request: Request, post_id: int) -> Response:
    """
    Delete a post if the authenticated user is the owner.
    Returns a message.
    """
    data: Dict[str, Any] = {}
    try:
        post: Post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        data["message"] = "Post not found."
        return Response(data, status=status.HTTP_404_NOT_FOUND)

    # Ensure that the user is the owner of the post.
    if post.poster != request.user:
        data["message"] = "You are not allowed to delete this post."
        return Response(data, status=status.HTTP_403_FORBIDDEN)

    post.delete()
    data["message"] = "Post deleted successfully."
    return Response(data, status=status.HTTP_200_OK)


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def edit_post(request: Request, post_id: int) -> Response:
    data: Dict[str, str | Dict] = {}
    try:
        post: Post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        data["message"] = "Post not found."
        return Response(data, status=status.HTTP_404_NOT_FOUND)
    # Ensure the logged-in user is the owner of the post
    if post.poster != request.user:
        data["message"] = "You are not allowed to edit this post."
        return Response(data, status=status.HTTP_403_FORBIDDEN)
    # Get and validate the new content for the post
    new_content = request.data.get("content", "").strip()
    if not new_content:
        data["message"] = "Post content cannot be empty."
        return Response(data, status=status.HTTP_400_BAD_REQUEST)
    # Update and save the post
    post.content = new_content
    post.save()
    serializer = PostSerializer(post, context={"request": request})
    data["post"] = serializer.data
    data["message"] = "Post updated successfully."
    return Response(data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_like(request: Request, post_id: int) -> Response:
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response(
            {"message": "Post not found."}, status=status.HTTP_404_NOT_FOUND
        )

    # Check if the authenticated user already liked the post
    like = post.postLikes.filter(liker=request.user).first()
    if like:
        like.delete()
        message = "Post unliked."
    else:
        Like.objects.create(likedPost=post, liker=request.user)
        message = "Post liked."

    serializer = PostSerializer(post, context={"request": request})
    return Response(
        {"message": message, "post": serializer.data}, status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def comment(request: Request, post_id: int) -> Response:
    """
    Post a comment to a specific post.

    Expects a JSON payload with a 'content' field.
    Returns the created comment data on success.
    """
    # Initialize data dictionary for response
    data: Dict[str, Any] = {}

    # Attempt to retrieve the post by its ID; return 404 if not found.
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        data["message"] = "Post not found."
        return Response(data, status=status.HTTP_404_NOT_FOUND)

    # Retrieve the comment content from the request data and strip extra whitespace.
    content = request.data.get("content", "").strip()
    if not content:
        # Return a 400 error if no content is provided.
        data["message"] = "Comment cannot be empty."
        return Response(data, status=status.HTTP_400_BAD_REQUEST)

    # Initialize the CommentSerializer with the provided content.
    serializer = CommentSerializer(
        data={"content": content}, context={"request": request}
    )

    # Validate the data provided to the serializer.
    if serializer.is_valid():
        # Save the new comment; set the commenter to the authenticated user and associate the comment with the post.
        serializer.save(commenter=request.user, post=post)
        data["comment"] = serializer.data
        data["message"] = "Comment posted successfully."
        return Response(data, status=status.HTTP_201_CREATED)
    else:
        # Return serializer errors if validation fails.
        data = serializer.errors
        return Response(data, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def comments(request: Request, post_id: int) -> Response:
    """
    Retrieve all comments for a specific post.

    Returns a list of comments ordered by their timestamp.
    """
    # Initialize data dictionary for response
    data: Dict[str, Any] = {}

    # Attempt to retrieve the post by its ID; return 404 if the post does not exist.
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        data["message"] = "Post not found."
        return Response(data, status=status.HTTP_404_NOT_FOUND)

    # Retrieve all comments related to the post, ordering them by timestamp (oldest first).
    comments_qs = post.comments.all().order_by("-timestamp")
    # Serialize the comments queryset.
    serializer = CommentSerializer(comments_qs, many=True, context={"request": request})
    # Return the serialized data with a success message.
    data["comments"] = serializer.data
    data["message"] = "Comments fetched successfully."
    return Response(data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request: Request) -> Response:
    """
    Upload or change the profile picture for the authenticated user.
    Expects multipart/form-data with a 'profile_picture' file.
    Processes the image using Pillow.
    """
    data: Dict[str, Any] = {}
    user: User = request.user
    image = request.FILES.get("profilePicture")
    if not image:
        data["message"] = "No image provided."
        return Response(data, status=status.HTTP_400_BAD_REQUEST)

    # Compress the attached image using Pillow
    try:
        # Open the uploaded image using Pillow
        im = Image.open(image)
        # Convert the image to RGB format.
        # This is necessary because JPEG format doesn't support transparency.
        im = im.convert("RGB")
        # Create a BytesIO object to hold the compressed image data in memory
        output = BytesIO()
        # Save the image to the BytesIO object as a JPEG.
        # The quality parameter (70) can be adjusted to balance image quality and file size.
        im.save(output, format="JPEG", quality=70)  # Adjust quality as needed
        # Reset the pointer of the BytesIO object to the beginning,
        # so that when the file is read, it starts from the beginning.
        output.seek(0)
        # Create a new InMemoryUploadedFile using the compressed image data.
        # This will be saved to the Post model.
        processed_image = InMemoryUploadedFile(
            output,  # File object containing the image data
            "ImageField",  # Field name (as specified in the model)
            f"{image.name.split('.')[0]}.jpg",  # New filename with a .jpg extension
            "image/jpeg",  # MIME type for JPEG images
            output.tell(),  # Size of the file in bytes
            None,  # Charset (not applicable for binary files)
        )
    except Exception as e:
        data["message"] = "Error processing image: " + str(e)
        return Response(data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Delete the old profile picture if it exists.
    if user.profilePicture:
        user.profilePicture.delete(save=False)

    user.profilePicture = processed_image
    user.save()
    serializer = UserSerializer(user, context={"request": request})
    data["user"] = serializer.data
    data["message"] = "Profile picture updated successfully."
    return Response(data, status=status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_profile_picture(request: Request) -> Response:
    """
    Remove the profile picture for the authenticated user.
    Deletes the file from storage.
    """
    data: Dict[str, Any] = {}
    user: User = request.user
    if not user.profilePicture:
        data["message"] = "No profile picture to remove."
        return Response(data, status=status.HTTP_400_BAD_REQUEST)

    # Delete the file from storage.
    user.profilePicture.delete(save=False)
    user.profilePicture = None
    user.save()
    serializer = UserSerializer(user, context={"request": request})
    data["user"] = serializer.data
    data["message"] = "Profile picture removed successfully."
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
def followers_list(request: Request, username: str) -> Response:
    """
    - Fetch a paginated list of followers for the specified user.
    - Supports an optional search query (search) to filter followers by username.
    """
    data: Dict[str, Any] = {}
    try:
        user = get_user_model().objects.get(username=username)
    except get_user_model().DoesNotExist:
        data["message"] = f"User '{username}' not found."
        return Response(data, status=status.HTTP_404_NOT_FOUND)
    # Get all follower relationships where the given user is the followee.
    followers_qs = Follower.objects.filter(followee=user)
    search_query: str = request.query_params.get("search", "")
    if search_query:
        followers_qs = followers_qs.filter(follower__username__icontains=search_query)
    followers_qs = followers_qs.order_by("follower__username")
    paginator: PageNumberPagination = PageNumberPagination()
    paginator.page_size = 10
    result_page: List[Follower] = paginator.paginate_queryset(followers_qs, request)
    # Extract the follower user from each relationship.
    followers_list = [f.follower for f in result_page]
    serializer = UserSerializer(followers_list, many=True, context={"request": request})
    data["users"] = serializer.data
    data["message"] = "Followers fetched successfully."
    return paginator.get_paginated_response(data)


@api_view(["GET"])
def followees_list(request: Request, username: str) -> Response:
    """
    - Fetch a paginated list of followees (users that the given user is following).
    - Supports an optional search query (search) to filter followees by username.
    """
    data: Dict[str, Any] = {}
    try:
        user = get_user_model().objects.get(username=username)
    except get_user_model().DoesNotExist:
        data["message"] = f"User '{username}' not found."
        return Response(data, status=status.HTTP_404_NOT_FOUND)
    # Get all follower relationships where the given user is the follower.
    followees_qs = Follower.objects.filter(follower=user)
    search_query: str = request.query_params.get("search", "")
    if search_query:
        followees_qs = followees_qs.filter(followee__username__icontains=search_query)
    followees_qs = followees_qs.order_by("followee__username")
    paginator: PageNumberPagination = PageNumberPagination()
    paginator.page_size = 10
    result_page: List[Follower] = paginator.paginate_queryset(followees_qs, request)
    followees_list = [f.followee for f in result_page]
    serializer = UserSerializer(followees_list, many=True, context={"request": request})
    data["users"] = serializer.data
    data["message"] = "Followees fetched successfully."
    return paginator.get_paginated_response(data)
