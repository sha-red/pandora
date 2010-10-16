# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os

from django.conf.urls.defaults import *
from oxdjango.http import HttpFileResponse

from django.conf import settings

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

def serve_static_file(path, location, content_type):
    return HttpFileResponse(location, content_type=content_type)

urlpatterns = patterns('',
    (r'^ajax_filtered_fields/', include('ajax_filtered_fields.urls')),
    (r'^api/upload/$', 'archive.views.firefogg_upload'),
    (r'^site.js$', 'app.views.site_js'),
    (r'^pandora.json$', 'app.views.pandora_json'),
    (r'^$', 'app.views.intro'),
    (r'^ra$', 'app.views.index'),
    (r'^timeline$', 'app.views.timeline'),
    (r'^file/(?P<oshash>.*)$', 'archive.views.lookup_file'),

    (r'^r/(?P<key>.*)$', 'user.views.recover'),
    (r'', include('backend.urls')),

    # Uncomment the admin/doc line below and add 'django.contrib.admindocs' 
    # to INSTALLED_APPS to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    (r'^admin/(.*)', include(admin.site.urls)),
    (r'^robots.txt$', serve_static_file, {'location': os.path.join(settings.STATIC_ROOT, 'robots.txt'), 'content_type': 'text/plain'}),
    (r'^favicon.ico$', serve_static_file, {'location': os.path.join(settings.STATIC_ROOT, 'png/icon.16.png'), 'content_type': 'image/x-icon'}),
)

if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve',
            {'document_root': settings.MEDIA_ROOT}),
        (r'^static/(?P<path>.*)$', 'django.views.static.serve',
            {'document_root': settings.STATIC_ROOT}),
        (r'^tests/(?P<path>.*)$', 'django.views.static.serve',
            {'document_root': settings.TESTS_ROOT}),
    )


