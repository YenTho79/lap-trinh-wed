from decimal import Decimal

from django.db.models import Avg, Count

from .models import Book, BookReview


def refresh_book_rating_stats(book_id: int) -> None:
    """Cập nhật diem_trung_binh và tong_luot_danh_gia trên bảng sach."""
    agg = BookReview.objects.filter(book_id=book_id).aggregate(
        avg=Avg("stars"), cnt=Count("id")
    )
    cnt = agg["cnt"] or 0
    avg = agg["avg"]
    if avg is None:
        avg_dec = Decimal("0.0")
    else:
        avg_dec = Decimal(str(round(float(avg), 1)))
    Book.objects.filter(pk=book_id).update(avg_rating=avg_dec, total_reviews=cnt)
