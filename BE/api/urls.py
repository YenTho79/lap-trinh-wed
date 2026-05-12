from django.urls import include, path
from rest_framework.routers import DefaultRouter
from api.views import BorrowViewSet

from .views import (
    BookReviewViewSet,
    BookViewSet,
    ChapterViewSet,
    ContactMessageViewSet,
    LoginView,
    RegisterView,
    UserViewSet,
)

router = DefaultRouter()
router.register(r"books", BookViewSet, basename="book")
router.register(r"borrows", BorrowViewSet, basename="borrows")
router.register(r"chapters", ChapterViewSet, basename="chapter")
router.register(r"reviews", BookReviewViewSet, basename="review")
router.register(r"contact-messages", ContactMessageViewSet, basename="contact")
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("", include(router.urls)),
]
