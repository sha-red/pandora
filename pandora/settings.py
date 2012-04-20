# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
# Django settings for pan.do/ra project defaults,
# create local_settings.py to overwrite
# check pan.do/ra section below for relevant settings

import os
from os.path import join, normpath

PROJECT_ROOT = os.path.normpath(os.path.dirname(__file__))

DEBUG = False
TEMPLATE_DEBUG = DEBUG
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

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = normpath(join(PROJECT_ROOT, '..', 'data'))
STATIC_ROOT = normpath(join(PROJECT_ROOT, '..', 'static'))
GEOIP_PATH = normpath(join(PROJECT_ROOT, '..', 'data', 'geo'))

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"

MEDIA_URL = '/data/'

STATIC_URL = '/static/'

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
ADMIN_MEDIA_PREFIX = '/admin/media/'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
    'django.template.loaders.eggs.Loader',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'ox.django.middleware.ExceptionMiddleware',
    'ox.django.middleware.ChromeFrameMiddleware',
)

ROOT_URLCONF = 'pandora.urls'

TEMPLATE_DIRS = (
    join(PROJECT_ROOT, 'templates'),
)

INSTALLED_APPS = (
    'monkey_patch',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.admin',
    'django.contrib.humanize',

    'django_extensions',
    'devserver',
#    'south',
    'djcelery',
    'app',
    'log',

    'annotation',
    'clip',
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
    'tv',
)

# Log errors into db
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'errors': {
            'level': 'ERROR',
            'class': 'pandora.log.utils.ErrorHandler'
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

AUTH_PROFILE_MODULE = 'user.UserProfile'

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
CELERY_RESULT_BACKEND = "database"
BROKER_HOST = "127.0.0.1"
BROKER_PORT = 5672
BROKER_USER = "pandora"
BROKER_PASSWORD = "box"
BROKER_VHOST = "/pandora"
SEND_CELERY_ERROR_EMAILS=False

#with apache x-sendfile or lighttpd set this to True
XSENDFILE = False

#with nginx X-Accel-Redirect set this to True
XACCELREDIRECT = False

SITE_CONFIG = join(PROJECT_ROOT, 'config.jsonc')

#used if CONFIG['video']['download'] is set
TRACKER_URL="udp://tracker.openbittorrent.com:80"

DATA_SERVICE = ''
POSTER_PRECEDENCE = ()

USE_IMDB = False

#if you set PAROT in VIDEO_PREFIX make sure cookies work accros subsomains
VIDEO_PREFIX=''
#VIDEO_PREFIX='videoPART.example.com'
#SESSION_COOKIE_DOMAIN=*.example.com"

SCRIPT_ROOT = normpath(join(PROJECT_ROOT, '..', 'scripts'))
#change script to customize
ITEM_POSTER = join(SCRIPT_ROOT, 'poster.py')
#ITEM_POSTER = join(SCRIPT_ROOT, 'padma_poster')
ITEM_ICON   = join(SCRIPT_ROOT, 'item_icon.py')
LIST_ICON   = join(SCRIPT_ROOT, 'list_icon.py')

DB_GIN_TRGM = False

#you can ignore things below this line
#=========================================================================

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
            from random import choice
            SECRET_KEY = ''.join([choice('abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)') for i in range(50)])
            secret = file(SECRET_FILE, 'w')
            secret.write(SECRET_KEY)
            secret.close()
        except IOError:
            Exception('Please create a %s file with random characters to generate your secret key!' % SECRET_FILE)

