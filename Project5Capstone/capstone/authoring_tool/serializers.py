# network/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.authtoken.models import Token


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
    class Meta:
        model = get_user_model()
        fields = ["id", "username", "email"]

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
