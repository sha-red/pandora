# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.contrib import admin

#from forms import FileAdminForm, MovieAdminForm, ArchiveFileAdminForm
import models

class FileAdmin(admin.ModelAdmin):
    search_fields = ['path', 'video_codec']

    #form = FileAdminForm

admin.site.register(models.File, FileAdmin)

class FileInstanceAdmin(admin.ModelAdmin):
    search_fields = ['path', 'archive__name']
    #form = ArchiveFileAdminForm

admin.site.register(models.FileInstance, FileInstanceAdmin)

class ArchiveAdmin(admin.ModelAdmin):
    search_fields = ['name']
admin.site.register(models.Archive, ArchiveAdmin)

