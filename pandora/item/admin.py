# -*- coding: utf-8 -*-
from __future__ import division, print_function, absolute_import

from django.contrib import admin

from . import models


class ItemAdmin(admin.ModelAdmin):
    search_fields = ['public_id', 'data', 'external_data']
    list_display = ['rendered', 'public_id', '__str__']
    list_display_links = ('__str__', )

admin.site.register(models.Item, ItemAdmin)

