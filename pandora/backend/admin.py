# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.contrib import admin

#from forms import FileAdminForm, ItemAdminForm, ArchiveFileAdminForm
import models



'''
#class ItemImdbAdmin(admin.ModelAdmin):
#    search_fields = ['imdbId', 'title']
#admin.site.register(models.ItemImdb, ItemImdbAdmin)
class ItemImdbInline(admin.StackedInline):
    model = models.ItemImdb

class ItemOxdbInline(admin.StackedInline):
    model = models.ItemOxdb
'''

class ItemAdmin(admin.ModelAdmin):
    search_fields = ['itemId', 'imdb__title', 'oxdb__title']
    #form = ItemAdminForm
    #inlines = [ItemImdbInline, ItemOxdbInline]

admin.site.register(models.Item, ItemAdmin)


