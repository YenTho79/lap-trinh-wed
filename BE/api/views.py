import datetime
import jwt
from django.db.models import Q
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from .models import Book, BookReview, Chapter, ContactMessage, User, Borrow, BorrowDetail
from .permissions import IsAdminRole, IsReviewOwnerOrAdmin
from .serializers import (
    BookReviewSerializer,
    BookReviewUpdateSerializer,
    BookReviewWriteSerializer,
    BookSerializer,
    ChapterDetailSerializer,
    ChapterListSerializer,
    ContactMessageSerializer,
    UserSerializer,
    BorrowSerializer,
)
from .utils import refresh_book_rating_stats

# --- AUTHENTICATION VIEWS ---

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        data = request.data
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")
        if not all([username, email, password]):
            return Response({"error": "Thiếu username, email hoặc password."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({"error": "Email này đã được sử dụng."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"error": "Tên đăng nhập đã tồn tại."}, status=status.HTTP_400_BAD_REQUEST)
        User.objects.create(username=username, email=email, password=make_password(password), role="ThanhVien")
        return Response({"message": "Đăng ký thành công."}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        identifier = request.data.get("username") or request.data.get("email")
        password = request.data.get("password")
        user = User.objects.filter(Q(email=identifier) | Q(username=identifier)).first() if identifier else None

        if user is None or not check_password(password, user.password):
            return Response({"error": "Email hoặc mật khẩu không đúng."}, status=status.HTTP_401_UNAUTHORIZED)
        
        payload = {
            "uid": user.uid,
            "email": user.email,
            "role": user.role,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1),
            "iat": datetime.datetime.utcnow(),
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
        return Response({
            "message": "Đăng nhập thành công.",
            "token": token,
            "user_info": {"uid": user.uid, "username": user.username, "email": user.email, "role": user.role},
        }, status=status.HTTP_200_OK)

# --- BOOK & CHAPTER VIEWS ---

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "chapters", "newest"):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminRole()]

    def get_queryset(self):
        qs = Book.objects.all()
        # 1. TÍNH NĂNG LỌC SÁCH (SEARCH)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(author__icontains=search))
        
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
            
        return qs.order_by("-create_time")

    @action(detail=True, methods=["get"], url_path="chapters")
    def chapters(self, request, pk=None):
        book = self.get_object()
        return Response(ChapterListSerializer(book.chapters.all(), many=True).data)

    @action(detail=False, methods=["get"], url_path="newest")
    def newest(self, request):
        limit = int(request.query_params.get("limit", 10))
        qs = Book.objects.order_by("-create_time")[:limit]
        return Response(BookSerializer(qs, many=True).data)

class ChapterViewSet(viewsets.ModelViewSet):
    queryset = Chapter.objects.select_related("book").all()
    def get_serializer_class(self):
        return ChapterListSerializer if self.action == "list" else ChapterDetailSerializer
    def get_permissions(self):
        if self.action in ("list", "retrieve"): return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminRole()]
    def get_queryset(self):
        qs = super().get_queryset()
        book_id = self.request.query_params.get("book")
        if book_id: qs = qs.filter(book_id=book_id)
        return qs.order_by("book_id", "order")

# --- REVIEW & CONTACT VIEWS ---

class BookReviewViewSet(viewsets.ModelViewSet):
    queryset = BookReview.objects.select_related("user", "book").all()
    def get_serializer_class(self):
        if self.action == "create": return BookReviewWriteSerializer
        if self.action in ("update", "partial_update"): return BookReviewUpdateSerializer
        return BookReviewSerializer
    def get_permissions(self):
        if self.action in ("list", "retrieve"): return [permissions.AllowAny()]
        if self.action == "create": return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsReviewOwnerOrAdmin()]
    def get_queryset(self):
        qs = super().get_queryset()
        book_id = self.request.query_params.get("book")
        if book_id: qs = qs.filter(book_id=book_id)
        return qs
    def perform_create(self, serializer):
        review = serializer.save(user_id=self.request.user.uid)
        refresh_book_rating_stats(review.book_id)

class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    def get_permissions(self):
        if self.action == "create": return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminRole()]

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    def get_permissions(self): return [permissions.IsAuthenticated(), IsAdminRole()]

# --- BORROW SYSTEM (TRỌNG TÂM CẦN SỬA) ---

