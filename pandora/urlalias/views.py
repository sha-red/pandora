# Create your views here.
from django.shortcuts import get_object_or_404, redirect

import models

def padma_video(request, url):
    url = url.split('/')
    hid = url[0]
    if len(url) > 1:
        view = url[1]
    else:
        view = None
    alias = get_object_or_404(models.IDAlias, old=hid)
    url = '/%s' % alias.new
    if view:
        url += '/' + {
            'editor': 'timeline',
        }.get(view, view)
    #FIXME: reqire layer urls, reqrite timerange urls
    return redirect(url)

