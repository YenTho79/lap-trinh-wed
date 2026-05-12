import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookreview.settings')
django.setup()

from api.models import Borrow, User

try:
    user = User.objects.get(uid=24)
    print(f"User: {user.username}, Role: {user.role}")
    borrows = Borrow.objects.filter(user_id=user.uid)
    print(f"Borrows for user {user.uid}: {borrows.count()}")
    for b in borrows:
        print(f"ID: {b.id}, Status: {b.status}")
except Exception as e:
    print(f"Error: {e}")
