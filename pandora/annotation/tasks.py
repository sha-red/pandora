# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import json
import ox

from django.conf import settings
from celery.task import task

import models


@task(ignore_results=True, queue='default')
def update_matches(id, type):
    if type == 'place':
        from place.models import Place as Model
    elif type == 'event':
        from event.models import Event as Model

    a = models.Annotation.objects.get(pk=id)
    a_matches = getattr(a, type == 'place' and 'places' or 'events')

    #remove undefined matches that only have this annotation
    for p in a_matches.filter(defined=False).exclude(name=a.value):
        if p.annotations.exclude(id=id).count() == 0:
            p.delete()
    if a.get_layer().get('type') == type and a_matches.count() == 0:
        a.places.add(Model.get_or_create(a.value))
        for p in a_matches.all():
            p.update_matches()
    
    if a.findvalue:
        names = {}
        for n in Model.objects.all().values('id', 'name', 'alternativeNames'):
            names[n['id']] = [ox.decode_html(x)
                for x in [n['name']] + json.loads(n['alternativeNames'])]
        value = a.findvalue.lower()

        current = [p.id for p in a_matches.all()]
        matches = []
        name_matches = []
        for i in names:
            for name in names[i]:
                if name.lower() in value:
                    matches.append(i)
                    name_matches.append(name.lower())
                    break
        new = []
        for i in matches: 
            p = Model.objects.get(pk=i)
            #only add places/events that did not get added as a super match
            #i.e. only add The Paris Region and not Paris
            if not filter(lambda n: n in name_matches,
                          [n.lower() for n in p.get_super_matches()]):
                new.append(i)
        removed = filter(lambda p: p not in new, current)
        added = filter(lambda p: p not in current, new)
        update = removed + added
        if update:
            for e in Model.objects.filter(id__in=update):
                e.update_matches(models.Annotation.objects.filter(pk=a.id))
    else:
        #annotation has no value, remove all exisint matches
        for e in a_matches.all():
            e.update_matches(models.Annotation.objects.filter(pk=a.id))

@task(ignore_results=True, queue='default')
def update_item(id):
    from item.models import Item
    from clip.models import Clip
    a = models.Annotation.objects.get(pk=id)
    #cleanup orphaned clips
    Clip.objects.filter(annotations__id=None).delete()
    #update facets if needed
    if filter(lambda f: f['id'] == a.layer, settings.CONFIG['filters']):
        a.item.update_layer_facet(a.layer)
    Item.objects.filter(id=a.item.id).update(modified=a.modified)
    a.item.modified = a.modified
    a.item.update_find()
    a.item.update_sort()
    a.item.update_facets()
