from django.db import models


class User(models.Model):
    """Bảng nguoi_dung — tài khoản đăng nhập (Admin / ThanhVien)."""

    uid = models.AutoField(db_column="ma_nguoi_dung", primary_key=True)
    username = models.CharField(db_column="ten_dang_nhap", max_length=255, unique=True)
    email = models.CharField(db_column="email", unique=True, max_length=255)
    password = models.CharField(db_column="mat_khau", max_length=255)
    role = models.CharField(db_column="vai_tro", max_length=50)
    avatar = models.CharField(
        db_column="link_anh_dai_dien", max_length=255, blank=True, null=True
    )
    create_time = models.DateTimeField(db_column="ngay_tao", auto_now_add=True)

    class Meta:
        managed = True
        db_table = "nguoi_dung"

    def __str__(self):
        return self.username

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False


class Book(models.Model):
    """Bảng sach — metadata sách, điểm trung bình do hệ thống cập nhật từ đánh giá."""

    id = models.AutoField(db_column="ma_sach", primary_key=True)
    title = models.CharField(db_column="tieu_de", max_length=255)
    author = models.CharField(db_column="tac_gia", max_length=255, blank=True, null=True)
    category = models.CharField(db_column="the_loai", max_length=100, blank=True, null=True)
    cover_image = models.CharField(db_column="anh_bia", max_length=255, blank=True, null=True)
    description = models.TextField(db_column="mo_ta", blank=True, null=True)
    avg_rating = models.DecimalField(
        db_column="diem_trung_binh", max_digits=3, decimal_places=1, default=0.0
    )
    total_reviews = models.IntegerField(db_column="tong_luot_danh_gia", default=0)

    stock = models.IntegerField(db_column="so_luong_ton", default=0)

    create_time = models.DateTimeField(db_column="ngay_tao", auto_now_add=True)

    class Meta:
        managed = True
        db_table = "sach"

    def __str__(self):
        return self.title


class Chapter(models.Model):
    """Bảng chuong_sach — nội dung đọc theo chương (thu_tu_chuong để sắp thứ tự)."""

    id = models.AutoField(db_column="ma_chuong", primary_key=True)
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        db_column="ma_sach",
        related_name="chapters",
    )
    order = models.IntegerField(db_column="thu_tu_chuong")
    title = models.CharField(db_column="tieu_de_chuong", max_length=255)
    content = models.TextField(db_column="noi_dung", blank=True, null=True)

    class Meta:
        managed = True
        db_table = "chuong_sach"
        ordering = ["book_id", "order"]

    def __str__(self):
        return self.title


class BookReview(models.Model):
    """Bảng danh_gia_chi_tiet — đánh giá sao (1–5) + nhận xét của người dùng cho một sách."""

    id = models.AutoField(db_column="ma_danh_gia", primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column="ma_nguoi_dung",
        related_name="book_reviews",
        null=True,
        blank=True,
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        db_column="ma_sach",
        related_name="reviews",
        null=True,
        blank=True,
    )
    review_title = models.CharField(
        db_column="tieu_de_review", max_length=255, blank=True, null=True
    )
    review_body = models.TextField(db_column="noi_dung_review", blank=True, null=True)
    stars = models.IntegerField(db_column="so_sao", blank=True, null=True)
    created_at = models.DateTimeField(db_column="ngay_tao", auto_now_add=True)

    class Meta:
        managed = True
        db_table = "danh_gia_chi_tiet"
        ordering = ["-created_at"]

    def __str__(self):
        return self.review_title or f"Review #{self.pk}"


class ContactMessage(models.Model):
    """Bảng tin_nhan_lien_he — form liên hệ (không cần đăng nhập)."""

    message_id = models.AutoField(db_column="ma_tin_nhan", primary_key=True)
    sender_name = models.CharField(db_column="ten_nguoi_gui", max_length=255)
    sender_email = models.CharField(db_column="email_nguoi_gui", max_length=255)
    content = models.TextField(db_column="noi_dung")
    send_time = models.DateTimeField(db_column="ngay_gui", auto_now_add=True)

    class Meta:
        managed = True
        db_table = "tin_nhan_lien_he"

    def __str__(self):
        return f"Tin từ {self.sender_name}"

class Borrow(models.Model):
    id = models.AutoField(db_column="ma_phieu_muon", primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column="ma_nguoi_dung",
        related_name="borrows"
    )
    borrow_date = models.DateTimeField(db_column="ngay_muon", auto_now_add=True)
    due_date = models.DateTimeField(db_column="han_tra")
    return_date = models.DateTimeField(db_column="ngay_tra_thuc_te", null=True, blank=True)
    status = models.CharField(db_column="trang_thai", max_length=50, default="ChoDuyet")
    note = models.TextField(db_column="ghi_chu", null=True, blank=True)
    borrower_name = models.CharField(db_column="ten_nguoi_muon", max_length=255, null=True, blank=True)
    book_name = models.CharField(db_column="ten_sach", max_length=255, null=True, blank=True)

    condition_borrow = models.CharField(db_column="tinh_trang_luc_muon", max_length=255, default="Nguyên vẹn")
    condition_return = models.CharField(db_column="tinh_trang_luc_tra", max_length=255, null=True, blank=True)

    borrow_image = models.CharField(db_column="hinh_minh_chung_muon", max_length=255, null=True, blank=True)
    return_image = models.CharField(db_column="hinh_minh_chung_tra", max_length=255, null=True, blank=True)

    admin_note = models.TextField(db_column="ghi_chu_admin", null=True, blank=True)

    class Meta:
        managed = True
        db_table = "phieu_muon"


class BorrowDetail(models.Model):
    id = models.AutoField(db_column="ma_chi_tiet_muon", primary_key=True)
    borrow = models.ForeignKey(
        Borrow,
        on_delete=models.CASCADE,
        db_column="ma_phieu_muon",
        related_name="details"
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        db_column="ma_sach"
    )
    quantity = models.IntegerField(db_column="so_luong", default=1)
    status = models.CharField(db_column="trang_thai", max_length=50, default="DangMuon")

    class Meta:
        managed = True
        db_table = "chi_tiet_muon"