# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.conf.urls.defaults import *


urlpatterns = patterns("item.views",
    #frames
    (r'^(?P<id>[A-Z0-9].+)/(?P<size>\d+)p(?P<position>[\d\.]*)\.jpg$', 'frame'),

    #timelines
    (r'^(?P<id>[A-Z0-9].+)/timeline(?P<size>\d+)p(?P<position>\d+)\.png$', 'timeline'),
    (r'^(?P<id>[A-Z0-9].+)/timeline(?P<size>\d+)p\.png$', 'timeline_overview'),

    #video
    (r'^(?P<id>[A-Z0-9].+)/(?P<resolution>\d+)p(?P<index>\d*)\.(?P<format>webm|ogv|mp4)$', 'video'),

    #torrent
    (r'^(?P<id>[A-Z0-9][A-Za-z0-9]+)/torrent/(?P<filename>.*?)$', 'torrent'),

    #icon
    (r'^(?P<id>[A-Z0-9].+)/icon(?P<size>\d*)\.jpg$', 'icon'),

    #poster
    (r'^(?P<id>[A-Z0-9].+)/poster(?P<size>\d+)\.jpg$', 'poster'),
    (r'^(?P<id>[A-Z0-9].+)/siteposter(?P<size>\d+)\.jpg$', 'siteposter'),
    (r'^(?P<id>[A-Z0-9].+)/poster\.jpg$', 'siteposter'),
    (r'^(?P<id>[A-Z0-9].+)/frameposter(?P<position>\d+).jpg$', 'poster_frame'),

    
)
