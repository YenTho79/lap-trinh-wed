"""
URL configuration for book_review project.
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # 1. Trang quản trị Django (mặc định)
    path('admin/', admin.site.urls),

    # 2. Kết nối tới các API em đã viết trong app 'api'
    # Các link sẽ có dạng: http://127.0.0.1:8000/api/login/, http://127.0.0.1:8000/api/media/ ...
    path('api/', include('api.urls')),

    # 3. HỆ THỐNG TÀI LIỆU SWAGGER (Dành cho bạn Frontend)
    # File cấu hình thô (JSON)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    
    # Giao diện Swagger UI (Đẹp và dễ dùng nhất - Khuyên dùng cái này)
    # Link: http://127.0.0.1:8000/api/docs/
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # Giao diện Redoc (Một kiểu hiển thị tài liệu khác, chuyên nghiệp không kém)
    # Link: http://127.0.0.1:8000/api/redoc/
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]