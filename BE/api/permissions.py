from rest_framework import permissions


def _is_admin(user):
    return bool(user and getattr(user, "is_authenticated", False) and user.role == "Admin")


class IsAdminRole(permissions.BasePermission):
    """Chỉ tài khoản có vai_tro = Admin (theo CSDL mẫu)."""

    def has_permission(self, request, view):
        return _is_admin(request.user)


class IsReviewOwnerOrAdmin(permissions.BasePermission):
    """Sửa/xóa đánh giá: chủ sở hữu hoặc Admin."""

    def has_object_permission(self, request, view, obj):
        if _is_admin(request.user):
            return True
        if not getattr(request.user, "is_authenticated", False):
            return False
        owner_id = getattr(obj, "user_id", None)
        return owner_id is not None and owner_id == request.user.uid
