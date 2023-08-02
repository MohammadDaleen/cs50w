from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Post(models.Model):
    # Define table's columns
    content = models.CharField(max_length=1024)
    poster = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userPosts")
    timestamp = models.DateTimeField(auto_now_add=True)

class Like(models.Model):
    likedPost = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="postLikes")
    liker = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userLikes")

class Follower(models.Model):
    pass