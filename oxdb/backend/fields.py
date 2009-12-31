from django.db import models
from django.utils import simplejson as json


class DictField(models.TextField):
    """DictField is a textfield that contains JSON-serialized dictionaries."""

    # Used so to_python() is called
    __metaclass__ = models.SubfieldBase

    def to_python(self, value):
        """Convert our string value to python after we load it from the DB"""
        if isinstance(value, dict):
            return value

        value = json.loads(value)
        assert isinstance(value, dict)
        return value

    def get_db_prep_save(self, value):
        """Convert our JSON object to a string before we save"""
        assert isinstance(value, dict)
        value = json.dumps(value)
        return super(DictField, self).get_db_prep_save(value)


class TupleField(models.TextField):
    """TupleField is a textfield that contains JSON-serialized tuples."""

    # Used so to_python() is called
    __metaclass__ = models.SubfieldBase

    def to_python(self, value):
        """Convert our string value to JSON after we load it from the DB"""
        if isinstance(value, tuple):
            return value

        value = json.loads(value)
        assert isinstance(value, list)
        return tuple(value)

    def get_db_prep_save(self, value):
        """Convert our JSON object to a string before we save"""
        assert isinstance(value, tuple)
        value = json.dumps(value)
        return super(TupleField, self).get_db_prep_save(value)

