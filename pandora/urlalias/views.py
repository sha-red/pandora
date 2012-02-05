# Create your views here.
from django.shortcuts import get_object_or_404, redirect

import models

def padma_video(request, url):
    url = url.split('/')
    hid = url[0]
    view = None
    layer = None
    if len(url) > 1:
        view = url[1]
        if len(url) > 2:
            layer = url[2]
        elif view.startswith('L'):
            layer = view
            view = None
    if layer:
        alias = get_object_or_404(models.LayerAlias, old=layer)
        url = '/%s' % alias.new
    else:
        alias = get_object_or_404(models.IDAlias, old=hid)
        url = '/%s' % alias.new
    if view:
        url += '/' + {
            'editor': 'timeline',
        }.get(view, view)
    #FIXME: reqrite layer urls
    #FIXME: rewrite timerange urls
    return redirect(url)

