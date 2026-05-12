import jwt
from django.conf import settings
from rest_framework import authentication, exceptions

class JWTAuthentication(authentication.BaseAuthentication):
    """Đọc header Authorization: Bearer <token> và lấy User thật từ DB."""

    keyword = b"Bearer"

    def authenticate(self, request):
        header = authentication.get_authorization_header(request)
        
        if not header or not header.startswith(self.keyword + b" "):
            return None

        raw = header[len(self.keyword) :].strip()
        if not raw:
            return None

        try:
            token = raw.decode("utf-8")
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"],
                options={"require": ["exp", "iat"]},
            )
        except jwt.PyJWTError:
            raise exceptions.AuthenticationFailed("Token không hợp lệ hoặc đã hết hạn.")

        uid = payload.get("uid")
        if uid is None:
            raise exceptions.AuthenticationFailed("Token thiếu thông tin người dùng.")

        # --- FIX LỖI CIRCULAR IMPORT TẠI ĐÂY ---
        # Thay vì import ở đầu file, ta import ở đây để phá vỡ vòng lặp
        from .models import User 
        
        try:
            user = User.objects.get(uid=uid)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed("Người dùng không tồn tại trên hệ thống.")

        return (user, token)

    def authenticate_header(self, request):
        return self.keyword.decode('utf-8')