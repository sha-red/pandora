# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import re

from django.db import models, transaction
from django.contrib.auth.models import User, Group
from django.db.models import Q
from django.conf import settings
import ox

import managers
from annotation.models import Annotation, get_matches, get_super_matches
from item.models import Item, ItemSort
from changelog.models import Changelog

from django.db import models

class Sequence(models.Model):
    class Meta:
        unique_together = ("public_id", "mode")

    mode = models.CharField(max_length=128)
    public_id = models.CharField(max_length=128)
    item = models.ForeignKey(Item, null=True, related_name='sequences')
    sort = models.ForeignKey(ItemSort, null=True, related_name='sequences')
    user = models.IntegerField(db_index=True, null=True)

    hash = models.CharField(db_index=True, max_length=16, default='')
    start = models.FloatField(default=-1, db_index=True)
    end = models.FloatField(default=-1)
    duration = models.FloatField(default=0)

    objects = managers.SequenceManager()

    def save(self, *args, **kwargs):
        self.public_id = u"%s/%0.03f-%0.03f" % (
            self.item.itemId, float(self.start), float(self.end)
        )
        self.duration = self.end - self.start
        if self.item:
            self.user = self.item.user and self.item.user.id
            self.sort = self.item.sort
        super(Sequence, self).save(*args, **kwargs)

    def __unicode__(self):
        return self.public_id

    def json(self, keys=None, user=None):
        j = {
            'id': self.public_id,
            'hash': self.hash,
            'in': float('%0.03f' % self.start),
            'out': float('%0.03f' % self.end),
        }
        if keys:
            for key in keys:
                if key not in j:
                    j[key] = self.item.json.get(key)
        return j
