# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement
from datetime import datetime, timedelta
from random import randint

from django.db import models


class Channel(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    run = models.IntegerField(default=0)

    list = models.ForeignKey('itemlist.List', related_name='channel')

    def json(self, user):
        now = datetime.now()
        items = self.list.get_items().filter(rendered=True)
        if items.count() == 0:
            return

        program = self.program.order_by('-start')
        while program.count() < 2 or program[0].end < now:
            not_played = items.exclude(program__in=self.program.filter(run=self.run))
            not_played_count = not_played.count()
            if not_played_count == 0:
                self.run += 1
                self.save()
                not_played = items
                not_played_count = not_played.count()
            item = not_played[randint(0, not_played_count-1)]
            if program.count() > 0:
                start = program[0].end
            else:
                start = now
            end = start + timedelta(seconds=item.get_json()['duration'])
            p = Program()
            p.item=item
            p.run=self.run
            p.start=start
            p.end=end
            p.channel = self
            p.save()
            program = self.program.order_by('-start')
            print program.count(), now, p.start, p.end
        current = program[1]
        return {
            'current': current.json(user, now),
            'next': program[0].json(user)
        }

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
            'durations': item_json['durations'],
            'parts': item_json['parts'],
        }
        r['layers'] = self.item.get_layers(user)
        if current:
            r['currentTime'] = (current - self.start).total_seconds()

        return r
