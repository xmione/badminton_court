from django import template
from decimal import Decimal, InvalidOperation

register = template.Library()

@register.filter
def div(value, arg):
    """
    Divides the value by the arg. Handles Decimal objects.
    """
    try:
        # Convert both to Decimal for precise division
        # Ensure arg is not zero before division
        val = Decimal(str(value))
        agr = Decimal(str(arg))
        if agr == 0:
            return Decimal('0.00')
        return val / agr
    except (InvalidOperation, TypeError, ValueError):
        return Decimal('0.00') # Return a Decimal for consistency

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