from ajax_filtered_fields.forms import ForeignKeyByLetter
from django.conf import settings
from django import forms

import models

ajax_filtered_js = (
    settings.ADMIN_MEDIA_PREFIX + "js/SelectBox.js",
    settings.ADMIN_MEDIA_PREFIX + "js/SelectFilter2.js",
    settings.STATIC_URL + 'js/jquery/jquery.js',
    settings.STATIC_URL + 'js/ajax_filtered_fields.js',
)


class FileAdminForm(forms.ModelForm):
    item = ForeignKeyByLetter(models.Item, field_name='itemId')

    class Meta:
        model = models.File

    class Media:
        js = ajax_filtered_js


class InstanceAdminForm(forms.ModelForm):
    file = ForeignKeyByLetter(models.File, field_name='name')

    class Meta:
        model = models.Instance

    class Media:
        js = ajax_filtered_js
