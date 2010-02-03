# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.conf.urls.defaults import *


urlpatterns = patterns("backend.views",
    (r'^upload/', 'firefogg_upload'),
    (r'^$', 'api'),
)

