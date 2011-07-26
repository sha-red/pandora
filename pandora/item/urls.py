# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.conf.urls.defaults import *


urlpatterns = patterns("item.views",
    (r'^(?P<id>[A-Z0-9].*)/frame/(?P<size>\d+)/(?P<position>[0-9\.,]+).jpg$', 'frame'),
    (r'^(?P<id>[A-Z0-9].*)/frame/poster/(?P<position>\d+).jpg$', 'poster_frame'),
    (r'^(?P<id>[A-Z0-9].*)/(?P<oshash>[a-f0-9]+)/(?P<profile>.*\.(?P<format>webm|ogv|mp4))$', 'video'),
    (r'^(?P<id>[A-Z0-9][A-Za-z0-9]+)/torrent/(?P<filename>.*?)$', 'torrent'),
    (r'^(?P<id>[A-Z0-9].*)/(?P<profile>.*\.(?P<format>webm|ogv|mp4))$', 'video'),
    (r'^(?P<id>[A-Z0-9].*)/poster\.(?P<size>\d+)\.jpg$', 'poster'),
    (r'^(?P<id>[A-Z0-9].*)/poster\.(?P<size>large)\.jpg$', 'poster'),
    (r'^(?P<id>[A-Z0-9].*)/poster\.pandora\.jpg$', 'poster_local'),
    (r'^(?P<id>[A-Z0-9].*)/poster\.jpg$', 'poster'),
    (r'^(?P<id>[A-Z0-9].*)/icon\.(?P<size>\d+)\.jpg$', 'icon'),
    (r'^(?P<id>[A-Z0-9].*)/icon\.jpg$', 'icon'),
    (r'^(?P<id>[A-Z0-9].*)/timelines/(?P<timeline>.+)\.(?P<size>\d+)\.(?P<position>\d+)\.png$', 'timeline'),
    (r'^(?P<id>[A-Z0-9].*)/timeline\.(?P<size>\d+)\.png$', 'timeline_overview'),
)
