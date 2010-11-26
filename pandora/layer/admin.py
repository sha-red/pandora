# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.contrib import admin

import models


class BinAdmin(admin.ModelAdmin):
    search_fields = ['name', 'title']
admin.site.register(models.Bin, BinAdmin)

class LayerAdmin(admin.ModelAdmin):
    search_fields = ['name', 'title']
admin.site.register(models.Layer, LayerAdmin)

