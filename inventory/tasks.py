# inventory/tasks.py
import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.db import models

from .models import Product

logger = logging.getLogger(__name__)


@shared_task
def check_low_stock():
    """
    Periodic task: send an email alert for every active product
    whose quantity_on_hand is at or below its reorder_level.
    """
    low_stock = Product.objects.filter(
        quantity_on_hand__lte=models.F('reorder_level'),
        is_active=True
    )

    if not low_stock.exists():
        logger.info("Inventory check: all stock levels are fine.")
        return

    # Build the email content
    product_lines = []
    for p in low_stock:
        product_lines.append(
            f"• {p.name} (SKU: {p.sku or 'N/A'}) – "
            f"{p.quantity_on_hand} left (reorder at {p.reorder_level})"
        )
    body = (
        "The following products need restocking:\n\n"
        + "\n".join(product_lines)
    )
    subject = f"[Inventory Alert] {low_stock.count()} products low on stock"

    # Retrieve admin email addresses from settings.ADMINS
    admin_emails = [email for _, email in getattr(settings, 'ADMINS', [])]
    if not admin_emails:
        logger.warning(
            "No ADMINS configured in settings. Cannot send low‑stock alert."
        )
        return

    try:
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            admin_emails,
            fail_silently=False,
        )
        logger.info(
            "Low‑stock alert sent for %d products to %s.",
            low_stock.count(), ", ".join(admin_emails)
        )
    except Exception as e:
        logger.exception("Failed to send low‑stock email: %s", e)