# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.contrib import admin

from forms import FileAdminForm, InstanceAdminForm
import models


class FileAdmin(admin.ModelAdmin):
    search_fields = ['name', 'folder','oshash', 'video_codec']
    list_display = ['available', 'is_main', '__unicode__', 'itemId']
    list_display_links = ('__unicode__', )

    def itemId(self, obj):
        return '%s'%(obj.item.itemId)

    form = FileAdminForm

admin.site.register(models.File, FileAdmin)


class InstanceAdmin(admin.ModelAdmin):
    search_fields = ['name', 'folder', 'volume__name', 'file__oshash']
    form = InstanceAdminForm

admin.site.register(models.Instance, InstanceAdmin)
