# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.conf.urls.defaults import *


urlpatterns = patterns("item.views",
    (r'^(?P<id>.*)/frame/(?P<size>\d+)/(?P<position>[0-9\.,]+).jpg$', 'frame'),
    (r'^(?P<id>.*)/(?P<profile>.*.webm)$', 'video'),
    (r'^(?P<id>.*)/(?P<profile>.*.mp4)$', 'video'),
    (r'^(?P<id>.*)/poster\.(?P<size>\d+)\.jpg$', 'poster'),
    (r'^(?P<id>.*)/poster\.(?P<size>large)\.jpg$', 'poster'),
    (r'^(?P<id>.*)/poster\.jpg$', 'poster'),
    (r'^(?P<id>.*)/timelines/(?P<timeline>.+)\.(?P<size>\d+)\.(?P<position>\d+)\.png$', 'timeline'),
)

