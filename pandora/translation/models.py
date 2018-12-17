import hashlib

from django.conf import settings
from django.core.cache import cache
from django.db import models
import django.utils.translation
from django.utils import timezone

import ox

from . import managers


def get_cache_key(key, lang):
    return '%s-%s' % (hashlib.sha1(key.encode()).hexdigest(), lang)


def load_itemkey_translations():
    from annotation.models import Annotation
    from item.models import Item
    from django.db.models import QuerySet
    used_keys = set()
    for layer in settings.CONFIG['layers']:
        if layer.get('translate'):
            qs = Annotation.objects.filter(layer=layer['id'])
            query = qs.query
            query.group_by = ['value']
            for value in QuerySet(query=query, model=Annotation).values_list('value', flat=True):
                for lang in settings.CONFIG['languages']:
                    if lang == settings.CONFIG['language']:
                        continue
                    used_keys.add(value)
                    t, _ = Translation.objects.get_or_create(lang=lang, key=value, defaults={
                        'type': Translation.CONTENT
                    })

    translated_keys = []
    for key in settings.CONFIG['itemKeys']:
        if key.get('translate'):
            translated_keys.append(key['id'])

    if translated_keys:
        for item in Item.objects.all():
            for key in translated_keys:
                values = item.get(key)
                if isinstance(values, str):
                    values = [values]
                if values:
                    for value in values:
                        for lang in settings.CONFIG['languages']:
                            if lang == settings.CONFIG['language']:
                                continue
                            used_keys.add(value)
                            t, _ = Translation.objects.get_or_create(lang=lang, key=value, defaults={
                                'type': Translation.CONTENT
                            })

    Translation.objects.filter(type=Translation.CONTENT).exclude(key__in=used_keys).delete()

def load_translations():
    import os
    import json
    from glob import glob
    locale = {}
    for file in glob('%s/json/locale.??.json' % settings.STATIC_ROOT):
        lang = file.split('.')[-2]
        if lang not in locale:
            locale[lang] = {}
        with open(os.path.join(file)) as fd:
            locale[lang].update(json.load(fd))
    for lang, locale in locale.items():
        used_keys = []
        if lang in settings.CONFIG['languages']:
            for key, value in locale.items():
                used_keys.append(key)
                t, created = Translation.objects.get_or_create(lang=lang, key=key)
                if created:
                    t.type = Translation.UI
                    t.value = value
                    t.save()
        Translation.objects.filter(type=Translation.UI, lang=lang).exclude(key__in=used_keys).delete()

class Translation(models.Model):
    CONTENT = 1
    UI = 2

    created = models.DateTimeField(auto_now_add=True, editable=False)
    modified = models.DateTimeField(default=timezone.now, editable=False)

    type = models.IntegerField('type', default=0)
    lang = models.CharField('language', max_length=8)
    key = models.CharField('key', max_length=4096)
    value = models.CharField('translation', max_length=4096, null=True, blank=True, default=None)

    objects = managers.TranslationManager()

    class Meta:
        unique_together = ('key', 'lang')

    def __str__(self):
        return '%s->%s [%s]' % (self.key, self.value, self.lang)

    def json(self, keys=None, user=None):
        data = {
            'id': ox.toAZ(self.id)
        }
        for key in ('key', 'lang', 'value'):
            data[key] = getattr(self, key)

        return data

    @classmethod
    def get_translations(cls, key):
        return list(cls.objects.filter(key=key).order_by('-lang').values_list('lang', flat=True))

    @classmethod
    def get_translation(cls, key, lang):
        cache_key = get_cache_key(key, lang)
        data = cache.get(cache_key)
        if not data:
            trans = None
            for translation in cls.objects.filter(key=key, lang=lang):
                trans = translation.get_value()
                break
            if trans is None:
                cls.needs_translation(key)
                trans = key
            cache.set(cache_key, trans, 5*60)
            return trans
        return data

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        cache.delete(get_cache_key(self.key, self.lang))

    def get_value(self):
        if self.value:
            return self.value
        return self.key
