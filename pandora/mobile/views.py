from django.conf import settings
from django.shortcuts import render

import ox


def index(request, fragment):
    from item.models import Item
    from edit.models import Edit
    from document.models import Document
    context = {}
    parts = fragment.split('/')
    if parts[0] in ('document', 'documents'):
        type = 'document'
        id = parts[1]
        page = None
        crop = None
        if len(parts) == 3:
            rect = parts[2].split(',')
            if len(rect) == 1:
                page = rect[0]
            else:
                crop = rect
        document = Document.objects.filter(id=ox.fromAZ(id)).first()
        if document and document.access(request.user):
            context['title'] = document.data['title']
            link = request.build_absolute_uri(document.get_absolute_url())
            # FIXME: get preview image or fragment parse from url
            public_id = ox.toAZ(document.id)
            preview = '/documents/%s/512p.jpg' % public_id
            if page:
                preview = '/documents/%s/512p%s.jpg' % (public_id, page)
            if crop:
                preview = '/documents/%s/512p%s.jpg' % (public_id, ','.join(crop))
            context['preview'] = request.build_absolute_uri(preview)

    elif parts[0] == 'edits':
        type = 'edit'
        id = parts[1]
        id = id.split(':')
        username = id[0]
        name = ":".join(id[1:])
        name = name.replace('_', ' ')
        edit = Edit.objects.filter(user__username=username, name=name).first()
        if edit and edit.accessible(request.user):
            link = request.build_absolute_uri('/m' + edit.get_absolute_url())
            context['title'] = name
            context['description'] = edit.description.split('\n\n')[0]
            # FIXME: use sort from parts if needed
            context['preview'] = request.build_absolute_uri(edit.get_clips().first().get_first_frame())
    else:
        type = 'item'
        id = parts[0]
        item = Item.objects.filter(public_id=id).first()
        if item and item.accessible(request.user):
            link = request.build_absolute_uri(item.get_absolute_url())
            if len(parts) > 1 and parts[1] in ('editor', 'player'):
                parts = [parts[0]] + parts[2:]
            if len(parts) > 1:
                inout = parts[1]
                if '-' in inout:
                    inout = inout.split('-')
                else:
                    inout = inout.split(',')
                inout = [ox.parse_timecode(p) for p in inout]
                if len(inout) == 3:
                    inout.pop(1)
                context['preview'] = link + '/480p%s.jpg' % inout[0]
            else:
                context['preview'] = link + '/480p.jpg'
            context['title'] = item.get('title')
    if context:
        context['url'] = request.build_absolute_uri('/m/' + fragment)
    context['settings'] = settings
    return render(request, "mobile/index.html", context)
