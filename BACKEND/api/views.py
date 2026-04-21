from rest_framework import generics, serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.db.models import Q 
from .models import User, Post, Chapter
from .serializers import UserSerializer, PostSerializer, ChapterSerializer

# --- QUẢN LÝ USER ---
class UserListCreate(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class UserDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'id'

    def perform_destroy(self, instance):
        if instance.is_superuser:
            raise serializers.ValidationError("Không thể xóa Superuser!")
        instance.delete()

# --- HÀM ĐĂNG KÝ (Cập nhật: Tách biệt Username và Email) ---
@api_view(['POST'])
def register_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')

    # 1. Kiểm tra đầu vào
    if not username or not password or not email:
        return Response({"message": "Vui lòng nhập đầy đủ thông tin (Username, Email, Password)!"}, status=400)

    # 2. Kiểm tra trùng Username
    if User.objects.filter(username=username).exists():
        return Response({"message": "Tên đăng nhập đã tồn tại!"}, status=400)

    # 3. Kiểm tra trùng Email
    if User.objects.filter(email=email).exists():
        return Response({"message": "Email này đã được sử dụng bởi một tài khoản khác!"}, status=400)

    try:
        # Tạo user mới (Django sẽ tự băm mật khẩu)
        user = User.objects.create_user(username=username, password=password, email=email)
        return Response({"message": "Đăng ký thành công!"}, status=201)
    except Exception as e:
        return Response({"message": f"Lỗi hệ thống: {str(e)}"}, status=500)

# --- HÀM ĐĂNG NHẬP (Giữ nguyên: Hỗ trợ cả Username/Email) ---
@api_view(['POST'])
def login_view(request):
    # Accept either username or email (frontend may send one or both)
    login_data = request.data.get('username') or request.data.get('email') or request.data.get('identifier')
    password = request.data.get('password')

    try:
        # Tìm user khớp với Username HOẶC Email
        print("[DEBUG] login_view request.data:", request.data)
        user_obj = User.objects.get(Q(username=login_data) | Q(email=login_data))
        # use Django's authenticate to validate password and backend
        user = authenticate(username=user_obj.username, password=password)
        print("[DEBUG] Found user_obj:", getattr(user_obj, 'username', None), "authenticate returned:", user is not None)
    except User.DoesNotExist:
        user = None

    if user is not None:
        # Build a simple response; in production replace with real JWT
        return Response({
            "token": "fake-jwt-token",
            "user_info": {
                "username": user.username,
                "email": user.email,
                "role": "admin" if user.is_staff else "user",
                "is_admin": bool(user.is_staff or user.is_superuser)
            },
            "message": "Đăng nhập thành công!"
        })
    else:
        return Response({"message": "Tài khoản hoặc mật khẩu không chính xác!"}, status=401)

# --- CÁC PHẦN KHÁC (Post, Chapter, Dashboard) GIỮ NGUYÊN ---
class PostListCreate(generics.ListCreateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer

class PostDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    lookup_field = 'post_id'

class ChapterListCreate(generics.ListCreateAPIView):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer

    def get_queryset(self):
        post_id = self.request.query_params.get('post_id')
        if post_id:
            return Chapter.objects.filter(post_id=post_id)
        return super().get_queryset()

class ChapterDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer
    lookup_field = 'chapter_id'

@api_view(['GET'])
def dashboard_stats(request):
    try:
        recent_posts = Post.objects.order_by('-post_id')[:2]
        recent_books_data = []
        for post in recent_posts:
            recent_books_data.append({
                "id": post.post_id,
                "title": post.title,
                "action": "Vừa được cập nhật",
                "time": post.create_time.strftime("%H:%M - %d/%m")
            })
        data = {
            "totalBooks": Post.objects.count(),
            "totalChapters": Chapter.objects.count(),
            "totalUsers": User.objects.count(),
            "pendingReviews": 0, 
            "recentBooks": recent_books_data
        }
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

    

    # Thêm vào cuối file api/views.py
class LatestPostsList(generics.ListAPIView):
    # Lấy 8 bài viết mới nhất, sắp xếp theo ID giảm dần
    queryset = Post.objects.all().order_by('-post_id')[:8]
    serializer_class = PostSerializer