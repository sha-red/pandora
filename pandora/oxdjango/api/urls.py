# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import absolute_import

from django.conf.urls import url

from . import views

from . import actions
actions.autodiscover()

urlpatterns = [
    url(r'^$', views.api),
]
