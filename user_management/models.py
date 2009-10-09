# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.db import models
from django.contrib.auth.models import User


class Group(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    name = models.CharField(blank=True, max_length=255, unique=True)
    users = models.ManyToManyField(User, related_name='groups')

class Profile(models.Model):
    user = models.ForeignKey(User, unique=True)

class Preference(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, related_name='preferences')
    key = models.CharField(blank=True, max_length=255)
    value = models.TextField(blank=True)

