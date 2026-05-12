from rest_framework import serializers
from .models import Book, BookReview, Chapter, ContactMessage, User, Borrow, BorrowDetail

# --- USER SERIALIZERS ---
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ("uid", "username", "email", "password", "role", "avatar", "create_time")
        read_only_fields = ("uid", "create_time")

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.method == "POST" and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Bắt buộc khi tạo người dùng mới."})
        return attrs

    def create(self, validated_data):
        from django.contrib.auth.hashers import make_password
        pwd = validated_data.pop("password", None)
        if pwd:
            validated_data["password"] = make_password(pwd)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        from django.contrib.auth.hashers import make_password
        pwd = validated_data.pop("password", None)
        if pwd:
            validated_data["password"] = make_password(pwd)
        return super().update(instance, validated_data)

class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("uid", "username", "avatar")

# --- BOOK & CHAPTER ---
class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ("id", "title", "author", "category", "cover_image", "description", "avg_rating", "total_reviews", "stock", "create_time")

class ChapterListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ("id", "book", "order", "title")

class ChapterDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ("id", "book", "order", "title", "content")

# --- REVIEW ---
class BookReviewSerializer(serializers.ModelSerializer):
    user_detail = UserPublicSerializer(source="user", read_only=True)
    book_title = serializers.CharField(source="book.title", read_only=True)
    class Meta:
        model = BookReview
        fields = ("id", "user", "user_detail", "book", "book_title", "review_title", "review_body", "stars", "created_at")
        read_only_fields = ("id", "user", "user_detail", "created_at")

class BookReviewWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookReview
        fields = ("book", "review_title", "review_body", "stars")

# --- THÊM CLASS NÀY ĐỂ HẾT LỖI IMPORT TRONG VIEWS ---
class BookReviewUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookReview
        fields = ("review_title", "review_body", "stars")

# --- CONTACT ---
class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ("message_id", "sender_name", "sender_email", "content", "send_time")
        read_only_fields = ("message_id", "send_time")

# --- BORROW & RETURN ---
class BorrowDetailSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    book_author = serializers.CharField(source="book.author", read_only=True)
    book_cover = serializers.CharField(source="book.cover_image", read_only=True)

    class Meta:
        model = BorrowDetail
        fields = ("id", "borrow", "book", "book_title", "book_author", "book_cover", "quantity", "status")
        read_only_fields = ("id", "borrow")

class BorrowSerializer(serializers.ModelSerializer):
    details = BorrowDetailSerializer(many=True, read_only=True)
    book = serializers.PrimaryKeyRelatedField(queryset=Book.objects.all(), write_only=True, required=False)
    quantity = serializers.IntegerField(write_only=True, required=False, default=1)
    user_name = serializers.CharField(source="user.username", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = Borrow
        fields = (
            "id", "user", "user_name", "user_email", 
            "borrower_name", "book_name", 
            "borrow_date", "due_date", "return_date", 
            "status", "note", "admin_note",
            "condition_borrow", "condition_return",
            "borrow_image", "return_image",
            "book", "quantity", "details"
        )
        read_only_fields = ("id", "user")

    def create(self, validated_data):
        book_obj = validated_data.pop("book", None)
        qty = validated_data.pop("quantity", 1)
        borrow = Borrow.objects.create(**validated_data)
        if book_obj:
            BorrowDetail.objects.create(
                borrow=borrow,
                book=book_obj,
                quantity=qty,
                status="DangMuon" if validated_data.get("status") == "DangMuon" else "ChoDuyet"
            )
        borrow.refresh_from_db()
        return borrow