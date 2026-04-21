from django.db import models
from django.contrib.auth.models import User

# 1. Thêm Profile để lưu Avatar cho User
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    # Lưu tên file avatar (ví dụ: "1.jpg", "2.jpeg")
    avatar_filename = models.CharField(max_length=255, default="1.jpg", blank=True, null=True)

    def __str__(self):
        return f"Profile của {self.user.username}"

# 2. Model Post gộp thêm trường Cover ảnh sách
class Post(models.Model):
    post_id = models.AutoField(primary_key=True)
    uid = models.ForeignKey(User, on_delete=models.CASCADE, db_column='uid', blank=True, null=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    rating = models.IntegerField(blank=True, null=True)
    # Lưu tên file cover sách (ví dụ: "harry.jpg", "chata.jpg")
    cover_filename = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=50, blank=True, null=True)
    create_time = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

# 3. Model Media (giữ nguyên của bạn)
class Media(models.Model):
    media_id = models.AutoField(primary_key=True)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, blank=True, null=True)
    media_type = models.CharField(max_length=50)
    media_url = models.CharField(max_length=255)

# 4. Model Chapter - Lưu nội dung từng chương truyện
class Chapter(models.Model):
    chapter_id = models.AutoField(primary_key=True)
    # Liên kết với Post, khi xóa Post thì Chapter tự động xóa theo (CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='chapters')
    title = models.CharField(max_length=255)
    content = models.TextField()
    # Thứ tự chương (ví dụ: 1, 2, 3...)
    order = models.IntegerField(default=1)
    create_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Tự động sắp xếp chương theo số thứ tự tăng dần
        ordering = ['order']

    def __str__(self):
        return f"{self.post.title} - {self.title}"