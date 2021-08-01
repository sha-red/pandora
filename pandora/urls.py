# -*- coding: utf-8 -*-
import os
import importlib

from django.urls import path, re_path
from oxdjango.http import HttpFileResponse

from django.conf import settings
import django.views

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

import app.monkey_patch

import oxdjango.api.site

import app.views
import archive.views
import document.views
import documentcollection.views
import text.views
import user.views
import edit.views
import itemlist.views
import item.views
import item.site
import translation.views
import urlalias.views

def serve_static_file(path, location, content_type):
    return HttpFileResponse(location, content_type=content_type)

urlpatterns = [
    #path('admin/', admin.site.urls),

    re_path(r'^api/locale.(?P<lang>.*).json$', translation.views.locale_json),
    re_path(r'^api/upload/text/?$', text.views.upload),
    re_path(r'^api/upload/document/?$', document.views.upload),
    re_path(r'^api/upload/direct/?$', archive.views.direct_upload),
    re_path(r'^api/upload/?$', archive.views.firefogg_upload),
    re_path(r'^url=(?P<url>.*)$', app.views.redirect_url),
    re_path(r'^file/(?P<oshash>.*)$', archive.views.lookup_file),
    re_path(r'^api/?', oxdjango.api.site.urls),
    re_path(r'^resetUI$', user.views.reset_ui),
    re_path(r'^collection/(?P<id>.*?)/icon(?P<size>\d*).jpg$', documentcollection.views.icon),
    re_path(r'^documents/(?P<id>[A-Z0-9]+)/(?P<size>\d*)p(?P<page>[\d,]*).jpg$', document.views.thumbnail),
    re_path(r'^documents/(?P<id>[A-Z0-9]+)/(?P<name>.*?\.[^\d]{3})$', document.views.file),
    re_path(r'^edit/(?P<id>.*?)/icon(?P<size>\d*).jpg$', edit.views.icon),
    re_path(r'^list/(?P<id>.*?)/icon(?P<size>\d*).jpg$', itemlist.views.icon),
    re_path(r'^text/(?P<id>.*?)/icon(?P<size>\d*).jpg$', text.views.icon),
    re_path(r'^texts/(?P<id>.*?)/text.pdf$', text.views.pdf),
    re_path(r'^texts/(?P<id>.*?)/text.pdf.html$', text.views.pdf_viewer),
    re_path(r'^texts/$', text.views.text),
    re_path(r'^texts/(?P<id>.*?)/\d+$', text.views.text),
    re_path(r'^texts/(?P<id>.*?)$', text.views.text),
    re_path(r'^favicon.ico$', serve_static_file, {
        'location': os.path.join(settings.STATIC_ROOT, 'png/icon.16.png'),
        'content_type': 'image/x-icon'
    }),
    re_path(r'^opensearch.xml$', app.views.opensearch_xml),
    re_path(r'^oembed$', item.views.oembed),
    re_path(r'^atom.xml$', item.views.atom_xml),
    re_path(r'^robots.txt$', app.views.robots_txt),
    re_path(r'^sitemap.xml$', item.views.sitemap_xml),
    re_path(r'^sitemap(?P<part>\d+).xml$', item.views.sitemap_part_xml),
    path(r'', item.site.urls),
]
#sould this not be enabled by default? nginx should handle those
if settings.DEBUG:
    urlpatterns += [
        re_path(r'^data/(?P<path>.*)$', django.views.static.serve,
            {'document_root': settings.MEDIA_ROOT}),
        re_path(r'^static/(?P<path>.*)$', django.views.static.serve,
            {'document_root': settings.STATIC_ROOT}),
    ]

urlpatterns += [
    re_path(r'^(V[a-z0-9]+)$', urlalias.views.padma_video),
    re_path(r'^(V[a-z0-9]+/.*)$', urlalias.views.padma_video),
    re_path(r'^find$', urlalias.views.padma_find),
]
urlpatterns += [
    re_path(r'^(?P<id>[A-Z0-9x]+)/embed', app.views.embed),
    re_path(r'^(?P<id>[A-Z0-9x]+).*', item.views.item),
    re_path(r'^[a-z0-9].+$', app.views.index),
    re_path(r'^.*$', app.views.index),
    path(r'', app.views.index),
]

if settings.LOCAL_URLPATTERNS:
    patterns = []
    for pattern, fn in settings.LOCAL_URLPATTERNS:
        if isinstnace(fn, 'str'):
            m, f = fn.rsplit('.', 1)
            try:
                m = importlib.import_module(m)
            except ImportError:
                logger.error('failed to import urllib module: %s', fn, exc_info=True)
                continue
            fn = getattr(m, f)
            patterns.append(re_path(pattern, fn))
    urlpatterns = patterns + urlpatterns

