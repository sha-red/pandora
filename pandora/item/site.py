# -*- coding: utf-8 -*-

from django.urls import path, re_path

from . import views

urls = [
    [
        #frames
        re_path(r'^(?P<id>[A-Z0-9].*)/(?P<size>\d+)p(?P<position>[\d\.]*)\.jpg$', views.frame),

        #timelines
        re_path(r'^(?P<id>[A-Z0-9].*)/timeline(?P<mode>[a-z]*)(?P<size>\d+)p(?P<position>\d+)\.(?P<format>png|jpg)$', views.timeline),
        re_path(r'^(?P<id>[A-Z0-9].*)/timeline(?P<mode>[a-z]*)(?P<size>\d+)p\.(?P<format>png|jpg)$', views.timeline),

        #download
        re_path(r'^(?P<id>[A-Z0-9].*)/download$', views.download),
        re_path(r'^(?P<id>[A-Z0-9].*)/download/$', views.download),
        re_path(r'^(?P<id>[A-Z0-9].*)/download/source/(?P<part>\d+)?$', views.download_source),
        re_path(r'^(?P<id>[A-Z0-9].*)/download/(?P<resolution>\d+)p(?P<part>\d+)\.(?P<format>webm|ogv|mp4)$', views.download),
        re_path(r'^(?P<id>[A-Z0-9].*)/download/(?P<resolution>\d+)p\.(?P<format>webm|ogv|mp4)$', views.download),

        #video
        re_path(r'^(?P<id>[A-Z0-9].*)/(?P<resolution>\d+)p(?P<index>\d*)\.(?P<format>webm|ogv|mp4)$', views.video),
        re_path(r'^(?P<id>[A-Z0-9].*)/(?P<resolution>\d+)p(?P<index>\d*)\.(?P<track>.+)\.(?P<format>webm|ogv|mp4)$', views.video),

        #export
        re_path(r'^(?P<id>[A-Z0-9].*)/json$', views.item_json),
        re_path(r'^(?P<id>[A-Z0-9].*)/xml$', views.item_xml),

        #srt export
        re_path(r'^(?P<id>[A-Z0-9].*)/(?P<layer>.+)\.(?:(?P<language>.{2})\.)?(?P<ext>srt|vtt)$', views.srt),

        #icon
        re_path(r'^(?P<id>[A-Z0-9].*)/icon(?P<size>\d*)\.jpg$', views.icon),

        #poster
        re_path(r'^(?P<id>[A-Z0-9].*)/posterframe(?P<position>\d+).jpg$', views.poster_frame),
        re_path(r'^(?P<id>[A-Z0-9].*)/poster(?P<size>\d+)\.jpg$', views.poster),
        re_path(r'^(?P<id>[A-Z0-9].*)/siteposter(?P<size>\d*)\.jpg$', views.siteposter),
        re_path(r'^(?P<id>[A-Z0-9].*)/poster\.jpg$', views.siteposter),

        re_path(r'^random$', views.random_annotation),
    ],
    'item',
    'item',
]
