from django import template

register = template.Library()

@register.filter(name="max")
def maxVal(value):
    return max(value)