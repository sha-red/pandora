# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, print_function, absolute_import

import re
import unicodedata

from django.db import models, transaction
from django.db.models import Q
from django.contrib.auth.models import User
from django.conf import settings
from django.db.models.signals import pre_delete

import ox

from clip.models import Clip

from item.utils import sort_string, get_by_key

from . import managers
from . import utils

def get_super_matches(obj, model):
    super_matches = []
    name_lower = obj.name.lower()
    q = Q(name_find__contains=" " + name_lower) | Q(name_find__contains="|%s" % name_lower)
    for name in obj.alternativeNames:
        name_lower = name.lower()
        q = q | Q(name_find__contains=" " + name_lower) | Q(name_find__contains="|%s" % name_lower)
    for p in model.objects.filter(q).exclude(id=obj.id):
        for othername in [p.name] + list(p.alternativeNames):
            for name in [obj.name] + list(obj.alternativeNames):
                if name in othername:
                    super_matches.append(othername)
    return super_matches

def get_matches(obj, model, layer_type, qs=None):
    super_matches = obj.get_super_matches()
    exact = [l['id'] for l in list(filter(lambda l: l['type'] == layer_type, settings.CONFIG['layers']))]
    if exact:
        q = Q(value__iexact=obj.name)
        for name in obj.alternativeNames:
            q = q | Q(value__iexact=name)
        f = q & Q(layer__in=exact)
    else:
        f = None

    has_type = 'has%ss' % layer_type.capitalize()
    contains = [l['id'] for l in list(filter(lambda l: l.get(has_type), settings.CONFIG['layers']))]
    if contains:
        name = ox.decode_html(obj.name)
        name = unicodedata.normalize('NFKD', name).lower()
        q = Q(findvalue__contains=" " + name) | Q(findvalue__startswith=name)
        for name in obj.alternativeNames:
            name = ox.decode_html(name)
            name = unicodedata.normalize('NFKD', name).lower()
            q = q | Q(findvalue__contains=" " + name) | Q(findvalue__startswith=name)
        contains_matches = q & Q(layer__in=contains)
        if f:
            f = contains_matches | f
        else:
            f = contains_matches

    matches = []
    if not qs:
        qs = Annotation.objects.all()
    for a in qs.filter(f):
        if a.findvalue:
            value = a.findvalue.lower()
            for name in super_matches:
                name = ox.decode_html(name)
                value = value.replace(name.lower(), '')
            for name in [obj.name] + list(obj.alternativeNames):
                name = name.lower()
                name = ox.decode_html(name)
                name = unicodedata.normalize('NFKD', name).lower()
                if name in value and (exact or re.compile('((^|\s)%s([\.,;:!?\'"\)\]\-\/\s]|$))' % re.escape(name)).findall(value)):
                    matches.append(a.id)
                    break
    if not matches:
        matches = [-1]
    return Annotation.objects.filter(id__in=matches)

