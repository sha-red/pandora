# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os

from django.conf.urls.defaults import *
from ox.django.http import HttpFileResponse

from django.conf import settings

#gunicorn has issues with settings.CONFIG otherwise
import app.models

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

from api import actions
actions.autodiscover()

def serve_static_file(path, location, content_type):
    return HttpFileResponse(location, content_type=content_type)

urlpatterns = patterns('',
    (r'^admin/', include(admin.site.urls)),
    (r'^ajax_filtered_fields/', include('ajax_filtered_fields.urls')),
    (r'^api/upload/$', 'archive.views.firefogg_upload'),
    (r'^timeline$', 'app.views.timeline'),
    (r'^file/(?P<oshash>.*)$', 'archive.views.lookup_file'),
    (r'^api/$', include('api.urls')),
    (r'', include('item.urls')),
    (r'^list/(?P<id>.*?)/icon(?P<size>\d*).jpg$', 'itemlist.views.icon'),
    (r'^robots.txt$', serve_static_file, {'location': os.path.join(settings.STATIC_ROOT, 'robots.txt'), 'content_type': 'text/plain'}),
    (r'^favicon.ico$', serve_static_file, {'location': os.path.join(settings.STATIC_ROOT, 'png/icon.16.png'), 'content_type': 'image/x-icon'}),
)
if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^data/(?P<path>.*)$', 'django.views.static.serve',
            {'document_root': settings.MEDIA_ROOT}),
        (r'^static/(?P<path>.*)$', 'django.views.static.serve',
            {'document_root': settings.STATIC_ROOT}),
        (r'^tests/(?P<path>.*)$', 'django.views.static.serve',
            {'document_root': settings.TESTS_ROOT}),
    )

urlpatterns += patterns('',
    (r'^(V[a-z0-9]*)$', 'urlalias.views.padma_video'),
    (r'^(V[a-z0-9]*/.*)$', 'urlalias.views.padma_video'),
)
urlpatterns += patterns('',
    (r'^.*?embed$', 'app.views.embed'),
    (r'^[A-Z0-9].*$', 'app.views.index'),
    (r'^[a-z0-9].+$', 'app.views.index'),
    (r'^$', 'app.views.index'),
    (r'^.*$', 'app.views.index'),
)

urlpatterns += patterns('django.views.generic.simple',
    ('^ra$', 'redirect_to', {'url': '/'}),
)
