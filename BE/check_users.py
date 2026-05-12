import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookreview.settings')
django.setup()

from api.models import User

try:
    users = User.objects.all()
    print(f"Total users: {users.count()}")
    for u in users:
        print(f"UID: {u.uid}, Username: {u.username}, Role: {u.role}")
except Exception as e:
    print(f"Error: {e}")
