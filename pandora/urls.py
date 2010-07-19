from django.conf.urls.defaults import *

from django.conf import settings

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()


urlpatterns = patterns('',
    # Example:
    (r'^ajax_filtered_fields/', include('ajax_filtered_fields.urls')),
    (r'^api/', include('backend.urls')),
    (r'^site.js$', 'app.views.site_js'),
    (r'^$', 'app.views.index'),
    (r'^r/(?P<key>.*)$', 'oxuser.views.recover'),

    # Uncomment the admin/doc line below and add 'django.contrib.admindocs' 
    # to INSTALLED_APPS to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    (r'^admin/(.*)', include(admin.site.urls)),
)

if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve',
            {'document_root': settings.MEDIA_ROOT}),
        (r'^static/(?P<path>.*)$', 'django.views.static.serve',
            {'document_root': settings.STATIC_ROOT}),
        (r'^tests/(?P<path>.*)$', 'django.views.static.serve',
            {'document_root': settings.TESTS_ROOT}),
    )


