from ajax_filtered_fields.forms import AjaxManyToManyField, ForeignKeyByLetter
from django.conf import settings
from django import forms

import models

ajax_filtered_js = (
    settings.ADMIN_MEDIA_PREFIX + "js/SelectBox.js",
    settings.ADMIN_MEDIA_PREFIX + "js/SelectFilter2.js",
    settings.STATIC_URL + 'js/jquery/jquery.js',
    settings.STATIC_URL + 'js/ajax_filtered_fields.js',
)
"""
class FileAdminForm(forms.ModelForm):
    movie = ForeignKeyByLetter(models.Movie, field_name='imdb__title')

    class Meta:
        model = models.File

    class Media:
        js = ajax_filtered_js

class ArchiveFileAdminForm(forms.ModelForm):
    file = ForeignKeyByLetter(models.File, field_name='path')

    class Meta:
        model = models.ArchiveFile

    class Media:
        js = ajax_filtered_js


class MovieAdminForm(forms.ModelForm):
    imdb = ForeignKeyByLetter(models.MovieImdb, field_name='title')
    oxdb = ForeignKeyByLetter(models.MovieOxdb, field_name='title')

    class Meta:
        model = models.Movie

    class Media:
        js = ajax_filtered_js
"""
