from . import util

'''
Create a context processor (i.e., a function that runs before every template
is rendered and add context variables to the template context.)
'''


def render(request):
    # Get all entries titles from .md files
    entriesTitles = util.list_entries()
    
    # return entriesTitles to rendered templates
    return ({"entriesTitles": entriesTitles})
    