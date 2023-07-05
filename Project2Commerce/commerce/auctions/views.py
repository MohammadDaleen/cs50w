from django import forms
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import *

CATEGORIES = {}
for KEY, VALUE in Listing.CATEGORIES:
    CATEGORIES[KEY] = VALUE


class NewListingForm(forms.Form):  # Create a form for new listing
    # Add a title input field (- default: TextInput)
    title = forms.CharField()
    # Set label for title input field
    title.label = "Title"
    # Change HTML attrbutes of title input field
    title.widget.attrs.update({"class": "form-control"})
    
    # Add a description input field (- Textarea)
    description = forms.CharField(widget=forms.Textarea())
    # Set label for description input field
    description.label = "Description"
    # Change HTML attrbutes of description input field
    description.widget.attrs.update({"class": "form-control", "rows": "4"})
    
    # Add a startingBid input field (- default: NumberInput)
    startingBid = forms.DecimalField(decimal_places=2)
    # Set label for startingBid input field
    startingBid.label = "Starting bid"
    # Change HTML attrbutes of startingBid input field
    startingBid.widget.attrs.update({"class": "form-control"})
    
    # Add a imgURL input field (- default: URLInput)
    imgURL = forms.URLField(required=False, )
    # Set label for imgURL input field
    imgURL.label = "URL for an image"
    # Change HTML attrbutes of imgURL input field
    imgURL.widget.attrs.update({"class": "form-control"})
    
    # Add a category input field (- default: Select)
    category = forms.ChoiceField(choices=Listing.CATEGORIES)
    # Set label for category input field
    category.label = "Category"
    # Change HTML attrbutes of category input field
    category.widget.attrs.update({"class": "form-control"})


class hiddinListingIdForm(forms.Form):  # Create a form for hiddin listing id
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


class AddBidForm(hiddinListingIdForm):  # Create a form for adding a bid to a listing
    # Add a bid input field (- default: NumberInput)
    bid = forms.DecimalField(decimal_places=2)
    # Set label for bid input field
    bid.label = "Bid"
    # Change HTML attrbutes of bid input field
    bid.widget.attrs.update({"class": "form-control mx-3"})


class AddCommentForm(hiddinListingIdForm):  # Create a form for adding a comment on a listing
    # Add a text input field (- default: textInput)
    text = forms.CharField()
    # Set label for text input field
    text.label = "Comment"
    # Change HTML attrbutes of text input field
    text.widget.attrs.update({"class": "form-control mx-3"})


# Active listings page (view)
def index(request):
    # Get all active listings from database
    listings = Listing.objects.filter(isClosed=False)
    
    # Create an empty list to store data of listings
    data = []
    
    # Loop over listings
    for listing in listings:
        ''' Get the max bid amount for current listing '''
        # Get all bids.amounts for current listing
        # flat=True returns List/QuerySet instead of List/QuerySet of 1-tuples
        bidsAmounts = listing.listingBids.values_list("amount", flat=True)
        # Ensure there are any bids for current listing
        if bidsAmounts:
            # Get the max bid amount for current listing
            maxBidAmount = max(bidsAmounts)
        # There is no bids for current listing
        else:
            maxBidAmount = None
        
        ''' Get the category of current listing '''
        category = CATEGORIES[listing.category]
                
        ''' Restructure data of listings'''
        data.append((listing, maxBidAmount, category))
    
    return render(request, "auctions/index.html", {
        # Pass data of listings
        "data": data
    })


# Login page (view)
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


# Logout page (view)
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("commerce:index"))


# Register page (view)
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


# Add new listing page/form (view)
@login_required
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
            
            # Get the lister of submitted listing
            lister = request.user

            ''' Validate data ''' 
            if imgURL and category:  # All fields are filled
                listing = Listing(title=title, 
                                  description=description, 
                                  startingBid=startingBid,
                                  imgURL=imgURL,
                                  category=category,
                                  lister=lister)
            elif imgURL:  # Category's field is not filled
                listing = Listing(title=title, 
                                  description=description, 
                                  startingBid=startingBid,
                                  category=category,
                                  lister=lister)
            elif category:  # Image's URL's field is not filled
                listing = Listing(title=title, 
                                  description=description, 
                                  startingBid=startingBid,
                                  category=category,
                                  lister=lister)
            else:  # Category's and Image's URL's fields are not filled
                listing = Listing(title=title, 
                                  description=description, 
                                  startingBid=startingBid,
                                  lister=lister)
            
            # Save data in database (Listing(s) table)
            listing.save()

            # Redirect user to the new list's page.
            return HttpResponseRedirect(reverse(f"commerce:listing", args=[listing.id]))

        # The form is invalid
        else:
            # re-render the page with existing information.
            return render(request, "auctions/newListing.html", {
                "NewListingForm": form
            })
    
    # The method is GET
    return render(request, "auctions/newListing.html", {
        # Pass the form for new listing
        "NewListingForm": NewListingForm
    })


