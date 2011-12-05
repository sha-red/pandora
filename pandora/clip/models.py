# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models
from django.conf import settings

from archive import extract
import managers


class MetaClip:
    def update_calculated_values(self):
        start = self.start
        end = self.end
        if self.item.sort.duration:
            start = min(self.start, self.item.sort.duration)
            end = min(self.end, self.item.sort.duration)
        self.duration = end - start
        if self.duration > 0:
            self.hue, self.saturation, self.lightness = extract.average_color(
                           self.item.timeline_prefix, self.start, self.end)
            self.volume = extract.average_volume(self.item.timeline_prefix, self.start, self.end)
        else:
            self.hue = self.saturation = self.lightness = 0
            self.volume = 0
        self.director = self.item.sort.director
        self.title = self.item.sort.title
  
    def save(self, *args, **kwargs):
        self.public_id = u"%s/%s-%s" %(self.item.itemId, float(self.start), float(self.end))
        if self.duration != self.end - self.start:
            self.update_calculated_values()
        if not self.aspect_ratio and self.item:
            streams = self.item.streams()
            if streams:
                self.aspect_ratio = streams[0].aspect_ratio
        if self.id:
            for l in self.layers:
                setattr(self, l, self.annotations.filter(layer=l).count()>0)
        models.Model.save(self, *args, **kwargs)

    def json(self, keys=None):
        j = {}
        clip_keys = ('id', 'in', 'out', 'position', 'created', 'modified',
                     'hue', 'saturation', 'lightness', 'volume', 'videoRatio')
        for key in clip_keys:
            j[key] = getattr(self, {
                'id': 'public_id',
                'in': 'start',
                'out': 'end',
                'position': 'start',
                'videoRatio': 'aspect_ratio',
            }.get(key, key))
        if keys:
            for key in j.keys():
                if key not in keys:
                    del j[key]
            #needed here to make item find with clips work
            if 'annotations' in keys:
                j['annotations'] = [a.json(keys=['value', 'id', 'layer'])
                                    for a in self.annotations.filter(layer__in=self.layers)]
            for key in keys:
                if key not in clip_keys and key not in j:
                    value = self.item.get(key)
                    if not value and hasattr(self.item.sort, key):
                        value = getattr(self.item.sort, key)
                    j[key] = value
        return j

    @classmethod
    def get_or_create(cls, item, start, end):
        start = float(start)
        end = float(end)
        public_id = u"%s/%s-%s" %(item.itemId, start, end)
        qs = cls.objects.filter(public_id=public_id)
        if qs.count() == 0:
            clip = Clip(item=item, start=start, end=end, public_id=public_id)
            clip.save()
            created = True
        else:
            clip = qs[0]
            created = False
        return clip, created

    def __unicode__(self):
        return self.public_id

class Meta:
    unique_together = ("item", "start", "end")

attrs = {
    '__module__': 'clip.models',
    'Meta': Meta,
    'objects': managers.ClipManager(),
    'created': models.DateTimeField(auto_now_add=True),
    'modified': models.DateTimeField(auto_now=True),
    'public_id': models.CharField(max_length=128, unique=True),
    'aspect_ratio': models.FloatField(default=0),

    'item': models.ForeignKey('item.Item', related_name='clips'),

    #seconds
    'start': models.FloatField(default=-1, db_index=True),
    'end': models.FloatField(default=-1),
    'duration': models.FloatField(default=0, db_index=True),

    #get from annotation
    'hue': models.FloatField(default=0, db_index=True),
    'saturation': models.FloatField(default=0, db_index=True),
    'lightness': models.FloatField(default=0, db_index=True),
    'volume': models.FloatField(default=0, null=True, db_index=True),

    'director': models.CharField(max_length=1000, null=True, db_index=True),
    'title': models.CharField(max_length=1000, db_index=True),
}
public_layers = [l['id']
                 for l in filter(lambda l: not l.get('private', False),
                                 settings.CONFIG['layers'])]
for name in public_layers:
    attrs[name] = models.BooleanField(default=False, db_index=True)

Clip = type('Clip', (MetaClip,models.Model), attrs)
Clip.layers = public_layers

