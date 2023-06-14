import random
import markdown2
from django import forms
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from . import util


class NewPageForm(forms.Form):
    title = forms.CharField(label="Title")
    MDContent = forms.CharField(widget=forms.Textarea())
    MDContent.label = "MarkDown Content"


def index(request):
    # Render requested page
    return render(request, "encyclopedia/index.html", {
        # Pass variables to template
        "entries": util.list_entries()
    })


def entry(request, title):
    # Get entry from .md files
    entry = util.get_entry(title)
    
    # Ensure entry exist
    if entry:
        # Convert Markdown content to HTML
        entry = markdown2.markdown(entry)
    
    # Render requested page
    return render(request, "encyclopedia/entry.html", {
        # Pass variables to template
        "title": title,
        "entry": entry
    })

    
def search(request):
    # Check if method is POST
    if request.method == "POST":
        # Get query from the submitted form
        query = request.POST['q']
        
        # Ensure query exist
        if not query:
            # Redirect user to main page 
            return HttpResponseRedirect(reverse("wiki:index"))
        
        # Get entry from .md files
        entry = util.get_entry(query)
        
        # Ensure entry exist
        if entry:
            # Convert Markdown content to HTML
            entry = markdown2.markdown(entry)
            
            # Render requested page
            return render(request, "encyclopedia/entry.html", {
                # Pass variables to template
                "title": query,
                "entry": entry
            })
        else:
            # Get entries list from .md files
            entries = util.list_entries()
            
            # Make an empty list for valid entries
            validEntries = []
            
            # Loop over entries list
            for entry in entries:
                # Ensure query is substring of entry
                if query.lower() in entry.lower():
                    validEntries.append(entry)
            
            # Render requested page
            return render(request, "encyclopedia/search.html", {
                # Pass variables to template
                "query": query,
                "entries": validEntries
            })
    
    # Redirect user to main page 
    return HttpResponseRedirect(reverse("wiki:index"))


def newPage(request): 
    # Check if method is POST
    if request.method == "POST":
        # Take in the data the user submitted and save it as form
        form = NewPageForm(request.POST)

        # Check if form data is valid (server-side)
        if form.is_valid():
            # Isolate the title from the 'cleaned' version of form data
            title = form.cleaned_data["title"]

            # Ensure entry is new
            if util.get_entry(title):
                # Display error message
                return HttpResponse(f'The entry "{title}" already exist!')
            
            # Isolate the content from the 'cleaned' version of form data
            content = form.cleaned_data["MDContent"]
            
            # Save the new page to an .md file
            util.save_entry(title, content)

            # Redirect user to the new entry's page.
            return HttpResponseRedirect(reverse(f"wiki:title", args=[title]))

        else:
            # If the form is invalid, re-render the page with existing information.
            return render(request, "wiki/newPage.html", {
                "NewPageForm": form
            })
    
    # Render requested page
    return render(request, "encyclopedia/newPage.html", {
        # Pass empty new page form to template
        "NewPageForm": NewPageForm()
    })


def editPage(request):
    # Check if method is POST
    if request.method == "POST":
        # Get the title from the submitted form
        title = request.POST['title']
        
        # Ensure title exist
        if not title:
            # Redirect user to main page 
            return HttpResponse(f"No title Provided!")
        
        # Ensure entry exist
        entry = util.get_entry(title)
        if entry:
            # Create a form contains requested entry data
            form = NewPageForm(initial={"title":title, "MDContent":entry})

            # Render requested page
            return render(request, "encyclopedia/editPage.html", {
                # Pass enrty's form to template
                "Form": form
            })
        
    # Redirect user to main page 
    return HttpResponseRedirect(reverse("wiki:index"))


def saveEditedPage(request):
    # Check if method is POST
    if request.method == "POST":
        # Take in the data the user submitted and save it as form
        form = NewPageForm(request.POST)

        # Check if form data is valid (server-side)
        if form.is_valid():
            # Isolate the title from the 'cleaned' version of form data
            title = form.cleaned_data["title"]

            # Isolate the content from the 'cleaned' version of form data
            content = form.cleaned_data["MDContent"]
            
            # Ensure there is a change
            if util.get_entry(title) != content:
                # Save the page to an .md file
                util.save_entry(title, content)

            # Redirect user to the entry's page.
            return HttpResponseRedirect(reverse(f"wiki:title", args=[title]))

        else:
            # If the form is invalid, re-render the page with existing information.
            return render(request, "wiki/newPage.html", {
                "NewPageForm": form
            })
    
    # Redirect user to main page 
    return HttpResponseRedirect(reverse("wiki:index"))


def randomPage(request):
    # Get all entries titles from .md files
    entriesTitles = util.list_entries()

    # Choose random entry's title from entries list
    randomEntryTitle = random.choice(entriesTitles)
    
    # Get random entry from .md files
    randomEntry = util.get_entry(randomEntryTitle)
    
    # Convert Markdown content to HTML
    randomEntryHTML = markdown2.markdown(randomEntry)
    
    # Render requested page
    return render(request, "encyclopedia/entry.html", {
        # Pass variables to template
        "title": randomEntryTitle,
        "entry": randomEntryHTML
    })
