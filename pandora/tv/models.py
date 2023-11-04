# -*- coding: utf-8 -*-

from datetime import datetime, timedelta
from random import randint

from django.db import models
from django.db.models import Max
from django.conf import settings

from item.models import Item


class Channel(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    run = models.IntegerField(default=0)
    list = models.OneToOneField('itemlist.List', related_name='channel', null=True, blank=True, on_delete=models.CASCADE)
    #list = models.ForeignKey('itemlist.List', related_name='channel', null=True, unique=True, blank=True, on_delete=models.CASCADE)

    def __str__(self):
        return "%s %s" % (self.list or 'All', self.run)

    def update_program(self, now=None):
        if not now:
            now = datetime.now()
        cansee = settings.CONFIG['capabilities']['canSeeItem']['guest']
        if self.list:
            items = self.list.get_items(self.list.user).filter(rendered=True, level__lte=cansee, sort__duration__gt=0)
        else:
            items = Item.objects.filter(rendered=True, level__lte=cansee, sort__duration__gt=0)
        if items.count() == 0:
            return None
        program = self.program.order_by('-start')
        changed = False
        play_now = program.filter(start__lte=now, end__gt=now).first()
        while not play_now or not play_now.next():
            played = self.program.filter(run=self.run)
            if played.exists():
                not_played = items.exclude(program__in=self.program.filter(run=self.run))
                not_played_count = not_played.count()
                if not_played_count == 0:
                    self.run += 1
                    changed = True
            else:
                changed = True
            if changed:
                not_played = items
                not_played_count = not_played.count()
                if not_played_count > 1 and program.exists():
                    not_played = not_played.exclude(id=program[0].id)
                    not_played_count = not_played.count()
            item = not_played[randint(0, not_played_count-1)]
            if program.exists():
                start = program.order_by('-end')[0].end
            else:
                start = now
            p = Program()
            p.item = item
            p.run = self.run
            p.start = start
            p.end = start + timedelta(seconds=item.sort.duration)
            p.channel = self
            p.save()
            program = self.program.order_by('-start')
            play_now = program.filter(start__lte=now, end__gt=now).first()
        if changed:
            self.save()
        return play_now

    def json(self, user):
        now = datetime.now()
        program = self.update_program(now)
        if not program:
            return {}
        else:
            return program.json(user, now)

class Program(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    run = models.IntegerField(default=0)
    start = models.DateTimeField()
    end = models.DateTimeField()
    item = models.ForeignKey('item.Item', related_name='program', on_delete=models.CASCADE)
    channel = models.ForeignKey(Channel, related_name='program', on_delete=models.CASCADE)

    def __str__(self):
        return "%s %s" % (self.item, self.start)

    def next(self):
        return self.channel.program.filter(start__gte=self.end).order_by('start').first()

    def json(self, user, current=False):
        item_json = self.item.json()
        r = {
            'item': self.item.public_id,
        }
        for key in ('title', 'director', 'year', 'durations', 'parts', 'rightslevel'):
            r[key] = item_json.get(key, '')
        r['layers'] = self.item.get_layers(user)
        r['streams'] = [s.file.oshash for s in self.item.streams()]
        if current:
            r['position'] = (current - self.start).total_seconds()
            r['next'] = self.next().json(user)
        return r
