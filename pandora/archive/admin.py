# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.contrib import admin

#from forms import FileAdminForm, ItemAdminForm, ArchiveFileAdminForm
import models

class FileAdmin(admin.ModelAdmin):
    search_fields = ['path', 'video_codec']

    #form = FileAdminForm

admin.site.register(models.File, FileAdmin)

class FileInstanceAdmin(admin.ModelAdmin):
    search_fields = ['path', 'volume__name']
    #form = ArchiveFileAdminForm

admin.site.register(models.FileInstance, FileInstanceAdmin)

