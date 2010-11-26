# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.contrib import admin

import models

class ItemAdmin(admin.ModelAdmin):
    search_fields = ['itemId', 'data', 'external_data']
admin.site.register(models.Item, ItemAdmin)

class PropertyAdmin(admin.ModelAdmin):
    search_fields = ['name', 'title']
admin.site.register(models.Property, PropertyAdmin)


