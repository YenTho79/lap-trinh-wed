from django.contrib import admin

from .models import Book, BookReview, Chapter, ContactMessage, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("uid", "username", "email", "role", "create_time")
    search_fields = ("username", "email")
    ordering = ("-uid",)


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "author", "category", "avg_rating", "total_reviews")
    search_fields = ("title", "author", "category")
    ordering = ("-id",)


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ("id", "book", "order", "title")
    list_filter = ("book",)
    search_fields = ("title",)
    ordering = ("book_id", "order")


@admin.register(BookReview)
class BookReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "book", "user", "stars", "created_at")
    list_filter = ("stars",)
    search_fields = ("review_title", "review_body")
    ordering = ("-created_at",)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("message_id", "sender_name", "sender_email", "send_time")
    search_fields = ("sender_name", "sender_email", "content")
    ordering = ("-send_time",)
