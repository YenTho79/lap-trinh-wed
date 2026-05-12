import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookreview.settings')
django.setup()

from api.models import BorrowDetail

try:
    details = BorrowDetail.objects.all()
    print(f"Total details: {details.count()}")
    for d in details:
        print(f"Borrow ID: {d.borrow_id}, Book ID: {d.book_id}, Qty: {d.quantity}")
except Exception as e:
    print(f"Error: {e}")
