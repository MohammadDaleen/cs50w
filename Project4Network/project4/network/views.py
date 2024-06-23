import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from django import forms

from .models import Follower, User, Post, Like


def index(request):
    posts = Post.objects.all().order_by("-timestamp")
    return render(request, "network/index.html", {
        # Pass empty NewPostForm to template
        "posts": posts
    })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("network:index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("network:index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("network:index"))
    else:
        return render(request, "network/register.html")


@csrf_exempt
@login_required
def newPost(request):
    # Publishing a new post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Extract data from the request body
    data = json.loads(request.body)
    # Get the 'post' content from the JSON data
    postContent = data.get("post")
    # Ensure 'postContent' is a string
    if type(postContent) != str:
        return JsonResponse({"error": "post of type string required."}, status=400)
    
    # Remove leading and trailing whitespace from 'postContent'
    postContent = data.get("post").strip()
    # Ensure 'postContent' is not empty after stripping whitespace
    if not postContent:
        return JsonResponse({"error": "stripped post is empty."}, status=400)
    
    # Create a Post object with 'postContent' and the current user as the poster
    post = Post(content=postContent, poster=request.user)
    # Save Post object in database (Post(s) table)
    post.save()
    # Return a success message indicating the post was published successfully
    return JsonResponse({"message": "post published successfully."}, status=201)


def profilePage(request, user):
    user_ = User.objects.get(username=user)
    userPosts = Post.objects.filter(poster=user_).order_by("-timestamp")
    return render(request, "network/profilePage.html", {
        "user_": user_,
        "userPosts": userPosts
    })

    
def follow(request, user):
    followee = User.objects.get(username=user)
    follower = Follower(followee=followee, follower=request.user)
    return HttpResponseRedirect(reverse("network:profilePage"))
    
    