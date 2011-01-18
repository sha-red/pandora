# Create your views here.
import models

def padma_video(request, hid, view=''):
    alias = get_object_or_404(models.IDAlias, old=hid)
    url = '/%s' % alias.new
    if view:
        url += '/' + {
        }.get(view, view)
    #FIXME: reqire layer urls, reqrite timerange urls
    raise redirect(url)

