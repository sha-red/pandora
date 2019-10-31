# -*- coding: utf-8 -*-

from django.conf.urls import url

from . import views

urlpatterns = [
    #frames
    url(r'^(?P<id>[A-Z0-9].*)/(?P<size>\d+)p(?P<position>[\d\.]*)\.jpg$', views.frame),

    #timelines
    url(r'^(?P<id>[A-Z0-9].*)/timeline(?P<mode>[a-z]*)(?P<size>\d+)p(?P<position>\d+)\.(?P<format>png|jpg)$', views.timeline),
    url(r'^(?P<id>[A-Z0-9].*)/timeline(?P<mode>[a-z]*)(?P<size>\d+)p\.(?P<format>png|jpg)$', views.timeline),

    #download
    url(r'^(?P<id>[A-Z0-9].*)/download$', views.download),
    url(r'^(?P<id>[A-Z0-9].*)/download/$', views.download),
    url(r'^(?P<id>[A-Z0-9].*)/download/source/(?P<part>\d+)?$', views.download_source),
    url(r'^(?P<id>[A-Z0-9].*)/download/(?P<resolution>\d+)p(?P<part>\d+)\.(?P<format>webm|ogv|mp4)$', views.download),
    url(r'^(?P<id>[A-Z0-9].*)/download/(?P<resolution>\d+)p\.(?P<format>webm|ogv|mp4)$', views.download),

    #video
    url(r'^(?P<id>[A-Z0-9].*)/(?P<resolution>\d+)p(?P<index>\d*)\.(?P<format>webm|ogv|mp4)$', views.video),
    url(r'^(?P<id>[A-Z0-9].*)/(?P<resolution>\d+)p(?P<index>\d*)\.(?P<track>.+)\.(?P<format>webm|ogv|mp4)$', views.video),

    #torrent
    url(r'^(?P<id>[A-Z0-9].*)/torrent$', views.torrent),
    url(r'^(?P<id>[A-Z0-9].*)/torrent/(?P<filename>.*?)$', views.torrent),

    #export
    url(r'^(?P<id>[A-Z0-9].*)/json$', views.item_json),
    url(r'^(?P<id>[A-Z0-9].*)/xml$', views.item_xml),

    #srt export
    url(r'^(?P<id>[A-Z0-9].*)/(?P<layer>.+)\.(?:(?P<language>.{2})\.)?(?P<ext>srt|vtt)$', views.srt),

    #icon
    url(r'^(?P<id>[A-Z0-9].*)/icon(?P<size>\d*)\.jpg$', views.icon),

    #poster
    url(r'^(?P<id>[A-Z0-9].*)/posterframe(?P<position>\d+).jpg$', views.poster_frame),
    url(r'^(?P<id>[A-Z0-9].*)/poster(?P<size>\d+)\.jpg$', views.poster),
    url(r'^(?P<id>[A-Z0-9].*)/siteposter(?P<size>\d*)\.jpg$', views.siteposter),
    url(r'^(?P<id>[A-Z0-9].*)/poster\.jpg$', views.siteposter),

    url(r'^random$', views.random_annotation),
]
