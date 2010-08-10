# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.conf.urls.defaults import *


urlpatterns = patterns("backend.views",
    (r'^frame/(?P<id>.*)/(?P<position>.*)\.(?P<size>\d+).jpg$', 'frame'),
    (r'^stream/(?P<id>.*).(?P<quality>.*).ogv$', 'video'),
    (r'^$', 'api'),
)

