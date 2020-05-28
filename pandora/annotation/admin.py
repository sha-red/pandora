# -*- coding: utf-8 -*-

from django.contrib import admin

from . import models


class AnnotationAdmin(admin.ModelAdmin):
    search_fields = ['name', 'title']
admin.site.register(models.Annotation, AnnotationAdmin)

