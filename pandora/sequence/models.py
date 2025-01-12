# -*- coding: utf-8 -*-

from django.db import models

from item.models import ItemSort

from . import managers


def parse_hash(value):
    return int(value, 16) - 9223372036854775808

def format_hash(value):
    return hex(value + 9223372036854775808)[2:-1].upper()

class Sequence(models.Model):
    class Meta:
        unique_together = ("sort", "start", "end", "mode")

    MODE = {
        'shape': 0,
        'color': 1
    }
    mode = models.IntegerField(choices=sorted(zip(MODE.values(), list(MODE)), key=lambda k: k[0]), default=0)
    sort = models.ForeignKey(ItemSort, null=True, related_name='sequences', on_delete=models.CASCADE)

    hash = models.BigIntegerField(db_index=True, default=-9223372036854775808)
    start = models.FloatField(default=-1)
    end = models.FloatField(default=-1)
    duration = models.FloatField(default=0)

    objects = managers.SequenceManager()

    def save(self, *args, **kwargs):
        self.duration = self.end - self.start
        super(Sequence, self).save(*args, **kwargs)

    @property
    def public_id(self):
        return "%s/%0.03f-%0.03f" % (self.sort.item.public_id, float(self.start), float(self.end))

    def __str__(self):
        return self.public_id

    def json(self, keys=None, user=None):
        j = {
            'id': self.public_id,
            'hash': format_hash(self.hash),
            'in': float('%0.03f' % self.start),
            'out': float('%0.03f' % self.end),
        }
        if keys:
            for key in keys:
                if key not in j:
                    j[key] = self.sort.item.cache.get(key)
        return j
