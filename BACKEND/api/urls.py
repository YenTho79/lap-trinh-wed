from django.urls import path
from .views import (
    UserListCreate, UserDetail, 
    PostListCreate, PostDetail, 
    ChapterListCreate, ChapterDetail,
    LatestPostsList,  # Kiểm tra dòng này
    login_view, register_view, dashboard_stats
)

urlpatterns = [
    # --- XÁC THỰC (Auth) ---
    path('register/', register_view, name='register'),
    path('login/', login_view, name='login'), 
    
    # --- THÀNH VIÊN (Users) ---
    path('users/', UserListCreate.as_view(), name='user-list'),
    path('users/<int:id>/', UserDetail.as_view(), name='user-detail'), 
    
    # --- SÁCH & BÀI VIẾT (Posts) ---
    path('posts/', PostListCreate.as_view(), name='post-list'),
    path('posts/<int:post_id>/', PostDetail.as_view(), name='post-detail'),
    # API Sách mới nhất để hiện thị ở trang chủ
    path('posts/latest/', LatestPostsList.as_view(), name='latest-posts'),

    # --- CHƯƠNG TRUYỆN (Chapters) ---
    path('chapters/', ChapterListCreate.as_view(), name='chapter-list'),
    path('chapters/<int:chapter_id>/', ChapterDetail.as_view(), name='chapter-detail'),
    
    # --- HỆ THỐNG & THỐNG KÊ (Admin Dashboard) ---
    path('dashboard-stats/', dashboard_stats, name='dashboard-stats'),
]