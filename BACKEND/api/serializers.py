from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Chapter

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff']

class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = '__all__'

class PostSerializer(serializers.ModelSerializer):
    # 1. Tạo một trường 'image' ảo lấy dữ liệu từ 'cover_filename' 
    # Điều này giúp FE gọi book.image là ra ảnh ngay
    image = serializers.ReadOnlyField(source='cover_filename') 
    
    # 2. Giữ nguyên bộ đếm chương cho Admin
    chapters_count = serializers.IntegerField(source='chapters.count', read_only=True)

    class Meta:
        model = Post
        fields = [
            'post_id', 
            'uid', 
            'title', 
            'content', 
            'rating', 
            'cover_filename', # Tên gốc trong DB
            'image',          # Tên để FE dễ dùng
            'status', 
            'create_time', 
            'update_time', 
            'chapters_count'
        ]