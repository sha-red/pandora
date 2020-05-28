# -*- coding: utf-8 -*-
from __future__ import absolute_import

from django.urls import path

from . import views

from . import actions
actions.autodiscover()

urls = [
    [
        path(r'', views.api),
    ],
    'api',
    'api'
]
