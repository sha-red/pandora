# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models
from django.contrib.auth.models import User

from ox.django.fields import DictField

from item.models import Item

import managers


class List(models.Model):

    class Meta:
        unique_together = ("user", "name")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, related_name='lists')
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, default='private')
    _status = ['private', 'public', 'featured']
    query = DictField(default={"static": True})

    items = models.ManyToManyField('item.Item', related_name='lists',
                                                through='ListItem')

    subscribed_users = models.ManyToManyField(User, related_name='subscribed_lists')

    objects = managers.ListManager()

    def save(self, *args, **kwargs):
        super(List, self).save(*args, **kwargs)

    def get_number_of_items(self, user=None):
        if self.query.get('static', False):
            return self.items.count()
        else:
            return Item.objects.find({'query': self.query}, user).count()

    def add(self, item):
        q = self.items.filter(id=item.id)
        if q.count() == 0:
            l = ListItem()
            l.list = self
            l.item = item
            l.save()

    def remove(self, item):
        self.ListItem.objects.all().filter(item=item, list=self).delete()

    def __unicode__(self):
        return u'%s (%s)' % (self.name, self.user)

    def get_id(self):
        return '%s:%s' % (self.user.username, self.name)

    def editable(self, user):
        #FIXME: make permissions work
        if self.user == user or user.is_staff:
            return True
        return False

    def json(self, keys=['id', 'name', 'user', 'query', 'status'], user=None):
        response = {}
        for key in keys:
            if key == 'items':
                response[key] = self.get_number_of_items(user)
            elif key == 'id':
                response[key] = self.get_id()
            elif key == 'user':
                response[key] = self.user.username
            elif key == 'query':
                if not self.query.get('static', False):
                    response[key] = self.query
            elif key == 'ui':
                response[key] = site_conf['uiDefaults']['list']
            else:
                response[key] = getattr(self, key)
        return response

class ListItem(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    list = models.ForeignKey(List)
    item = models.ForeignKey('item.Item')

    def __unicode__(self):
        return u'%s in %s' % (self.item, self.list)

