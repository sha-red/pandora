# -*- coding: utf-8 -*-

from django.db import models
from django.conf import settings

import ox

from archive import extract

from . import managers
from .utils import add_cuts


def get_layers(item, interval=None, user=None):
    from annotation.models import Annotation

    if user and user.is_anonymous:
        user = None

    layers = {}
    private = []
    for l in settings.CONFIG['layers']:
        name = l['id']
        layers[name] = []
        if l.get('private'):
            private.append(name)

    qs = Annotation.objects.filter(item=item).exclude(value='')
    qs = qs.filter(layer__in=layers)
    qs = qs.order_by('start', 'end', 'sortvalue')

    if interval:
        start, end = interval
        qs = qs.filter(start__lt=end, end__gt=start)

    entity_cache = {}

    for a in qs.order_by('start').select_related('user'):
        if a.layer in private and a.user != user:
            continue

        layers[a.layer].append(a.json(user=user, entity_cache=entity_cache))

    return layers


class MetaClip(object):
    def update_calculated_values(self):
        start = self.start
        end = self.end
        if self.item.sort.duration:
            start = min(self.start, self.item.sort.duration)
            end = min(self.end, self.item.sort.duration)
        self.duration = end - start
        if int(end*25) - int(start*25) > 0:
            self.hue, self.saturation, self.lightness = extract.average_color(
                           self.item.timeline_prefix, self.start, self.end)
            self.volume = extract.average_volume(self.item.timeline_prefix, self.start, self.end)
        else:
            self.hue = self.saturation = self.lightness = 0
            self.volume = 0

    def update_findvalue(self):
        if not self.aspect_ratio and self.item:
            streams = self.item.streams()
            if streams:
                self.aspect_ratio = streams[0].aspect_ratio
        if self.item:
            self.user = self.item.user and self.item.user.id
            self.sort = self.item.sort
        if self.id:
            anns = self.annotations.order_by('layer', 'sortvalue')
            anns_by_layer = {}
            for ann in anns:
                anns_by_layer.setdefault(ann.layer, []).append(ann)

            sortvalue = ''.join((
                a.sortvalue
                for l in settings.CONFIG.get('clipLayers', [])
                for a in anns_by_layer.get(l, [])
                if a.sortvalue
            ))
            if sortvalue:
                self.sortvalue = sortvalue[:900]
            else:
                self.sortvalue = None

            self.findvalue = '\n'.join(list(filter(None, [a.findvalue for a in anns])))
            for l in [k['id'] for k in settings.CONFIG['layers']]:
                setattr(self, l, l in anns_by_layer and bool(len(anns_by_layer[l])))

    def save(self, *args, **kwargs):
        if self.duration != self.end - self.start:
            self.update_calculated_values()
        self.update_findvalue()
        models.Model.save(self, *args, **kwargs)

    clip_keys = ('id', 'in', 'out', 'position', 'created', 'modified',
                 'hue', 'saturation', 'lightness', 'volume', 'videoRatio')
    def json(self, keys=None, qs=None, user=None):
        j = {}
        for key in self.clip_keys:
            j[key] = getattr(self, {
                'id': 'public_id',
                'in': 'start',
                'out': 'end',
                'position': 'start',
                'videoRatio': 'aspect_ratio',
            }.get(key, key))
        if not j['videoRatio']:
            j['videoRatio'] = 4/3
        if keys:
            for key in list(j):
                if key not in keys:
                    del j[key]
            #needed here to make item find with clips work
            if 'annotations' in keys:
                annotations = self.annotations.all().exclude(value='')
                if qs:
                    for q in qs:
                        annotations = annotations.filter(q)
                entity_cache = {}
                j['annotations'] = [
                    a.json(keys=['value', 'id', 'layer'], entity_cache=entity_cache)
                    for a in annotations
                    if a.value
                ]
            if 'layers' in keys:
                j['layers'] = self.get_layers()
            if 'cuts' in keys:
                j['cuts'] = tuple([c for c in self.item.get('cuts', []) if c > self.start and c < self.end])
            for key in keys:
                if key not in self.clip_keys and key not in j:
                    if key == 'streams':
                        value = [s.file.oshash for s in self.item.streams()]
                    else:
                        value = self.item.get(key) or self.item.cache.get(key)
                    if not value and hasattr(self.item.sort, key):
                        value = getattr(self.item.sort, key)
                    if value is not None:
                        j[key] = value
        return j

    def edit_json(self, user=None):
        data = {
            'id': ox.toAZ(self.id),
        }
        data['item'] = self.item.public_id
        data['in'] = self.start
        data['out'] = self.end
        qs = self.annotations.all()
        if qs.count():
            data['annotation'] = qs[0].public_id
        data['parts'] = self.item.cache['parts']
        data['durations'] = self.item.cache['durations']
        for key in settings.CONFIG['itemTitleKeys'] + ['videoRatio']:
            value = self.item.cache.get(key)
            if value:
                data[key] = value
        data['duration'] = data['out'] - data['in']
        add_cuts(data, self.item, self.start, self.end)
        data['layers'] = self.get_layers(user)
        data['streams'] = [s.file.oshash for s in self.item.streams()]
        return data

    def get_layers(self, user=None):
        return get_layers(item=self.item, interval=(self.start, self.end), user=user)

    @classmethod
    def get_or_create(cls, item, start, end):
        start = float(start)
        end = float(end)
        start = float('%0.03f' % start)
        end = float('%0.03f' % end)
        qs = cls.objects.filter(item=item, start=start, end=end)
        if qs.count() == 0:
            clip, created = cls.objects.get_or_create(item=item, start=start, end=end)
            clip.save()
            created = True
        else:
            clip = qs[0]
            created = False
        return clip, created

    @property
    def public_id(self):
        return "%s/%0.03f-%0.03f" % (self.item.public_id, float(self.start), float(self.end))

    def __str__(self):
        return self.public_id


class Meta:
    unique_together = ("item", "start", "end")

attrs = {
    '__module__': 'clip.models',
    'Meta': Meta,
    'objects': managers.ClipManager(),
    'created': models.DateTimeField(auto_now_add=True),
    'modified': models.DateTimeField(auto_now=True),
    'aspect_ratio': models.FloatField(default=0),

    'item': models.ForeignKey('item.Item', related_name='clips', on_delete=models.CASCADE),
    'sort': models.ForeignKey('item.ItemSort', related_name='matching_clips', on_delete=models.CASCADE),
    'user': models.IntegerField(db_index=True, null=True),

    #seconds
    'start': models.FloatField(default=-1, db_index=True),
    'end': models.FloatField(default=-1),
    'duration': models.FloatField(default=0, db_index=True),


    #get from annotation
    'hue': models.FloatField(default=0, db_index=True),
    'saturation': models.FloatField(default=0, db_index=True),
    'lightness': models.FloatField(default=0, db_index=True),
    'volume': models.FloatField(default=0, null=True, db_index=True),

    'sortvalue': models.CharField(max_length=1000, null=True, db_index=True),
    'findvalue': models.TextField(null=True, db_index=settings.DB_GIN_TRGM),
}
for name in [k['id'] for k in settings.CONFIG['layers']]:
    attrs[name] = models.BooleanField(default=False, db_index=True)

Clip = type('Clip', (MetaClip, models.Model), attrs)

class ClipRandom(models.Model):
    id = models.BigIntegerField(primary_key=True)
    clip = models.OneToOneField(Clip, on_delete=models.CASCADE)