# Listing page (view)
def listing(request, id):
    # Get the listing that has the submitted id from database
    listing = Listing.objects.get(id=id)
    
    ''' Get the max bid amount for this listing '''
    # Get all bids.amounts for current listing
    # flat=True returns List/QuerySet instead of List/QuerySet of 1-tuples
    bidsAmounts = listing.listingBids.values_list("amount", flat=True)
    # Ensure current listing have bids
    if bidsAmounts:
        # Get the max bid amount for this listing
        maxBidAmount = max(bidsAmounts)
    # There is no bids for current listing
    else:
        maxBidAmount = None
    
    ''' Get the category of this listing '''
    category = {"key": listing.category, "value": CATEGORIES[listing.category]}
    
    ''' Get auction winner (if any) '''
    winner = ""
    # Ensure auction is closed
    if listing.isClosed:
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
            # Pass listing's category dictionary
            "category": category,
            # Pass the max bid amount for current listing (if any)
            "maxBidAmount": maxBidAmount,
            # Pass winner (if any)
            "winner": winner,
            # Pass comments of current listing (if any)
            "comments": comments,
            # Pass a form to add a comment
            "AddCommentForm": AddCommentForm(initial={"listingId": id}),
            # Pass if listing is on watchlist for current user or not
            "isOnWatchlist": isOnWatchlistOfUser,
            # Pass a form to add a bid
            "AddBidForm": AddBidForm(initial={"listingId": id}),
            # Pass a form to add/remove listing to/from watchlist buttons
            "hiddinListingIdForm": hiddinListingIdForm(initial={"listingId": id}),
            # Pass if user is lister or not
            "userIsLister": userIsLister
        })
    
    # The user is not signed in
    return render(request, "auctions/listing.html", {
        # Pass listing object
        "listing": listing,
        # Pass listing's category object
        "category": category, 
        # Pass the max bid amount for current listing (if any)
        "maxBidAmount": maxBidAmount,
        # Pass winner (if any)
        "winner": winner,
        # Pass comments of current listing (if any)
        "comments": comments
    })


# Watchlist page/form (view)
@login_required
def watchlist(request):
    # Check if method is POST
    if request.method == "POST":
        
        # Take in the data the user submitted and save it as form
        form = hiddinListingIdForm(request.POST)

        # Ensure form data is valid (server-side)
        if not form.is_valid():
            return HttpResponse("The AddToWatchlistForm is not valid")
        
        # Isolate data from the 'cleaned' version of form data
        listingId = form.cleaned_data["listingId"]
        
        # From database get the listing that have the provided id
        listing = Listing.objects.get(id=listingId)
        
        # Create a new Watchlist for current user and listing
        watchlist = Watchlist(watcher=request.user, auction=listing)
        
        # Save the new created Watchlist in database
        watchlist.save()
        
        # Redirect user to the listing's page that has been added from user's watchlist
        return HttpResponseRedirect(reverse(f"commerce:listing", args=(listingId,)))
    
    # The method is GET
    # From database get the User that has the same username as current signed in user
    user = User.objects.get(username=request.user)
    
    # From database, get the watchlist of user
    userWatchlist = user.userWatchlist.all()
    
    # Get Listing objects from user's Watchlist object
    listings = []
    for listing in userWatchlist:        
        listings.append(listing.auction)
    
    # Create an empty list to store data of listings
    data = []
    
    # Loop over listings
    for listing in listings:
        ''' Get the max bid amount for current listing '''
        # Get all bids.amounts for current listing
        # flat=True returns List/QuerySet instead of List/QuerySet of 1-tuples
        bidsAmounts = listing.listingBids.values_list("amount", flat=True)
        if bidsAmounts:
            # Get the max bid amount for current listing
            maxBidAmount = max(bidsAmounts)
        # There is no bids for current listing
        else:
            maxBidAmount = None
    
        ''' Get the category of current listing '''
        category = {"key": listing.category, "value": CATEGORIES[listing.category]}
                
        ''' Restructure data of listings'''
        data.append((listing, maxBidAmount, category))
    
    # Render the requested template
    return render(request, "auctions/watchlist.html", {
        # Pass watchlist's data
        "data": data
    })


