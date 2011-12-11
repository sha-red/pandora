# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.core.management.base import BaseCommand
from django.conf import settings
import os

from ... import models


class Command(BaseCommand):
    """
    """
    help = 'update static files'
    args = ''

    def handle(self, **options):
        for root, folders, files in os.walk(os.path.join(settings.MEDIA_ROOT, 'files')):
            for f in files:
                f = os.path.join(root, f)
                profile, ext = os.path.splitext(os.path.basename(f))
                if ext in ('.webm', '.mp4'):
                    oshash = os.path.dirname(f)[-19:].replace('/', '')
                    format = ext[1:]
                    resolution = int(profile[:-1])
                    qs = models.Stream.objects.filter(file__oshash=oshash, format=format, resolution=resolution)
                    if qs.count() == 0:
                        print 'add', f
                        print oshash, resolution, format
                        stream = models.Stream()
                        stream.file = models.File.objects.get(oshash=oshash)
                        stream.resolution = resolution
                        stream.format = format
                        stream.video.name = f[len(settings.MEDIA_ROOT)+1:]
                        self.available = True
                        stream.save()
        #link streams
        resolution = settings.CONFIG['video']['resolutions'][0]
        format = settings.CONFIG['video']['formats'][0]
        for s in models.Stream.objects.exclude(format=format, resolution=resolution).filter(source=None):
            s.source = models.Stream.objects.get(file=s.file, resolution=resolution, format=format)
            s.save()
        #extract timelines
        for s in models.Stream.objects.filter(source=None):
            s.make_timeline()
