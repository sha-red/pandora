# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, print_function, absolute_import

from django.contrib import admin

from . import models


class PageAdmin(admin.ModelAdmin):
    search_fields = ['name', 'body']

admin.site.register(models.Page, PageAdmin)

