# -*- coding: utf-8 -*-
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
