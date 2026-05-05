from django.db import models
from django.conf import settings
from django.utils import timezone

class InventoryCategory(models.Model):
    """Group items by type: Rackets, Shuttlecocks, Apparel, etc."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Inventory Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class Supplier(models.Model):
    """Supplier or manufacturer details."""
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    """
    Represents any inventory item that can be stocked, sold, or consumed.
    Examples: Yonex shuttlecocks, Victor racket, grip tape rolls.
    """
    CONDITION_CHOICES = [
        ('new', 'New'),
        ('used', 'Used'),
        ('damaged', 'Damaged'),
    ]

    name = models.CharField(max_length=200)
    category = models.ForeignKey(
        InventoryCategory, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='products'
    )
    sku = models.CharField(max_length=50, unique=True, blank=True, null=True,
                           help_text="Stock Keeping Unit – unique product code")
    barcode = models.CharField(max_length=100, blank=True, null=True, help_text="UPC/EAN barcode")
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=20, default='piece',
                            help_text="Unit of measure: piece, box, tube, set")
    quantity_on_hand = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=10,
                                        help_text="Low‑stock threshold")
    reorder_quantity = models.IntegerField(default=20,
                                           help_text="Suggested order quantity when restocking")
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00,
                                    help_text="Average cost per unit")
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True,
                                        help_text="Retail selling price (if applicable)")
    supplier = models.ForeignKey(
        Supplier, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='products'
    )
    location = models.CharField(max_length=100, blank=True,
                                help_text="Storage location: Store Room A, Court 1 Cabinet")
    condition = models.CharField(max_length=10, choices=CONDITION_CHOICES, default='new')
    is_active = models.BooleanField(default=True, help_text="False if discontinued")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} ({self.sku or 'no SKU'})"

    @property
    def is_low_stock(self):
        """Check if stock is at or below reorder level."""
        return self.quantity_on_hand <= self.reorder_level


class InventoryTransaction(models.Model):
    """
    Records every stock movement: stock in, stock out, consumption, adjustments.
    This is the single source of truth for inventory changes.
    """
    TRANSACTION_TYPES = [
        ('in', 'Stock In (Purchase/Return)'),
        ('out', 'Stock Out (Sale/Transfer)'),
        ('consumed', 'Consumed (Court usage)'),
        ('damaged', 'Damaged / Lost'),
        ('adjustment', 'Adjustment (Inventory count correction)'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=15, choices=TRANSACTION_TYPES)
    quantity = models.IntegerField(help_text="Positive = added, negative = removed; sign auto‑adjusted")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True,
                                     help_text="Price at time of transaction")
    reference = models.CharField(max_length=200, blank=True,
                                 help_text="E.g., Booking #123, Event 'Summer Cup', or Invoice #INV-001")
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True
    )
    timestamp = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.get_transaction_type_display()} – {self.product.name} × {self.quantity}"

    def save(self, *args, **kwargs):
        """
        On creation, automatically update the associated product's quantity_on_hand.
        Stock in (positive) increases, all others decrease.
        """
        is_new = self.pk is None
        if is_new:
            # Determine sign: 'in' adds, everything else deducts
            if self.transaction_type == 'in':
                delta = self.quantity
            else:
                delta = -abs(self.quantity)   # ensure negative for deduction
            # Update product stock
            self.product.quantity_on_hand += delta
            self.product.save(update_fields=['quantity_on_hand', 'updated_at'])
            # Store the signed quantity for consistency
            self.quantity = delta
        super().save(*args, **kwargs)