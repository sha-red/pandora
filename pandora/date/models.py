# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models
from django.db.models import Q
from django.conf import settings

from ox.django import fields

import managers

class Date(models.Model):
    '''
        Dates are dates in time that can be once or recurring,
        From Mondays to Spring to 1989 to Roman Empire
    '''
    name = models.CharField(null=True, max_length=255, unique=True)
    name_sort = models.CharField(null=True, max_length=255, unique=True)
    name_find = models.TextField(default='', editable=True)
    wikipediaId = models.CharField(max_length=1000, blank=True)

    objects = managers.DateManager()

    class Meta:
        ordering = ('name_sort', )

    #FIXME: how to deal with aliases
    aliases = fields.TupleField(default=[])

    #once|year|week|day
    recurring = models.IntegerField(default=0)

    #start yyyy-mm-dd|mm-dd|dow 00:00|00:00
    #end   yyyy-mm-dd|mm-dd|dow 00:00|00:01
    start = models.CharField(null=True, max_length=255)
    end = models.CharField(null=True, max_length=255)

    def save(self, *args, **kwargs):
        if not self.name_sort:
            self.name_sort = self.name
        self.name_find = self.name + '||'.join(self.aliases)
        super(Date, self).save(*args, **kwargs)

