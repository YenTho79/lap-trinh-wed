from django.contrib import admin
from .models import Post, UserProfile, Media

# Đăng ký các Model để chúng hiện lên trong trang quản trị /admin/
admin.site.register(Post)
admin.site.register(UserProfile)
admin.site.register(Media)