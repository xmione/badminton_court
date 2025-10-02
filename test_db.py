#!/usr/bin/env python
import os
import sys
import django
from django.db import connections
from django.db.utils import OperationalError

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'badminton_court.settings')
django.setup()

try:
    db_conn = connections['default']
    cursor = db_conn.cursor()
    cursor.execute("SELECT 1")
    print("Database connection successful!")
    sys.exit(0)
except OperationalError as e:
    print(f"Database connection failed: {e}")
    sys.exit(1)