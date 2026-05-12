import os
from pathlib import Path

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-a_na+cy@1@cvg7hujggym&^y86ljg)3w@typdtto(4obw%7bgw'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Mọi Host (localhost, LAN, ngrok, Vercel preview, …). Có thể thu hẹp khi deploy thật.
ALLOWED_HOSTS = ['*']

# Chỉ bật khi API chạy sau proxy tin cậy (ngrok, nginx, load balancer).
# Local trực tiếp runserver: để tắt (mặc định) — tránh client giả mạo X-Forwarded-*.
# Khi dùng ngrok: set DJANGO_BEHIND_PROXY=1 (PowerShell: $env:DJANGO_BEHIND_PROXY="1")
_BEHIND_PROXY = os.environ.get('DJANGO_BEHIND_PROXY', '').lower() in ('1', 'true', 'yes')
USE_X_FORWARDED_HOST = _BEHIND_PROXY
if _BEHIND_PROXY:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Thư viện hỗ trợ
    'rest_framework',
    'drf_spectacular', # Thư viện Swagger xịn xò
    'corsheaders',      # Giúp bạn Frontend gọi API không bị lỗi CORS
    
    # App của em
    'api',
]

MIDDLEWARE = [
    # CorsMiddleware nên đứng cao (trước CommonMiddleware) để mọi response có header CORS đúng
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# --- CORS: chấp nhận mọi domain FE (dev, ngrok, preview, …) ---
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = False  # bắt buộc False khi dùng ALLOW_ALL (theo chuẩn CORS)
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'ngrok-skip-browser-warning',  # một số phiên bản ngrok cần header này từ FE
]

# CSRF: Django không cho wildcard; JWT API của DRF không dùng cookie CSRF.
# Cần khi vào /admin/ hoặc form session qua URL lạ (ngrok). Thêm qua env, ví dụ:
#   set CSRF_TRUSTED_ORIGINS=https://abc123.ngrok-free.app,http://localhost:5173
CSRF_TRUSTED_ORIGINS = []
_env_csrf = os.environ.get('CSRF_TRUSTED_ORIGINS', '').strip()
if _env_csrf:
    CSRF_TRUSTED_ORIGINS.extend(
        o.strip() for o in _env_csrf.split(',') if o.strip()
    )
if DEBUG:
    CSRF_TRUSTED_ORIGINS.extend(
        [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:4200',
            'http://127.0.0.1:4200',
            'http://localhost:8000',
            'http://127.0.0.1:8000',
        ]
    )
# Tránh trùng lặp
CSRF_TRUSTED_ORIGINS = list(dict.fromkeys(CSRF_TRUSTED_ORIGINS))

ROOT_URLCONF = 'bookreview.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'bookreview.wsgi.application'

# Database MySQL của em
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'bookreviewdb_v2',
        'USER': 'root',
        'PASSWORD': '',  # XAMPP mặc định để trống
        'HOST': '127.0.0.1',
        'PORT': '3306',
    }
}

# Cấu hình Django Rest Framework & Swagger
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api.authentication.JWTAuthentication',
    ],
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Hệ thống Review Sách API',
    'DESCRIPTION': 'API - Yến Thơ',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Ho_Chi_Minh' # Đổi sang giờ VN cho chuẩn
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'