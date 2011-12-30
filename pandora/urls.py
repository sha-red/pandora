# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os

from django.conf.urls.defaults import *
from ox.django.http import HttpFileResponse

from django.conf import settings

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

import monkey_patch.models

from api import actions
actions.autodiscover()

def serve_static_file(path, location, content_type):
    return HttpFileResponse(location, content_type=content_type)

urlpatterns = patterns('',
    (r'^admin/', include(admin.site.urls)),
    (r'^api/upload/$', 'archive.views.firefogg_upload'),
    (r'^url=(?P<url>.*)$', 'app.views.redirect_url'),
    (r'^file/(?P<oshash>.*)$', 'archive.views.lookup_file'),
    (r'^api$', include('api.urls')),
    (r'^api/$', include('api.urls')),
    (r'^resetUI$', 'user.views.reset_ui'),
    (r'^list/(?P<id>.*?)/icon(?P<size>\d*).jpg$', 'itemlist.views.icon'),
    (r'^robots.txt$', serve_static_file, {'location': os.path.join(settings.STATIC_ROOT, 'robots.txt'), 'content_type': 'text/plain'}),
    (r'^favicon.ico$', serve_static_file, {'location': os.path.join(settings.STATIC_ROOT, 'png/icon.16.png'), 'content_type': 'image/x-icon'}),
    (r'^opensearch.xml$', 'app.views.opensearch_xml'),
    (r'', include('item.urls')),
)
#if settings.DEBUG:
#sould this not be enabled by default? nginx should handle those
urlpatterns += patterns('',
    (r'^data/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT}),
    (r'^static/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.STATIC_ROOT}),
)

urlpatterns += patterns('',
    (r'^(V[a-z0-9]*)$', 'urlalias.views.padma_video'),
    (r'^(V[a-z0-9]*/.*)$', 'urlalias.views.padma_video'),
)
urlpatterns += patterns('',
    (r'^(?P<id>[A-Z0-9].+)/embed', 'app.views.embed'),
    (r'^[A-Z0-9].*$', 'app.views.index'),
    (r'^[a-z0-9].+$', 'app.views.index'),
    (r'^$', 'app.views.index'),
    (r'^.*$', 'app.views.index'),
)

urlpatterns += patterns('django.views.generic.simple',
    ('^ra$', 'redirect_to', {'url': '/'}),
)
