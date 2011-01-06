# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models
from django.contrib.auth.models import User

from ox.django.fields import DictField

class List(models.Model):

    class Meta:
        unique_together = ("user", "name")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User)
    name = models.CharField(max_length=255)
    public = models.BooleanField(default=False)
    
    query = DictField(default={})

    items = models.ManyToManyField('item.Item', related_name='lists',
                                                through='ListItem')

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
        return u'%s (%s)' % (self.title, self.user)

    def editable(self, user):
        #FIXME: make permissions work
        if self.user == user or user.has_perm('Ox.admin'):
            return True
        return False


class ListItem(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    list = models.ForeignKey(List)
    item = models.ForeignKey('item.Item')

    def __unicode__(self):
        return u'%s in %s' % (self.item, self.list)
