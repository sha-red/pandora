# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.conf.urls.defaults import *


urlpatterns = patterns("user.views",
    (r'^preferences', 'api_preferences'),
    (r'^login', 'api_login'),
    (r'^logout', 'api_logout'),
    (r'^register', 'api_register'),
    (r'^recover', 'api_recover'),
)

