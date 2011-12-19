# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement
from datetime import datetime, timedelta
from random import randint

from django.db import models
from django.db.models import Max

from item.models import Item


class Channel(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    run = models.IntegerField(default=0)
    list = models.ForeignKey('itemlist.List', related_name='channel', null=True, unique=True, blank=True)

    def __unicode__(self):
        return u"%s %s" % (self.list or 'All', self.run)

    def json(self, user):
        now = datetime.now()
        if self.list:
            items = self.list.get_items().filter(rendered=True)
        else:
            items = Item.objects.filter(rendered=True)
        if items.count() == 0:
            return {}

        program = self.program.order_by('-start')
        while program.count() < 1 or program[0].end < now:
            not_played = items.exclude(program__in=self.program.filter(run=self.run))
            not_played_count = not_played.count()
            if not_played_count == 0:
                self.run += 1
                self.save()
                not_played = items
                if not_played.count() > 1:
                    not_played = not_played.exclude(id=program[0].id)
                not_played_count = not_played.count()
            item = not_played[randint(0, not_played_count-1)]
            if program.count() > 0:
                start = program.aggregate(Max('end'))['end__max']
            else:
                start = now
            p = Program()
            p.item = item
            p.run = self.run
            p.start = start
            p.end = start + timedelta(seconds=item.get_json()['duration'])
            p.channel = self
            p.save()
            program = self.program.order_by('-start')
        return program[0].json(user, now)

class Program(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    run = models.IntegerField(default=0)
    start = models.DateTimeField()
    end = models.DateTimeField()
    item = models.ForeignKey('item.Item', related_name='program')
    channel = models.ForeignKey(Channel, related_name='program')

    def __unicode__(self):
        return u"%s %s" % (self.item, self.start)

    def json(self, user, current=False):
        item_json = self.item.get_json()
        r = {
            'item': self.item.itemId,
        }
        for key in ('title', 'director', 'year', 'durations', 'parts', 'rightslevel'):
            r[key] = item_json.get(key, '')
        r['layers'] = self.item.get_layers(user)
        if current:
            #requires python2.7
            #r['position'] = (current - self.start).total_seconds()
            td = current - self.start
            r['position'] = td.seconds + td.days * 24 * 3600 + float(td.microseconds)/10**6
        return r
