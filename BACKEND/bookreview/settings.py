from pathlib import Path

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-a_na+cy@1@cvg7hujggym&^y86ljg)3w@typdtto(4obw%7bgw'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

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
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', # Thêm dòng này để hỗ trợ Frontend
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Cho phép tất cả các nguồn truy cập (để bạn Frontend test cho dễ)
CORS_ALLOW_ALL_ORIGINS = True 

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

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

WSGI_APPLICATION = 'bookreview.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.models.fields.related.ForeignKey', # Dòng này giữ nguyên chuẩn Django
        'ENGINE': 'django.db.backends.mysql', 
        'NAME': 'bookreviewdb_v2',      # Tên Database trong phpMyAdmin của bạn
        'USER': 'root',                 # Thường là root
        'PASSWORD': '',                 # Mật khẩu (để trống nếu dùng XAMPP mặc định)
        'HOST': '127.0.0.1',            # Hoặc 'localhost'
        'PORT': '3306',                 # Cổng mặc định của MySQL/MariaDB
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}

# Cấu hình Django Rest Framework & Swagger
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Hệ thống Review Sách API',
    'DESCRIPTION': 'Tài liệu API dành cho Frontend - Adim Hải Yến',
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

