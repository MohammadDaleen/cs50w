from django import template

register = template.Library()

@register.filter(name="max")
def maxVal(value):
    
    # listing.listingBids.all().values_list("amount")
    try:
        return max(value)
    except ValueError:
        print(value)
        print(type(value))
        if value:
            print(True)
        else:
            print(False)