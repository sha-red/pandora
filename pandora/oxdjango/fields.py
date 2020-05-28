# -*- coding: utf-8 -*-
import time
import datetime
import copy

from django.db import models
from django.utils import datetime_safe
import django.contrib.postgres.fields
from django.core.serializers.json import DjangoJSONEncoder

from six import string_types

from ox.utils import json

class JSONField(django.contrib.postgres.fields.JSONField):

    def __init__(self, *args, **kwargs):
        if 'encoder' not in kwargs:
            kwargs['encoder'] = DjangoJSONEncoder
        super(JSONField, self).__init__(*args, **kwargs)

def to_json(python_object):
    if isinstance(python_object, datetime.datetime):
        if python_object.year < 1900:
            tt = python_object.timetuple()
            value = '%d-%02d-%02dT%02d:%02d%02dZ' % tuple(list(tt)[:6])
        else:
            value = python_object.strftime('%Y-%m-%dT%H:%M:%SZ')
        return {'__class__': 'datetime.datetime',
                '__value__': value}
    if isinstance(python_object, datetime_safe.datetime):
        return {'__class__': 'datetime.datetime',
                '__value__': python_object.strftime('%Y-%m-%dT%H:%M:%SZ')}
    if isinstance(python_object, time.struct_time):
        return {'__class__': 'time.asctime',
                '__value__': time.asctime(python_object)}
    try:
        if isinstance(python_object, bytes):
            return {'__class__': 'bytes',
                '__value__': list(python_object)}
    except:
        pass
    raise TypeError(repr(python_object) + ' is not JSON serializable')

def from_json(json_object):
    if '__class__' in json_object:
        if json_object['__class__'] == 'bytes':
            return bytes(json_object['__value__'])
        if json_object['__class__'] == 'datetime_safe.datetime' \
            or json_object['__class__'] == 'datetime.datetime':
            return datetime_safe.datetime.strptime(json_object['__value__'], '%Y-%m-%dT%H:%M:%SZ')
        if json_object['__class__'] == 'time.asctime':
            return time.strptime(json_object['__value__'])
    return json_object

class DictField(models.TextField):
    _type = dict

    @classmethod
    def loads(cls, value):
        return json.loads(value, object_hook=from_json)

    @classmethod
    def dumps(cls, obj):
        return json.dumps(obj, default=to_json, ensure_ascii=False)

    def from_db_value(self, value, expression, connection, context=None):
        if value is None:
            return value
        if isinstance(value, self._type):
            return value
        try:
            value = self.loads(value)
        except:
            raise Exception('failed to parse value: %s' % value)
        if value is not None:
            if isinstance(value, string_types):
                value = json.loads(value)
            assert isinstance(value, self._type)
        return value

    def get_prep_value(self, value):
        if isinstance(value, self._type):
            value = self.dumps(value)
        if value is not None:
            assert isinstance(value, string_types)
        value = models.TextField.get_prep_value(self, value)
        return value

    def get_default(self):
        if self.has_default():
            if callable(self.default):
                return self.default()
            return copy.deepcopy(self.default)
        return super(DictField, self).get_default()

class TupleField(DictField):
    _type = (tuple, list)

    @classmethod
    def loads(self, value):
        value = DictField.loads(value)
        if isinstance(value, list):
            value = tuple(value)
        return value

try:
    from south.modelsinspector import add_introspection_rules
    add_introspection_rules([], ["^oxdjango\.fields\.DictField"])
    add_introspection_rules([], ["^oxdjango\.fields\.TupleField"])
except:
    pass
