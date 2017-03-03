from django.db import models
from django.utils.encoding import python_2_unicode_compatible


@python_2_unicode_compatible
class IDAlias(models.Model):
    old = models.CharField(max_length=255, unique=True)
    new = models.CharField(max_length=255)

    def __str__(self):
        return u"%s=%s" % (self.old, self.new)

@python_2_unicode_compatible
class LayerAlias(models.Model):
    old = models.CharField(max_length=255, unique=True)
    new = models.CharField(max_length=255)

    def __str__(self):
        return u"%s=%s" % (self.old, self.new)

@python_2_unicode_compatible
class ListAlias(models.Model):

    old = models.CharField(max_length=255, unique=True)
    new = models.CharField(max_length=255)

    def __str__(self):
        return u"%s=%s" % (self.old, self.new)

@python_2_unicode_compatible
class Alias(models.Model):
    url = models.CharField(max_length=255, unique=True)
    target = models.CharField(max_length=255)

    def __str__(self):
        return u"%s=%s" % (self.url, self.target)

