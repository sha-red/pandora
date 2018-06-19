# -*- coding: utf-8 -*-

from django.conf.urls.defaults import *


urlpatterns = patterns("user.views",
    (r'^preferences', 'preferences'),
    (r'^login', 'login'),
    (r'^logout', 'logout'),
    (r'^register', 'register'),
)

