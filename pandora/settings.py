# -*- coding: utf-8 -*-
# Django settings for pan.do/ra project defaults,
# create local_settings.py to overwrite
# check pan.do/ra section below for relevant settings
from __future__ import absolute_import

import os
from os.path import join, normpath, dirname

BASE_DIR = PROJECT_ROOT = normpath(dirname(__file__))
BIN_DIR = normpath(join(PROJECT_ROOT, '..', 'bin'))
if BIN_DIR not in os.environ['PATH']:
    os.environ['PATH'] = BIN_DIR + os.pathsep + os.environ['PATH']

DEBUG = False
JSON_DEBUG = False

#this gets set to all users in highest userLevel (app/config.py)
ADMINS = ()
MANAGERS = ADMINS



# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'UTC'

#TIME_ZONE = 'Asia/Kolkata'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True
APPEND_SLASH = False

# Uncomment this if you add https support.
# Also make sue to send https from your https vhost:
#    proxy_set_header X-Forwarded-Proto https;
#SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = normpath(join(PROJECT_ROOT, '..', 'data'))
MEDIA_URL = '/data/'

STATIC_ROOT = normpath(join(PROJECT_ROOT, '..', 'static'))
STATIC_URL = '/static/'

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    #'django.contrib.staticfiles.finders.DefaultStorageFinder',
)

GEOIP_PATH = normpath(join(PROJECT_ROOT, '..', 'data', 'geo'))
GOOGLE_API_KEY = None

WEBSOCKET = False
WEBSOCKET_PORT = 2622
WEBSOCKET_ADDRESS = '127.0.0.1'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            join(PROJECT_ROOT, 'templates'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'oxdjango.middleware.ExceptionMiddleware',
    'oxdjango.middleware.ChromeFrameMiddleware',
    'user.middleware.UpdateSession',
)

ROOT_URLCONF = 'urls'


INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',
    'django.contrib.humanize',

    'django_extensions',
    'django_celery_results',
    'app',
    'log',
    'annotation',
    'clip',
    'sequence',
    'archive',
    'event',
    'changelog',
    'item',
    'itemlist',
    'person',
    'title',
    'place',
    'text',
    'edit',
    'news',
    'user',
    'urlalias',
    'translation',
    'tv',
    'documentcollection',
    'document',
    'entity',
    'websocket',
    'taskqueue',
    'home',
)

# Log errors into db
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'errors': {
            'level': 'ERROR',
            'class': 'log.utils.ErrorHandler'
        }
    },
    'loggers': {
        'django.request': {
            'handlers': ['errors'],
            'level': 'ERROR',
            'propagate': True,
        },
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'cache',
    }
}

AUTH_PROFILE_MODULE = 'user.UserProfile'
AUTH_CHECK_USERNAME = True
FFMPEG = 'ffmpeg'
FFMPEG_SUPPORTS_VP9 = True
FFMPEG_DEBUG = False

#=========================================================================
#Pan.do/ra related settings settings
#to customize, create local_settings.py and overwrite keys

DATABASES = {
    'default': {
        'NAME': 'pandora',
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'USER': 'pandora',
        'PASSWORD': ''
    }
}

#rabbitmq connection settings
CELERY_RESULT_BACKEND = 'database'
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']

BROKER_URL = 'amqp://pandora:box@localhost:5672//pandora'

SEND_CELERY_ERROR_EMAILS = False

#with apache x-sendfile or lighttpd set this to True
XSENDFILE = False

#with nginx X-Accel-Redirect set this to True
XACCELREDIRECT = False

SITE_CONFIG = join(PROJECT_ROOT, 'config.jsonc')
DEFAULT_CONFIG = join(PROJECT_ROOT, 'config.pandora.jsonc')
RELOAD_CONFIG = False

#used if CONFIG['canDownloadVideo'] is set
TRACKER_URL = "udp://tracker.openbittorrent.com:80"

DATA_SERVICE = ''
POSTER_PRECEDENCE = ()
POSTER_ONLY_PORTRAIT = ()

USE_IMDB = False
ADDITIONAL_IMDB_KEYS = [
    'cast',
    'links', 'reviews', 'posters',
    'alternativeTitles', 'originalTitle',
    'filmingLocations',
    'isSeries', 'seriesTitle', 'seriesYear', 'series',
    'episodeTitle', 'episodeDirector', 'episodeYear', 'season', 'episode',
    'connections',
]

#If you set VIDEO_PREFIX make sure cookies work accros subsomains
#by setting SESSION_COOKIE_DOMAIN to ".domain.tld"
VIDEO_PREFIX = ''
#VIDEO_PREFIX = '//video{uid}.example.com'
MEDIA_PREFIX = ''
#VIDEO_PREFIX = '//media.example.com'
#SESSION_COOKIE_DOMAIN = '.example.com'
CDN_PREFIX = {}
# set video prefix baesd on country/region/continent
'''
CDN_PREFIX = {
    'India': {'media': 'https://media.in.example.com', 'video': 'https://{uid}.in.example.com'},
    'Northern Africa': {'media': 'https://media.eg.example.com', 'video': 'https://{uid}.eg.example.com'},
}
'''

SESSION_COOKIE_AGE = 60*24*60*60

# Extend cookie age if session is older
SESSION_UPDATE = 24*60*60

SCRIPT_ROOT = normpath(join(PROJECT_ROOT, '..', 'scripts'))
#change script to customize
ITEM_POSTER = join(SCRIPT_ROOT, 'poster.py')
ITEM_ICON = join(SCRIPT_ROOT, 'item_icon.py')
LIST_ICON = join(SCRIPT_ROOT, 'list_icon.py')
COLLECTION_ICON = join(SCRIPT_ROOT, 'list_icon.py')

DB_GIN_TRGM = False


RELOADER_RUNNING = False
#you can ignore things below this line
#=========================================================================
LOCAL_APPS = []
#load installation specific settings from local_settings.py
try:
    from local_settings import *
except ImportError:
    pass

# Make this unique, creates random key first at first time.
try:
    SECRET_KEY
except NameError:
    SECRET_FILE = os.path.join(PROJECT_ROOT, 'secret.txt')
    try:
        SECRET_KEY = open(SECRET_FILE).read().strip()
    except IOError:
        try:
            from django.utils.crypto import get_random_string
            chars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)'
            SECRET_KEY = get_random_string(50, chars)
            secret = open(SECRET_FILE, 'w')
            secret.write(SECRET_KEY)
            secret.close()
        except IOError:
            raise Exception('Please create a %s file with random characters to generate your secret key!' % SECRET_FILE)

INSTALLED_APPS = tuple(list(INSTALLED_APPS) + LOCAL_APPS)

ALLOWED_HOSTS = ['*']
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

DATA_UPLOAD_MAX_MEMORY_SIZE = 32 * 1024 * 1024
