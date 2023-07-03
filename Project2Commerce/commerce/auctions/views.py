from django import forms
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import *


# create a new listing page (view)
# specify a title for the listing, a text-based description, and what the starting bid should be.
# optionally be able to provide a URL for an image for the listing and/or a category (e.g. Fashion, Toys, Electronics, Home, etc.).
class NewListingForm(forms.Form):
    # Add a title input field (- default: textInput)
    title = forms.CharField()
    # Set label for title input field
    title.label = "Title"
    # Change HTML attrbutes of title input field
    title.widget.attrs.update({"class": "form-control mb-2"})
    
    # Add a description input field (- default: textInput)
    description = forms.CharField()
    # Set label for description input field
    description.label = "Description"
    # Change HTML attrbutes of description input field
    description.widget.attrs.update({"class": "form-control"})
    
    # Add a startingBid input field (- default: NumberInput)
    startingBid = forms.DecimalField(decimal_places=2)
    # Set label for startingBid input field
    startingBid.label = "Starting bid"
    # Change HTML attrbutes of startingBid input field
    startingBid.widget.attrs.update({"class": "form-control"})
    
    # Add a imgURL input field (- default: URLInput)
    imgURL = forms.URLField(required=False, )
    # Set label for imgURL input field
    imgURL.label = "URL for an image for the listing"
    # Change HTML attrbutes of imgURL input field
    imgURL.widget.attrs.update({"class": "form-control"})
    
     # Add a category input field (- default: Select)
    category = forms.ChoiceField(choices=Listing.CATEGORIES)
    # Set label for category input field
    category.label = "Category"
    # Change HTML attrbutes of category input field
    category.widget.attrs.update({"class": "form-control"})


class hiddinListingIdForm(forms.Form):
    # Add a listingId hidden field (HiddenInput)
    listingId = forms.CharField(widget=forms.HiddenInput())
    
    # Extend __init__ function of parent class (to set listingId initial value)
    def __init__(self, *args, **kwargs):
        # Call __init__ function in parent class (i.e., Form)
        super().__init__(*args, **kwargs)
        
        # Get the listingId value from kwargs (default value is None)
        listingId = kwargs.pop('listingId', None)
        
        # Ensure listingId is valid
        if listingId:
            # set the initial value of listingId in form to value of listingId from kwargs
            self.fields['listingId'].initial = listingId


class AddBidForm(hiddinListingIdForm):
    # Add a bid input field (- default: NumberInput)
    bid = forms.DecimalField(decimal_places=2)
    # Set label for bid input field
    bid.label = "Bid"
    # Change HTML attrbutes of bid input field
    bid.widget.attrs.update({"class": "form-control mx-3"})


class AddCommentForm(hiddinListingIdForm):
    # Add a text input field (- default: textInput)
    text = forms.CharField()
    # Set label for text input field
    text.label = "Comment"
    # Change HTML attrbutes of text input field
    text.widget.attrs.update({"class": "form-control mx-3"})

