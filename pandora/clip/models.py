# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models
from django.conf import settings

from archive import extract
import managers

class Clip(models.Model):
    class Meta:
        unique_together = ("item", "start", "end")

    objects = managers.ClipManager()

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    public_id = models.CharField(max_length=128, unique=True)

    item = models.ForeignKey('item.Item', related_name='clips')

    #seconds
    start = models.FloatField(default=-1)
    end = models.FloatField(default=-1)
    duration = models.FloatField(default=0)

    #get from annotation
    duration = models.FloatField(default=0, db_index=True)
    hue = models.FloatField(default=0, db_index=True)
    saturation = models.FloatField(default=0, db_index=True)
    lightness = models.FloatField(default=0, db_index=True)
    volume = models.FloatField(default=0, null=True, db_index=True)

    def update_calculated_values(self):
        self.duration = self.end - self.start
        if self.duration > 0:
            self.hue, self.saturation, self.lightness = extract.average_color(
                           self.item.timeline_prefix, self.start, self.end)
            self.volume = extract.average_volume(self.item.timeline_prefix, self.start, self.end)
        else:
            self.hue = self.saturation = self.lightness = 0
            self.volume = 0
    
    def save(self, *args, **kwargs):
        self.public_id = u"%s/%s-%s" %(self.item.itemId, self.start, self.end)
        if self.duration != self.end - self.start:
            self.update_calculated_values()
        super(Clip, self).save(*args, **kwargs)

    def json(self, keys=None):
        j = {}
        clip_keys = ('id', 'in', 'out', 'created', 'modified',
                     'hue', 'saturation', 'lightness', 'volume')
        for key in clip_keys:
            j[key] = getattr(self, {
                'id': 'public_id',
                'in': 'start',
                'out': 'end',
            }.get(key, key))
        if keys:
            for key in j.keys():
                if key not in keys:
                    del j[key]
            if 'videoRatio' in keys:
                streams = self.item.streams()
                if streams:
                    j['videoRatio'] = streams[0].aspect_ratio
            public_layers = [l['id']
                             for l in filter(lambda l: not l.get('private', False),
                                             settings.CONFIG['layers'])]
            for layer in filter(lambda l: l in keys, public_layers):
                j[layer] = [a.json(keys=['value'])['value']
                            for a in self.annotations.filter(layer__name=layer)]
            for key in keys:
                if key not in clip_keys and key not in j:
                    j[key] = self.item.get(key)
        return j

    def __unicode__(self):
        return u"%s/%s-%s" %(self.item, self.start, self.end)

