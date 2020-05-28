# -*- coding: utf-8 -*-

from django.contrib import admin

from . import models


class PageAdmin(admin.ModelAdmin):
    search_fields = ['name', 'body']

admin.site.register(models.Page, PageAdmin)