# removeWatchlist form (view)
@login_required
def removeWatchlist(request):
    # Check if the method is POST
    if request.method == "POST":
        
        # Take in the data the user submitted and save it as form
        form = hiddinListingIdForm(request.POST)

        # Ensure form data is valid (server-side)
        if not form.is_valid():
            return HttpResponse("The AddToWatchlistForm is not valid")

        # Isolate data from the 'cleaned' version of form data
        listingId = form.cleaned_data["listingId"]
        
        # From database get the listing that have the provided id
        listing = Listing.objects.get(id=listingId)
        
        # Create the Watchlist object for current user and listing
        watchlist = Watchlist.objects.get(watcher=request.user, auction=listing)
        
        # Remove watchlist from database
        watchlist.delete()
        
        # Redirect user to the listing's page that has been deleted from user's watchlist
        return HttpResponseRedirect(reverse(f"commerce:listing", args=(listingId,)))


# addBid form (view)
@login_required
def addBid(request):
    # Check if method is POST
    if request.method == "POST":
        # Take in the data the user submitted and save it as form
        form = AddBidForm(request.POST)

        # Ensure form data is valid (server-side)
        if not form.is_valid():
            return HttpResponse("The AddBidForm is not valid")
                
        # Isolate data from the 'cleaned' version of form data
        listingId = form.cleaned_data["listingId"]
        addedBid = form.cleaned_data["bid"]

        # Get the listing (i.e., Listing object) that the user wants to bid on
        listing = Listing.objects.get(id=listingId)
        
        # From database, get bids amounts on the listing that the user wants to bid on
        # flat=True returns List/QuerySet instead of List/QuerySet of 1-tuples
        bidsAmounts = listing.listingBids.values_list("amount", flat=True)
        
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
        
        # Create a new Bid object for user's bid on current listing
        bid = Bid(amount=addedBid, bidder=request.user, auction=listing)
        
        # Save Bid object in database
        bid.save()
        
        # Redirect user to the listing that they has bidded on
        return HttpResponseRedirect(reverse(f"commerce:listing", args=(listingId,)))


# closeAuction form (view)
@login_required
def closeAuction(request):
    # Check if method is POST
    if request.method == "POST":
        # Take in the data the user submitted and save it as form
        form = hiddinListingIdForm(request.POST)

        # Ensure form data is valid (server-side)
        if not form.is_valid():
            return HttpResponse("The hiddinListingIdForm is not valid")
                
        # Isolate data from the 'cleaned' version of form data
        listingId = form.cleaned_data["listingId"]
        
        # Get the listing (i.e., Listing object) that the user wants to close
        listing = Listing.objects.get(id=listingId)
        
        # Close auction
        listing.isClosed = True
        
        # Save listing in database
        listing.save()
        
        # Reture user to the listing that the user has closed
        return HttpResponseRedirect(reverse(f"commerce:listing", args=(listingId,)))


# addComment form (view)
@login_required
def addComment(request):
    # Check if method is POST
    if request.method == "POST":
        # Take in the data the user submitted and save it as form
        form = AddCommentForm(request.POST)

        # Ensure form data is valid (server-side)
        if not form.is_valid():
            return HttpResponse("The AddCommentForm is not valid")
                
        # Isolate data from the 'cleaned' version of form data
        listingId = form.cleaned_data["listingId"]
        text = form.cleaned_data["text"]

        # Get commenter (i.e., user's User object)
        commenter = request.user
        
        # Get the listing that the user wants to bid on
        listing = Listing.objects.get(id=listingId)

        # Create a Comment object for user's comment on current auction/listing
        comment = Comment(text=text, commenter=commenter, auction=listing)
        
        # Save Comment object in database
        comment.save()
        
        # Redirect user to the listing that the user has commented on
        return HttpResponseRedirect(reverse(f"commerce:listing", args=(listingId,)))


# categories page (view)
def categories(request):
    # Render requested template
    return render(request, "auctions/categories.html", {
        # Pass default CATEGORIES
        "CATEGORIES": CATEGORIES
    })


# category page (view)
def category(request, key):
    # Get the listings of current category (i.e., current key)
    listings = Listing.objects.filter(category=key)
    
    # Create an empty list to store data of listings
    data = []
    
    ''' Get the category from default CATEGORIES'''
    category = {"key": key, "value": CATEGORIES[key]}
    
    # Loop over listings
    for listing in listings:
        ''' Get the max bid amount for current listing '''
        # Get all bids.amounts for current listing
        # flat=True returns List/QuerySet instead of List/QuerySet of 1-tuples
        bidsAmounts = listing.listingBids.values_list("amount", flat=True)
        # Ensure current listing has bids
        if bidsAmounts:
            # Get the max bid amount for current listing
            maxBidAmount = max(bidsAmounts)
        # There is no bids for current listing
        else:
            maxBidAmount = None
        
        ''' Restructure data of listings'''
        data.append((listing, maxBidAmount, category))
    
    # Render requested template    
    return render(request, "auctions/category.html", {
        # Pass current categroy
        "category": category,
        # Pass
        "data": data
    })

