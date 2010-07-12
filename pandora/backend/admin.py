# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.contrib import admin

#from forms import FileAdminForm, MovieAdminForm, ArchiveFileAdminForm
import models



'''
#class MovieImdbAdmin(admin.ModelAdmin):
#    search_fields = ['imdbId', 'title']
#admin.site.register(models.MovieImdb, MovieImdbAdmin)
class MovieImdbInline(admin.StackedInline):
    model = models.MovieImdb

class MovieOxdbInline(admin.StackedInline):
    model = models.MovieOxdb
'''

class MovieAdmin(admin.ModelAdmin):
    search_fields = ['movieId', 'imdb__title', 'oxdb__title']
    #form = MovieAdminForm
    #inlines = [MovieImdbInline, MovieOxdbInline]

admin.site.register(models.Movie, MovieAdmin)


