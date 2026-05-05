from django.contrib import admin
from .models import InventoryCategory, Supplier, Product, InventoryTransaction


class InventoryTransactionInline(admin.TabularInline):
    """Show recent transactions directly on the Product detail page."""
    model = InventoryTransaction
    extra = 0
    readonly_fields = ['transaction_type', 'quantity', 'unit_price', 'reference', 'performed_by', 'timestamp']
    can_delete = False
    ordering = ['-timestamp']
    max_num = 20


@admin.register(InventoryCategory)
class InventoryCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_person', 'email', 'phone', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'contact_person']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'category', 'quantity_on_hand', 'reorder_level',
                    'unit_cost', 'selling_price', 'condition', 'is_active']
    list_filter = ['category', 'condition', 'is_active', 'supplier']
    search_fields = ['name', 'sku', 'barcode']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['reorder_level', 'unit_cost', 'selling_price']   # quick inline edits
    inlines = [InventoryTransactionInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'sku', 'barcode', 'category', 'description', 'unit')
        }),
        ('Stock & Pricing', {
            'fields': ('quantity_on_hand', 'reorder_level', 'reorder_quantity',
                       'unit_cost', 'selling_price')
        }),
        ('Supplier & Location', {
            'fields': ('supplier', 'location')
        }),
        ('Status', {
            'fields': ('condition', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ['product', 'transaction_type', 'quantity', 'unit_price',
                    'reference', 'performed_by', 'timestamp']
    list_filter = ['transaction_type', 'timestamp']
    search_fields = ['product__name', 'reference']
    readonly_fields = ['timestamp']  # timestamp auto-set, shouldn't be changed
    date_hierarchy = 'timestamp'