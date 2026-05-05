# inventory/signals.py

import logging
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

# Direct import – no string reference, no nesting issues
from court_management.components.models import Booking
from .models import Product, InventoryTransaction

logger = logging.getLogger(__name__)


def _get_rules():
    """Return the list of consumption rules defined in settings."""
    return getattr(settings, 'INVENTORY_CONSUMPTION_RULES', [])


def _find_matching_rule(booking):
    """
    Match the booking's court name against the rules.
    Returns the first rule whose 'court_names' list contains the court.name (case‑insensitive).
    If a rule has an empty 'court_names', it matches any court (catch‑all).
    """
    court_name = booking.court.name.lower()
    for rule in _get_rules():
        patterns = rule.get('court_names', [])
        if not patterns:                     # empty list → match all
            return rule
        for pattern in patterns:
            if pattern.lower() in court_name:
                return rule
    return None


def _get_product_for_rule(rule):
    """Retrieve the product by SKU first, then by name (case‑insensitive)."""
    sku = rule.get('product_sku')
    if sku:
        try:
            return Product.objects.get(sku=sku, is_active=True)
        except Product.DoesNotExist:
            logger.debug("No product with SKU '%s'. Falling back to name.", sku)
    name = rule.get('product_name')
    if name:
        return Product.objects.filter(name__iexact=name, is_active=True).first()
    return None


@receiver(post_save, sender=Booking)
def deduct_consumables_on_booking(sender, instance, created, **kwargs):
    """
    When a booking becomes 'in_progress', deduct the consumable product
    defined by the matching INVENTORY_CONSUMPTION_RULES.
    Uses the booking ID as reference to avoid double deductions.
    """
    if instance.status != 'in_progress':
        return

    rule = _find_matching_rule(instance)
    if not rule:
        logger.debug(
            "No inventory rule matched for Booking #%s (court: %s). Skipping.",
            instance.pk, instance.court.name
        )
        return

    reference = f"Booking #{instance.pk}"
    if InventoryTransaction.objects.filter(
        transaction_type='consumed',
        reference=reference
    ).exists():
        return

    product = _get_product_for_rule(rule)
    if not product:
        logger.warning(
            "Could not find product (SKU: %s, name: %s) for Booking #%s.",
            rule.get('product_sku'), rule.get('product_name'), instance.pk
        )
        return

    quantity = rule.get('quantity_per_booking', 1)

    if product.quantity_on_hand < quantity:
        logger.warning(
            "Insufficient stock of '%s' (need %d, have %d) for Booking #%s.",
            product.name, quantity, product.quantity_on_hand, instance.pk
        )
        return

    try:
        InventoryTransaction.objects.create(
            product=product,
            transaction_type='consumed',
            quantity=quantity,               # positive → save() makes it negative
            unit_price=product.unit_cost,
            reference=reference,
            performed_by=None,
            notes=f"Auto‑deduct for booking {instance.pk} ({instance.court.name})"
        )
        logger.info(
            "Deducted %s × %s for Booking #%s",
            quantity, product.name, instance.pk
        )
    except Exception as e:
        logger.exception(
            "Failed to create inventory transaction for Booking #%s: %s",
            instance.pk, e
        )