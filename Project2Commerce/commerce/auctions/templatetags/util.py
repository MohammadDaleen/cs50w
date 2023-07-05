from django import template

register = template.Library()

# max filter
@register.filter(name="max")
def maxVal(value):
    return max(value)