# badminton_court/settings/inventory.py

INVENTORY_CONSUMPTION_RULES = [
    {
        'court_names': ['badminton 1', 'badminton 2', 'court a', 'court b'],
        'product_sku': 'SHUTTLE',
        'product_name': 'Shuttlecock',   # fallback if SKU not found
        'quantity_per_booking': 2,
    },
    # Add more rules for other courts/sports
    {
        'court_names': ['basketball'],
        'product_sku': 'BASKETBALL',
        'product_name': 'Indoor Basketball',
        'quantity_per_booking': 1,
    },
]