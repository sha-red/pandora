# -*- coding: utf-8 -*-
from __future__ import absolute_import

from django.conf.urls import url

from . import views

from . import actions
actions.autodiscover()

urlpatterns = [
    url(r'^$', views.api),
]
