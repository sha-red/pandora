# -*- coding: utf-8 -*-

from django.contrib import admin

from . import models


class NewsAdmin(admin.ModelAdmin):
    search_fields = ['name', 'title']
admin.site.register(models.News, NewsAdmin)

