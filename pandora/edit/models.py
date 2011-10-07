# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

from django.db import models
from django.contrib.auth.models import User


class Edit(models.Model):

    class Meta:
        unique_together = ("user", "name")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User)
    name = models.CharField(max_length=255)
    public = models.BooleanField(default=False)

    duration = models.FloatField(default=0)
    #FIXME: how to deal with width/height?
    def __unicode__(self):
        return u'%s (%s)' % (self.title, self.user)

    def editable(self, user):
        #FIXME: make permissions work
        if self.user == user or user.is_staff:
            return True
        return False

    '''
        #creating a new file from clips seams to work not to bad, needs testing for frame accuracy
        ffmpeg -i 96p.webm -ss 123.33 -t 3 -vcodec copy -acodec copy 1.webm
        ffmpeg -i 96p.webm -ss 323.33 -t 4 -vcodec copy -acodec copy 2.webm
        ffmpeg -i 96p.webm -ss 423.33 -t 1 -vcodec copy -acodec copy 3.webm
        mkvmerge 1.webm +2.webm +3.webm -o cutup.webm
    '''


class Clip(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    edit = models.ForeignKey(Edit)
    position = models.IntegerField(default=0) #clip position
    edit_position = models.FloatField(default=0) #Position in seconds on edit 
    item = models.ForeignKey("item.Item")
    start = models.FloatField(default=0)
    end = models.FloatField(default=0)

    def __unicode__(self):
        return u'%s/%0.3f-%0.3f' % (self.item.itemId, self.start, self.end)
