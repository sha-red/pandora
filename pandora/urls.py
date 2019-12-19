# -*- coding: utf-8 -*-
import os

from django.conf.urls import url, include
from oxdjango.http import HttpFileResponse

from django.conf import settings
import django.views

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

import app.monkey_patch

import oxdjango.api.urls

import app.views
import archive.views
import document.views
import documentcollection.views
import text.views
import user.views
import edit.views
import itemlist.views
import item.views
import item.urls
import translation.views
import urlalias.views

def serve_static_file(path, location, content_type):
    return HttpFileResponse(location, content_type=content_type)

urlpatterns = [
    # Uncomment the admin/doc line below to enable admin documentation:
    # urlurl(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^api/locale.(?P<lang>.*).json$', translation.views.locale_json),
    url(r'^api/upload/text/?$', text.views.upload),
    url(r'^api/upload/document/?$', document.views.upload),
    url(r'^api/upload/direct/?$', archive.views.direct_upload),
    url(r'^api/upload/?$', archive.views.firefogg_upload),
    url(r'^url=(?P<url>.*)$', app.views.redirect_url),
    url(r'^file/(?P<oshash>.*)$', archive.views.lookup_file),
    url(r'^api/?', include(oxdjango.api.urls)),
    url(r'^resetUI$', user.views.reset_ui),
    url(r'^collection/(?P<id>.*?)/icon(?P<size>\d*).jpg$', documentcollection.views.icon),
    url(r'^documents/(?P<id>[A-Z0-9]+)/(?P<size>\d*)p(?P<page>[\d,]*).jpg$', document.views.thumbnail),
    url(r'^documents/(?P<id>[A-Z0-9]+)/(?P<name>.*?\.[^\d]{3})$', document.views.file),
    url(r'^edit/(?P<id>.*?)/icon(?P<size>\d*).jpg$', edit.views.icon),
    url(r'^list/(?P<id>.*?)/icon(?P<size>\d*).jpg$', itemlist.views.icon),
    url(r'^text/(?P<id>.*?)/icon(?P<size>\d*).jpg$', text.views.icon),
    url(r'^texts/(?P<id>.*?)/text.pdf$', text.views.pdf),
    url(r'^texts/(?P<id>.*?)/text.pdf.html$', text.views.pdf_viewer),
    url(r'^texts/$', text.views.text),
    url(r'^texts/(?P<id>.*?)/\d+$', text.views.text),
    url(r'^texts/(?P<id>.*?)$', text.views.text),
    url(r'^favicon.ico$', serve_static_file, {
        'location': os.path.join(settings.STATIC_ROOT, 'png/icon.16.png'),
        'content_type': 'image/x-icon'
    }),
    url(r'^opensearch.xml$', app.views.opensearch_xml),
    url(r'^oembed$', item.views.oembed),
    url(r'^atom.xml$', item.views.atom_xml),
    url(r'^robots.txt$', app.views.robots_txt),
    url(r'^sitemap.xml$', item.views.sitemap_xml),
    url(r'^sitemap(?P<part>\d+).xml$', item.views.sitemap_part_xml),
    url(r'', include(item.urls)),
]
#sould this not be enabled by default? nginx should handle those
if settings.DEBUG:
    urlpatterns += [
        url(r'^data/(?P<path>.*)$', django.views.static.serve,
            {'document_root': settings.MEDIA_ROOT}),
        url(r'^static/(?P<path>.*)$', django.views.static.serve,
            {'document_root': settings.STATIC_ROOT}),
    ]

urlpatterns += [
    url(r'^(V[a-z0-9]+)$', urlalias.views.padma_video),
    url(r'^(V[a-z0-9]+/.*)$', urlalias.views.padma_video),
    url(r'^find$', urlalias.views.padma_find),
]
urlpatterns += [
    url(r'^(?P<id>[A-Z0-9x]+)/embed', app.views.embed),
    url(r'^(?P<id>[A-Z0-9x]+).*', item.views.item),
    url(r'^[a-z0-9].+$', app.views.index),
    url(r'^$', app.views.index),
    url(r'^.*$', app.views.index),
]

