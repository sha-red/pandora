# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
# Django settings for pan.do/ra project defaults,
# create local_settings.py to overwrite
import os
from os.path import join, normpath

SITENAME = 'Pan.do/ra'
SITEID =   'pandora'
URL =      'pan.do/ra'

PROJECT_ROOT = os.path.normpath(os.path.dirname(__file__))

DEBUG = True
TEMPLATE_DEBUG = DEBUG
JSON_DEBUG = True

#with apache x-sendfile or lighttpd set this to True
XSENDFILE = False

#with nginx X-Accel-Redirect set this to True
XACCELREDIRECT = False

ADMINS = (
     #('admin', 'admin@example.com'),
)

DEFAULT_FROM_EMAIL='system@' + URL.split('/')[0]
#DEFAULT_FROM_EMAIL='admin@example.com'
SERVER_EMAIL=DEFAULT_FROM_EMAIL

MANAGERS = ADMINS

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


# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'Europe/Berlin'
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
TESTS_ROOT = join(PROJECT_ROOT, 'tests')

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

    'annotation',
    'clip',
    'archive',
    'event',
    'item',
    'itemlist',
    'person',
    'title',
    'place',
    'text',
    'edit',
    'news',
    'user',
    'api',
    'urlalias',
)

# A sample logging configuration. The only tangible logging
# performed by this configuration is to send an email to
# the site admins on every HTTP 500 error.
# See http://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler'
        }
    },
    'loggers': {
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
    }
}

AUTH_PROFILE_MODULE = 'user.UserProfile'


SITE_CONFIG = join(PROJECT_ROOT, '0xdb.jsonc')


TRACKER_URL="http://url2torrent.net:6970/announce"



DATA_SERVICE = ''
POSTER_PRECEDENCE = (
    'piratecinema.org',
    'local',
    'criterion.com',
    'wikipedia.org',
    'impawards.com',
    'movieposterdb.com',
    'imdb.com',
    'allmovie.com',
    'other'
)

#0xdb.org
USE_IMDB = True

#copy scripts and adjust to customize
ITEM_POSTER = join('scripts', 'oxdb_poster')
#ITEM_POSTER = join('scripts', 'padma_poster')
ITEM_ICON   = join('scripts', 'item_icon')
LIST_ICON   = join('scripts', 'list_icon')

#overwrite default settings with local settings
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

