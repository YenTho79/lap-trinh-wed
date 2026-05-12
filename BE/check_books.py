import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookreview.settings')
django.setup()

from api.models import Book

try:
    books = Book.objects.all()
    print(f"Total books: {books.count()}")
    for b in books:
        print(f"ID: {b.id}, Title: {b.title}, Stock: {b.stock}")
except Exception as e:
    print(f"Error: {e}")
