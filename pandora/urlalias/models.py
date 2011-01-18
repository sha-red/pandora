from django.db import models


class IDAlias(models.Model):
    old = models.CharField(max_length=255, unique=True)
    new = models.CharField(max_length=255)

class LayerAlias(models.Model):
    old = models.CharField(max_length=255, unique=True)
    new = models.CharField(max_length=255)

class Alias(models.Model):
    url = models.CharField(max_length=255, unique=True)
    target = models.CharField(max_length=255)

