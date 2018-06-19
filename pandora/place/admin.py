# -*- coding: utf-8 -*-
from __future__ import division, print_function, absolute_import

from django.contrib import admin

from . import models


class PlaceAdmin(admin.ModelAdmin):
    search_fields = ['name']
admin.site.register(models.Place, PlaceAdmin)
