import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookreview.settings')
django.setup()

from api.models import Borrow

try:
    borrows = Borrow.objects.all()
    print(f"Total borrows: {borrows.count()}")
    for b in borrows:
        print(f"ID: {b.id}, User: {b.user_id}, Status: {b.status}, Date: {b.borrow_date}")
except Exception as e:
    print(f"Error: {e}")
