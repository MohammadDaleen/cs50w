from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Post(models.Model):
    # Define table's columns
    content = models.CharField(max_length=1024)
    poster = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userPosts")
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def serialize(self):
        return {
            "id": self.id,
            "poster": self.poster.username,
            "content": self.content,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "postLikes": self.postLikes.count()
        }

class Like(models.Model):
    likedPost = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="postLikes")
    liker = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userLikes")

class Follower(models.Model):
    followee = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userFollowees", null=True)
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userFollowers", null=True)
   