class BorrowViewSet(viewsets.ModelViewSet):
    queryset = Borrow.objects.all().order_by("-borrow_date")
    serializer_class = BorrowSerializer

    def get_permissions(self):
        if self.action in ["create", "list", "retrieve"]: return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsAdminRole()]

    def get_queryset(self):
        self.update_overdue_borrows()
        user = self.request.user
        if user.role == "Admin":
            return Borrow.objects.all().order_by("-borrow_date")
        return Borrow.objects.filter(user_id=user.uid).order_by("-borrow_date")

    def perform_create(self, serializer):
        # Mặc định lấy user đang đăng nhập
        user = self.request.user
        status_init = "ChoDuyet"
        
        # Nếu ADMIN tạo tại quầy (điền tên người mượn trực tiếp)
        if user.role == "Admin" and self.request.data.get("borrower_name"):
            status_init = "DangMuon" # Admin tạo là cho mượn luôn
        
        # Kiểm tra kho nếu trạng thái là DangMuon
        if status_init == "DangMuon":
            book_id = self.request.data.get("book")
            quantity = int(self.request.data.get("quantity", 1))
            if book_id:
                from .models import Book
                from rest_framework.exceptions import ValidationError
                book = Book.objects.filter(pk=book_id).first()
                if book and book.stock < quantity:
                    raise ValidationError({"error": f"Sách '{book.title}' không đủ số lượng tồn."})
                    
        borrow = serializer.save(user=user, status=status_init)
        
        # Trừ kho nếu mượn luôn (Admin tạo tại quầy)
        if status_init == "DangMuon":
            # Refresh để lấy details đã tạo trong serializer.create
            borrow.refresh_from_db()
            for detail in borrow.details.all():
                book = detail.book
                if book.stock >= detail.quantity:
                    book.stock -= detail.quantity
                    book.save()

    def partial_update(self, request, *args, **kwargs):
        borrow = self.get_object()
        new_status = request.data.get("status")
        old_status = borrow.status

        # Lưu các thay đổi khác thông qua serializer
        serializer = self.get_serializer(borrow, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Loại bỏ status khỏi serializer để tự xử lý logic
        if "status" in serializer.validated_data:
            serializer.validated_data.pop("status")
            
        borrow = serializer.save()
        borrow.refresh_from_db()

        # Nếu có cập nhật trạng thái
        if new_status and new_status != old_status:
            # 1. ADMIN DUYỆT / CHO MƯỢN: Trừ kho
            if new_status == "DangMuon" and old_status == "ChoDuyet":
                # Kiểm tra kho trước
                for detail in borrow.details.all():
                    if detail.book.stock < detail.quantity:
                        return Response({"error": f"Sách '{detail.book.title}' đã hết."}, status=400)
                
                # Trừ kho
                for detail in borrow.details.all():
                    book = detail.book
                    book.stock -= detail.quantity
                    book.save()
                    detail.status = "DangMuon"
                    detail.save()
                borrow.status = "DangMuon"

            # 2. XÁC NHẬN TRẢ: Cộng lại kho
            elif new_status == "DaTra" and old_status in ["DangMuon", "QuaHan", "ChoDuyetTra"]:
                for detail in borrow.details.all():
                    book = detail.book
                    book.stock += detail.quantity
                    book.save()
                    detail.status = "DaTra"
                    detail.save()
                borrow.status = "DaTra"
                borrow.return_date = timezone.now()
            
            # 3. YÊU CẦU TRẢ (Dành cho User)
            elif new_status == "ChoDuyetTra" and old_status in ["DangMuon", "QuaHan"]:
                borrow.status = "ChoDuyetTra"
                for detail in borrow.details.all():
                    detail.status = "ChoDuyetTra"
                    detail.save()

            # 3. SÁCH MẤT / QUỴT: Đưa vào danh sách đen, không cộng lại kho
            elif new_status in ["SachMat", "DanhSachDen"]:
                borrow.status = new_status
                if not borrow.admin_note:
                    borrow.admin_note = request.data.get("admin_note", "Vi phạm quy định / Làm mất sách")
                for detail in borrow.details.all():
                    detail.status = "MatSach"
                    detail.save()

            # 4. TỪ CHỐI / HỦY PHIẾU
            elif new_status == "TuChoi" and old_status == "ChoDuyet":
                borrow.status = "TuChoi"
                for detail in borrow.details.all():
                    detail.status = "TuChoi"
                    detail.save()
            
            else:
                borrow.status = new_status
                
            borrow.save()

        return Response(self.get_serializer(borrow).data)

    def update_overdue_borrows(self):
        now = timezone.now()
        # Tự động chuyển sang Quá Hạn
        Borrow.objects.filter(status="DangMuon", due_date__lt=now).update(status="QuaHan")