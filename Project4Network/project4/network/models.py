from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # Profile picture field; images are saved to "profile_pics/"
    profilePicture = models.ImageField(upload_to="profile_pics/", null=True, blank=True)


class Post(models.Model):
    # Define table's columns
    content = models.CharField(max_length=1024)
    # The user who posted this post
    poster = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userPosts")
    # Automatically set timestamp when post is created
    timestamp = models.DateTimeField(auto_now_add=True)
    # Optional image attached to the post
    image = models.ImageField(upload_to="post_images/", null=True, blank=True)


class Like(models.Model):
    # The post that was liked
    likedPost = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="postLikes"
    )
    # The user who liked the post
    liker = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userLikes")


class Comment(models.Model):
    # Link the comment to a post
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    # The user who wrote the comment
    commenter = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="userComments"
    )
    # The content of the comment
    content = models.TextField(max_length=1024)
    # Automatically set the timestamp when the comment is created
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # Return a readable representation of the comment
        return f"Comment by {self.commenter.username} on post {self.post.id}"


class Follower(models.Model):
    # The user being followed
    followee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="userFollowees", null=True
    )
    # The user who is following
    follower = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="userFollowers", null=True
    )