class Annotation(models.Model):
    objects = managers.AnnotationManager()

    #FIXME: here having a item,start index would be good
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, related_name='annotations')
    item = models.ForeignKey('item.Item', related_name='annotations')
    clip = models.ForeignKey('clip.Clip', null=True, related_name='annotations')

    public_id = models.CharField(max_length=128, unique=True)
    #seconds
    start = models.FloatField(default=-1, db_index=True)
    end = models.FloatField(default=-1, db_index=True)

    layer = models.CharField(max_length=255, db_index=True)
    value = models.TextField()
    findvalue = models.TextField(null=True, db_index=settings.DB_GIN_TRGM)
    sortvalue = models.CharField(max_length=1000, null=True, blank=True, db_index=True)

    languages = models.CharField(max_length=255, null=True, blank=True)

    def editable(self, user):
        if user.is_authenticated():
            if user.profile.capability('canEditAnnotations') or \
               self.user == user or \
               user.groups.filter(id__in=self.item.groups.all()).count() > 0:
                return True
        return False

    @classmethod
    def get(cls, id):
        return cls.objects.get(public_id=id)

    def set_public_id(self):
        self.public_id = self.item.next_annotationid()

    @classmethod
    def public_layers(self):
        layers = []
        for layer in settings.CONFIG['layers']:
            if not layer.get('private', False):
                layers.append(layer['id'])
        return layers

    def get_layer(self):
        for layer in settings.CONFIG['layers']:
            if layer['id'] == self.layer:
                return layer
        return {}

    def save(self, *args, **kwargs):
        delay_matches = kwargs.pop('delay_matches', False)

        set_public_id = not self.id or not self.public_id
        layer = self.get_layer()
        if self.value:
            self.value = utils.cleanup_value(self.value, layer['type'])

            findvalue = self.value
            try:
                if layer['type'] == 'entity':
                    findvalue = self.get_entity().name
            except:
                pass
            self.findvalue = ox.decode_html(ox.strip_tags(re.sub('<br */?>\n?', ' ', findvalue))).replace('\n', ' ')
            self.findvalue = unicodedata.normalize('NFKD', self.findvalue).lower()
            sortvalue = sort_string(self.findvalue)
            while sortvalue and not unicodedata.category(sortvalue[0])[0] in ('L', 'N'):
                sortvalue = sortvalue[1:]
            if sortvalue:
                self.sortvalue = sortvalue[:900]
            else:
                self.sortvalue = None
            self.languages = ','.join(re.compile('lang="(.*?)"').findall(self.value))
            if not self.languages:
                self.languages = None
        else:
            self.findvalue = None
            self.sortvalue = None
            self.languages = None

        with transaction.atomic():
            if not self.clip or self.start != self.clip.start or self.end != self.clip.end:
                self.clip, created = Clip.get_or_create(self.item, self.start, self.end)

            if set_public_id:
                self.set_public_id()

            super(Annotation, self).save(*args, **kwargs)

            if self.clip:
                Clip.objects.filter(**{
                    'id': self.clip.id,
                    self.layer: False
                }).update(**{self.layer: True})
                # update clip.findvalue
                self.clip.save()

            # update matches in bulk if called from load_subtitles
            if not delay_matches:
                self.update_matches()
            self.update_documents()

    def update_matches(self):
        from place.models import Place
        from event.models import Event
        types = []
        layer = self.get_layer()
        if layer.get('type') == 'place' or layer.get('hasPlaces'):
            types.append('place')
        if layer.get('type') == 'event' or layer.get('hasEvents'):
            types.append('event')
        for type in types:
            if type == 'place':
                Model = Place
            elif type == 'event':
                Model = Event

            a_matches = getattr(self, type == 'place' and 'places' or 'events')

            # remove undefined matches that only have this annotation
            for p in a_matches.filter(defined=False).exclude(name=self.value):
                if p.annotations.exclude(id=id).count() == 0:
                    p.delete()
            if layer.get('type') == type and a_matches.count() == 0:
                a_matches.add(Model.get_or_create(self.value))
                for p in a_matches.all():
                    p.update_matches()

            if self.findvalue:
                names = {}
                for n in Model.objects.all().values('id', 'name', 'alternativeNames'):
                    names[n['id']] = [ox.decode_html(x) for x in (n['name'],) + n['alternativeNames']]
                value = self.findvalue.lower()
                current = {p.id for p in a_matches.all()}
                matches = []
                name_matches = set()
                new = set()

                for i in names:
                    for name in names[i]:
                        if name.lower() in value:
                            matches.append(i)
                            name_matches.add(name.lower())
                            break
                for p in Model.objects.filter(id__in=matches):
                    # only add places/events that did not get added as a super match
                    # i.e. only add The Paris Region and not Paris
                    super_match = False
                    for n in p.get_super_matches():
                        if n.lower() in name_matches:
                            super_match = True
                            break
                    if not super_match:
                        new.add(p.id)

                # added or removed items are only in current or only in new
                update = list(current ^ new)
                if update:
                    for e in Model.objects.filter(id__in=update):
                        e.update_matches(Annotation.objects.filter(id=self.id))
            else:
                # annotation has no value, remove all exisint matches
                for e in a_matches.all():
                    e.update_matches(Annotation.objects.filter(pk=self.id))

    def update_documents(self):
        from document.models import Document
        from document.utils import get_documents
        old = [d.id for id in self.documents.all()]
        current = get_documents(self.value) if self.value else []
        removed = list(set(old) - set(current))
        added = list(set(current) - set(old))
        if removed:
            for document in Document.objects.filter(id__in=removed):
                self.documents.remove(document)
        if added:
            for document in Document.objects.filter(id__in=added):
                self.documents.add(document)

    def delete(self, *args, **kwargs):
        with transaction.atomic():
            super(Annotation, self).delete(*args, **kwargs)
            if self.clip and self.clip.annotations.count() == 0:
                self.clip.delete()
            self.item.update_find()
            self.item.update_sort()
            self.item.update_facets()

    def cleanup_undefined_relations(self):
        layer = self.get_layer()
        if layer.get('type') == 'place':
            for p in self.places.filter(defined=False):
                if p.annotations.exclude(id=self.id).count() == 0:
                    p.delete()
        elif layer.get('type') == 'event':
            for e in self.events.filter(defined=False):
                if e.annotations.exclude(id=self.id).count() == 0:
                    e.delete()

    def get_entity(self):
        from entity.models import Entity
        return Entity.get(self.value)

    def _get_entity_json(self, user=None, entity_cache=None):
        """When serializing many annotations pointing to the same entity, it is expensive to
        repeatedly look up and serialize the same entity.
        """
        from entity.models import Entity

        if entity_cache is not None and self.value in entity_cache:
            return entity_cache[self.value]

        id = ox.fromAZ(self.value)
        entity = Entity.objects.filter(id=id).only('name').get()
        entity_json = entity.json(keys=['id', 'name'])
        value = entity.annotation_value()

        if entity_cache is not None:
            entity_cache[self.value] = (entity_json, value)

        return (entity_json, value)

    annotation_keys = (
        'id', 'in', 'out', 'value', 'created', 'modified',
        'duration', 'layer', 'item', 'videoRatio', 'languages',
        'entity', 'event', 'place'
    )
    _clip_keys = ('hue', 'lightness', 'saturation', 'volume')

    def json(self, layer=False, keys=None, user=None, entity_cache=None):
        j = {
            'user': self.user.username,
            'id': self.public_id,
            'in': self.start,
            'out': self.end,
            'value': self.value,
            'created': self.created,
            'modified': self.modified,
        }
        j['duration'] = abs(j['out'] - j['in'])
        if user:
            j['editable'] = self.editable(user)
        if self.languages:
            j['languages'] = self.languages.split(',')
        l = self.get_layer()
        if l['type'] == 'entity':
            try:
                (j['entity'], j['value']) = self._get_entity_json(
                    user=user, entity_cache=entity_cache)
            except:
                j['entity'] = {}
        elif l['type'] == 'event':
            qs = self.events.all()
            if qs.count() > 0:
                j['event'] = qs[0].json(user=user)
            else:
                j['event'] = {}
        elif l['type'] == 'place':
            qs = self.places.all()
            if qs.count() > 0:
                j['place'] = qs[0].json(user=user)
            else:
                j['place'] = {}

        if layer or (keys and 'layer' in keys):
            j['layer'] = self.layer
        if keys and 'item' in keys:
            j['item'] = self.item.public_id
        if keys:
            _j = {}
            for key in keys:
                if key in j:
                    _j[key] = j[key]
            j = _j
            if 'videoRatio' in keys:
                streams = self.item.streams()
                if streams:
                    j['videoRatio'] = streams[0].aspect_ratio
            for key in keys:
                if key not in j:
                    if key in self._clip_keys:
                        j[key] = getattr(self.clip, key)
                    elif key not in self.annotation_keys:
                        value = self.item.get(key) or self.item.json.get(key)
                        if not value and hasattr(self.item.sort, key):
                            value = getattr(self.item.sort, key)
                        if value != None:
                            j[key] = value

        # Items without any real subtitles are given a dummy 5-second subtitle
        # every minute to ensure that they have at least *some* clips. Treat
        # them specially. See Item.add_empty_clips
        if l.get('isSubtitles') and 'id' in j and not self.value:
            del j['id']

        return j

    def __unicode__(self):
        return u"%s %s-%s" % (self.public_id, self.start, self.end)

def cleanup_related(sender, **kwargs):
    kwargs['instance'].cleanup_undefined_relations()
pre_delete.connect(cleanup_related, sender=Annotation)

def rename_layer(old, new):
    import item.models
    Annotation.objects.filter(layer=old).update(layer=new)
    item.models.ItemFind.objects.filter(key=old).update(key=new)
    item.models.Facet.objects.filter(key=old).update(key=new)