# Active Listings Page (view)
# view all of the currently active auction listings. 
# For each active listing, this page should display (at minimum) 
# the title, description, current price, and photo (if one exists for the listing).
def index(request):
    # Get all listings from database
    listings = Listing.objects.all()
    
    # Get default CATEGORIES
    CATEGORIES = Listing.CATEGORIES
    
    # Create an empty list to store data of listings
    data = []
    
    # Loop len(listings) time
    for listing in listings:
        ''' Get the max bid amount for current listing '''
        if listing.listingBids.all(): # To avoid exceptions 
            # Get all bids.amounts for current listing
            bidsAmounts = listing.listingBids.values_list("amount", flat=True) # flat=True returns List/QuerySet instead of List/QuerySet of 1-tuples
            maxBidAmount = max(bidsAmounts)
        # There is no bids for current listing
        else:
            maxBidAmount = None
        
    
        ''' Get the category of current listing '''
        category = "N/A"
        for KEY, VALUE in CATEGORIES:
            if listing.category == KEY:
                category = VALUE
                
        ''' Restructure data of listings'''
        data.append((listing, maxBidAmount, category))
    
    return render(request, "auctions/index.html", {
        # Pass data of listings
        "data": data
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
            return HttpResponseRedirect(reverse("commerce:index"))
        else:
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "auctions/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("commerce:index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "auctions/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("commerce:index"))
    else:
        return render(request, "auctions/register.html")


def newListing(request):
    # Check if method is POST
    if request.method == "POST":
        # Take in the data the user submitted and save it as form
        form = NewListingForm(request.POST)

        # Check if form data is valid (server-side)
        if form.is_valid():
            # Isolate data from the 'cleaned' version of form data
            title = form.cleaned_data["title"]
            description = form.cleaned_data["description"]
            startingBid = form.cleaned_data["startingBid"]
            imgURL = form.cleaned_data["imgURL"]
            category = form.cleaned_data["category"]
            lister = request.user

            ''' Validate data ''' 
            if imgURL and category: # All fields are filled
                listing = Listing(title=title, 
                                  description=description, 
                                  startingBid=startingBid,
                                  imgURL=imgURL,
                                  category=category,
                                  lister=lister)
            elif imgURL: # Category's field is not filled
                listing = Listing(title=title, 
                                  description=description, 
                                  startingBid=startingBid,
                                  category=category,
                                  lister=lister)
            elif category: # Image's URL's field is not filled
                listing = Listing(title=title, 
                                  description=description, 
                                  startingBid=startingBid,
                                  category=category,
                                  lister=lister)
            else: # Category's and Image's URL's fields are not filled
                listing = Listing(title=title, 
                                  description=description, 
                                  startingBid=startingBid,
                                  lister=lister)
            
            # Save data in database (Listing(s) table)
            listing.save()
            

            # foo: Redirect user to the new list's page.
            # return HttpResponseRedirect(reverse(f"commerce:listing", args=[title]))
            return HttpResponseRedirect(reverse(f"commerce:index"))

        else:
            # If the form is invalid, re-render the page with existing information.
            return render(request, "auctions/newListing.html", {
                "NewListingForm": form
            })
    
    
    return render(request, "auctions/newListing.html", {
        # The form for new listing
        "NewListingForm": NewListingForm
    })
    

# Listing Page (view)
# view all details about the listing, including the current price for the listing.
'''
    If the user is signed in, the user should be able to add the item to their “Watchlist.” If the item is already on the watchlist, the user should be able to remove it.
    If the user is signed in, the user should be able to bid on the item. The bid must be at least as large as the starting bid, and must be greater than any other bids that have been placed (if any). If the bid doesn’t meet those criteria, the user should be presented with an error.
    If the user is signed in and is the one who created the listing, the user should have the ability to “close” the auction from this page, which makes the highest bidder the winner of the auction and makes the listing no longer active.
    If a user is signed in on a closed listing page, and the user has won that auction, the page should say so.
    Users who are signed in should be able to add comments to the listing page. The listing page should display all comments that have been made on the listing.
'''
def listing(request, id):
    # Get the listing that has the provided id from database
    listing = Listing.objects.get(id=id)
    
    
    ''' Get the max bid amount for this listing '''
    if listing.listingBids.all(): # To avoid exceptions 
        # Get all bids.amounts for current listing
        bidsAmounts = listing.listingBids.values_list("amount", flat=True) # flat=True returns List/QuerySet instead of List/QuerySet of 1-tuples
        maxBidAmount = max(bidsAmounts)
    # There is no bids for this listing
    else:
        maxBidAmount = None
        
    
    ''' Get the category of this listing '''
    category = "N/A"
    for KEY, VALUE in Listing.CATEGORIES:
        if listing.category == KEY:
            category = VALUE
            
    
    ''' Get listing status (isClosed?) '''
    isClosed = listing.isClosed
    
    
    ''' Get auction winner (if any) '''
    winner = ""
    # Ensure auction is closed
    if isClosed:
        # Ensure there is highest bid
        if maxBidAmount:
            # Get the user who has the highest bid on current listing
            winner = listing.listingBids.get(amount=maxBidAmount).bidder
            
    ''' Get comments on current listing '''
    try:
        comments = Comment.objects.filter(auction=listing)
    except Comment.DoesNotExist:
        comments = []    
    

    # If the user is signed in
    if request.user.is_authenticated:
        # try to check if the listing is in the watchlist of the user
        try: 
            if Watchlist.objects.get(watcher=request.user, auction=listing):
                isOnWatchlistOfUser = True
        # the listing is not on the watchlist of the user
        except Watchlist.DoesNotExist:
            isOnWatchlistOfUser = False
        
        # Ensure that current user is the creator of current listing
        userIsLister = False
        if listing.lister == request.user:
            userIsLister = True
        
        # Ensure user is the winner
        if request.user == winner:
            winner = str(winner) + "(You)"
        
        # render the listing page
        return render(request, "auctions/listing.html", {
            # Pass listing object
            "listing": listing,
            # Pass listing's object
            "category": category,
            # Pass the max bid amount for current listing
            "maxBidAmount": maxBidAmount,
            # Pass if listing is closed
            "isClosed": isClosed,
            # Pass winner (if any)
            "winner": winner,
            # Pass comments of current listing
            "comments": comments,
            # Pass AddCommentForm
            "AddCommentForm": AddCommentForm(initial={"listingId": id}),
            
            # Pass if listing is on watchlist for current user
            "isOnWatchlist": isOnWatchlistOfUser,
            # Pass a form to add bid
            "AddBidForm": AddBidForm(initial={"listingId": id}),
            # Pass a form to addTo/RemoveFrom watchlist buttons
            "hiddinListingIdForm": hiddinListingIdForm(initial={"listingId": id}),
            # Pass if user is lister
            "userIsLister": userIsLister
    })
    
    # The request method is GET
    return render(request, "auctions/listing.html", {
        # Pass listing object
        "listing": listing,
        # Pass listing's object
        "category": category, 
        # Pass the max bid amount for current listing
        "maxBidAmount": maxBidAmount,
        # Pass if listing is closed
        "isClosed": isClosed,
        # Pass winner (if any)
        "winner": winner,
        # Pass comments of current listing
        "comments": comments
    })


# Watchlist: Users who are signed in should be able to visit a Watchlist page, which should display all of the listings that a user has added to their watchlist. Clicking on any of those listings should take the user to that listing’s page.
def watchlist(request):
    if request.method == "POST":
        if not request.user.is_authenticated:
            return HttpResponse("Must be logged in.")
        
        # Take in the data the user submitted and save it as form
        form = hiddinListingIdForm(request.POST)

        # Ensure form data is valid (server-side)
        if not form.is_valid():
            return HttpResponse("The AddToWatchlistForm is not valid")
                
        # Isolate data from the 'cleaned' version of form data
        listingId = form.cleaned_data["listingId"]
        
        listing = Listing.objects.get(id=listingId)
        watchlist = Watchlist(watcher=request.user, auction=listing)
        watchlist.save()
        return HttpResponseRedirect(reverse(f"commerce:listing", args=(listingId,)))
    
    user = User.objects.get(username=request.user)
    userWatchlists = user.userWatchlists.all()
    print(userWatchlists)
    
    listings = []
    for watchlist in userWatchlists:        
        listings.append(watchlist.auction)
    
    # Get default CATEGORIES
    CATEGORIES = Listing.CATEGORIES
    
    # Create an empty list to store data of listings
    data = []
    
    # Loop len(listings) time
    for listing in listings:
        ''' Get the max bid amount for current listing '''
        if listing.listingBids.all(): # To avoid exceptions 
            # Get all bids.amounts for current listing
            bidsAmounts = listing.listingBids.values_list("amount", flat=True) # flat=True returns List/QuerySet instead of List/QuerySet of 1-tuples
            maxBidAmount = max(bidsAmounts)
        # There is no bids for current listing
        else:
            maxBidAmount = None
        
    
        ''' Get the category of current listing '''
        category = "N/A"
        for KEY, VALUE in CATEGORIES:
            if listing.category == KEY:
                category = VALUE
                
        ''' Restructure data of listings'''
        data.append((listing, maxBidAmount, category))
    
    
    return render(request, "auctions/watchlist.html", {
        "data": data
    })
    

def removeWatchlist(request):
    if request.method == "POST":
        if not request.user.is_authenticated:
            return HttpResponse("Must be logged in.")
        
        # Take in the data the user submitted and save it as form
        form = hiddinListingIdForm(request.POST)

        # Ensure form data is valid (server-side)
        if not form.is_valid():
            return HttpResponse("The AddToWatchlistForm is not valid")
                
        # Isolate data from the 'cleaned' version of form data
        listingId = form.cleaned_data["listingId"]
        
        listing = Listing.objects.get(id=listingId)
        watchlist = Watchlist.objects.get(watcher=request.user, auction=listing)
        watchlist.delete()
        
        return HttpResponseRedirect(reverse(f"commerce:listing", args=(listingId,)))


def addBid(request):
    
    if request.method == "POST":
        if not request.user.is_authenticated:
            return HttpResponse("Must be logged in.")
        
        # Take in the data the user submitted and save it as form
        form = AddBidForm(request.POST)

        # Ensure form data is valid (server-side)
        if not form.is_valid():
            return HttpResponse("The AddBidForm is not valid")
                
        # Isolate data from the 'cleaned' version of form data
        listingId = form.cleaned_data["listingId"]
        addedBid = form.cleaned_data["bid"]

        # Get the listing that the user wants to bid on
        listing = Listing.objects.get(id=listingId)

        
        bidsAmounts = listing.listingBids.values_list("amount", flat=True) # flat=True returns List/QuerySet instead of List/QuerySet of 1-tuples
        
        # Ensure there are bids for current listing
        if bidsAmounts:
            # Get the max bid amount
            maxBidAmount = max(bidsAmounts)
        # There are no bids for current listing
        else:
            maxBidAmount = 0
        
        # Ensure that the bid is at least as large as the starting bid, and greater than any other bids that have been placed (if any).
        if addedBid < listing.startingBid or addedBid <= maxBidAmount:
            return HttpResponse("The bid must be at least as large as the starting bid, and must be greater than any other bids.")
        
        bid = Bid(amount=addedBid, bidder=request.user, auction=listing)
        bid.save()
        return HttpResponseRedirect(reverse(f"commerce:listing", args=(listingId,)))
    

def closeAuction(request):
    if request.method == "POST":
        if not request.user.is_authenticated:
            return HttpResponse("Must be logged in.")
        
        # Take in the data the user submitted and save it as form
        form = hiddinListingIdForm(request.POST)

        # Ensure form data is valid (server-side)
        if not form.is_valid():
            return HttpResponse("The hiddinListingIdForm is not valid")
                
        # Isolate data from the 'cleaned' version of form data
        listingId = form.cleaned_data["listingId"]
        
        # Get the listing that would be closed
        listing = Listing.objects.get(id=listingId)
        # Close auction
        listing.isClosed = True
        # Save listing in database
        listing.save()
        return HttpResponseRedirect(reverse(f"commerce:listing", args=(listingId,)))
        
  
def addComment(request):
    
    if request.method == "POST":
        if not request.user.is_authenticated:
            return HttpResponse("Must be logged in.")
        
        # Take in the data the user submitted and save it as form
        form = AddCommentForm(request.POST)

        # Ensure form data is valid (server-side)
        if not form.is_valid():
            return HttpResponse("The AddCommentForm is not valid")
                
        # Isolate data from the 'cleaned' version of form data
        listingId = form.cleaned_data["listingId"]
        text = form.cleaned_data["text"]

        # Get commenter
        commenter = request.user
        
        # Get the listing that the user wants to bid on
        listing = Listing.objects.get(id=listingId)

        comment = Comment(text=text, commenter=commenter, auction=listing)
        comment.save()
        
        return HttpResponseRedirect(reverse(f"commerce:listing", args=(listingId,)))
       

# Categories: Users should be able to visit a page that displays a list of all listing categories. Clicking on the name of any category should take the user to a page that displays all of the active listings in that category.
def categories(request):
    return render(request, "auctions/categories.html", {
        "CATEGORIES": Listing.CATEGORIES
    })


def category(request, key):
    # Get the listings of current category (i.e., current key)
    listings = Listing.objects.filter(category=key)
    
    # Get default CATEGORIES
    CATEGORIES = Listing.CATEGORIES
    
    # Create an empty list to store data of listings
    data = []
    
    ''' Get the user readable category (for givin key) '''
    category = "N/A"
    for KEY, VALUE in CATEGORIES:
        if key == KEY:
            category = VALUE
    
    
    # Loop len(listings) time
    for listing in listings:
        
        ''' Get the max bid amount for current listing '''
        if listing.listingBids.all(): # To avoid exceptions 
            # Get all bids.amounts for current listing
            bidsAmounts = listing.listingBids.values_list("amount", flat=True) # flat=True returns List/QuerySet instead of List/QuerySet of 1-tuples
            maxBidAmount = max(bidsAmounts)
        # There is no bids for current listing
        else:
            maxBidAmount = None
        
        ''' Restructure data of listings'''
        data.append((listing, maxBidAmount, category))
    
    
    return render(request, "auctions/category.html", {
       "category": category,
       "data": data
    })

# Django Admin Interface: Via the Django admin interface, a site administrator should be able to view, add, edit, and delete any listings, comments, and bids made on the site.

