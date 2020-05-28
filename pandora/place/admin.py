# -*- coding: utf-8 -*-

from django.contrib import admin

from . import models


class PlaceAdmin(admin.ModelAdmin):
    search_fields = ['name']
admin.site.register(models.Place, PlaceAdmin)
