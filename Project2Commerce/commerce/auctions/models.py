from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

# auction listings model
    # specify a title for the listing, a text-based description, and what the starting bid should be.
    # optionally be able to provide a URL for an image for the listing and/or a category (e.g. Fashion, Toys, Electronics, Home, etc.).
class Listing(models.Model):
    # Define CATEGORIES that will be used as choices for category column
    CATEGORIES = [("fshn", "Fashion"), 
                 ("tys", "Toys"), 
                 ("elc", "Electronics"), 
                 ("hom", "Home"),
                 ("etc", "Etc"),
                 ("none", "N/A")]
    
    # Define table's columns
    title = models.CharField(max_length=64)
    description = models.CharField(max_length=1024)
    startingBid = models.PositiveIntegerField()
    imgURL = models.URLField(blank=True, null=True)
    category = models.CharField(blank=True, choices=CATEGORIES, max_length=4, null=True)
    
    lister = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userListings")
    isClosed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.id}. \n\
                Title:\t{self.title},\n\
                Description: \t{self.description},\n\
                Starting Bid: \t{self.startingBid},\n\
                Image's URL: \t{self.imgURL},\n\
                Category: \t{self.category}."
    
    
# bids model
class Bid(models.Model):
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    bidder = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userBids")
    auction = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="listingBids")
    
    def __str__(self):
        return f"{self.id}. {self.bidder}: bidded {self.amount} on ({self.auction.id}. {self.auction.title})"


# comments made on auction listings model
class Comment(models.Model):
    text = models.CharField(max_length=1024)
    commenter = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userComments")
    auction = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="listingComments")
    
    def __str__(self):
        return f"{self.commenter}: {self.text}"


# Watchlist
class Watchlist(models.Model):
    watcher = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userWatchlist")
    auction = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="listingWatchlists")
    
    def __str__(self):
        return f"{self.id}. {self.watcher} is watching ({self.auction.id}. {self.auction.title})"
