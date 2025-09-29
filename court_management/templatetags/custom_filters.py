from django import template

register = template.Library()

@register.filter
def div(value, arg):
    try:
        return float(value) / float(arg)
    except (ValueError, ZeroDivisionError):
        return 0

@register.filter
def sum_attribute(value, arg):
    """
    Sums a specific attribute in a list of objects or dictionaries.
    Usage: {{ list_of_objects|sum_attribute:'attribute_name' }}
    """
    if isinstance(value, list):
        try:
            return sum(getattr(item, arg) for item in value)
        except (TypeError, ValueError, AttributeError):
            try:
                return sum(item[arg] for item in value)
            except (TypeError, ValueError, KeyError):
                return 0
    return 0