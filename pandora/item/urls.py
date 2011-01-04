# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.conf.urls.defaults import *


urlpatterns = patterns("item.views",
    (r'^(?P<id>[A-Z0-9].*)/frame/(?P<size>\d+)/(?P<position>[0-9\.,]+).jpg$', 'frame'),
    (r'^(?P<id>[A-Z0-9].*)/(?P<profile>.*.webm)$', 'video'),
    (r'^(?P<id>[A-Z0-9].*)/(?P<profile>.*.mp4)$', 'video'),
    (r'^(?P<id>[A-Z0-9].*)/poster\.(?P<size>\d+)\.jpg$', 'poster'),
    (r'^(?P<id>[A-Z0-9].*)/poster\.(?P<size>large)\.jpg$', 'poster'),
    (r'^(?P<id>[A-Z0-9].*)/poster\.jpg$', 'poster'),
    (r'^(?P<id>[A-Z0-9].*)/icon\.(?P<size>\d+)\.jpg$', 'icon'),
    (r'^(?P<id>[A-Z0-9].*)/icon\.jpg$', 'icon'),
    (r'^(?P<id>[A-Z0-9].*)/timelines/(?P<timeline>.+)\.(?P<size>\d+)\.(?P<position>\d+)\.png$', 'timeline'),
)
