# network/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.authtoken.models import Token

from .models import Comment, Follower, Post, User


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
    # Custom field to return a list of follower usernames
    userFollowers = serializers.SerializerMethodField()
    # Custom field to return a list of followee usernames
    userFollowees = serializers.SerializerMethodField()
    # Custom field to return the count of the user's posts
    postsCount = serializers.SerializerMethodField()
    # Custom field to return the profile picture of the user
    profilePicture = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = [
            "id",
            "username",
            "email",
            "userFollowers",
            "userFollowees",
            "postsCount",
            "profilePicture",
        ]

    def get_userFollowers(self, obj):
        # Get the usernames of all followers of this user
        followers = Follower.objects.filter(followee=obj)
        return [follower.follower.username for follower in followers]

    def get_userFollowees(self, obj):
        # Get the usernames of all followees of this user
        followees = Follower.objects.filter(follower=obj)
        return [followee.followee.username for followee in followees]

    def get_postsCount(self, obj):
        # Use the related name defined in the Post model (userPosts) to count posts
        return obj.userPosts.count()

    def get_profilePicture(self, obj: User) -> str | None:
        request = self.context.get("request")
        if obj.profilePicture and request:
            return request.build_absolute_uri(obj.profilePicture.url)
        return None


class PostSerializer(serializers.ModelSerializer):
    poster = UserSerializer()  # Nested UserSerializer for the poster field
    postLikes = serializers.IntegerField(
        source="postLikes.count", read_only=True
    )  # Count of likes on the post
    isLiked = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True, use_url=True)
    timestamp = serializers.DateTimeField(
        format="%b %d %Y, %I:%M %p"
    )  # Custom date format

    class Meta:
        model = Post
        fields = [
            "id",
            "poster",
            "content",
            "timestamp",
            "postLikes",
            "isLiked",
            "image",
        ]
        read_only_fields = ["id", "timestamp"]

    # TODO: Add types to the variables
    def get_isLiked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.postLikes.filter(liker=request.user).exists()
        return False


class CommentSerializer(serializers.ModelSerializer):
    # Nested representation of the commenter using UserSerializer;
    # read-only since it is derived from request.user.
    commenter = UserSerializer(read_only=True)
    # Format the timestamp for display
    timestamp = serializers.DateTimeField(format="%b %d %Y, %I:%M %p", read_only=True)
    # Here we only return the post's ID to avoid sending redundant post data.
    # The post is read-only since it is defined by the URL parameter.
    post = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Comment
        # Fields to be returned by the serializer
        fields = ["id", "post", "commenter", "content", "timestamp"]
