from django.db import models

FIELDS = {
    'char': (models.CharField, dict(null=True, max_length=1000, db_index=True)),
    'year': (models.CharField, dict(null=True, max_length=4, db_index=True)),
    'integer': (models.BigIntegerField, dict(null=True, blank=True, db_index=True)),
    'float': (models.FloatField, dict(null=True, blank=True, db_index=True)),
    'date': (models.DateTimeField, dict(null=True, blank=True, db_index=True))
}

def get_sort_field(sort_type):
    return FIELDS[{
        'layer': 'char',
        'string': 'char',
        'text': 'char',
        'title': 'char',
        'person': 'char',
        'year': 'year',
        'words': 'integer',
        'length': 'integer',
        'date': 'date',
        'hue': 'float',
        'time': 'integer',
        'enum': 'integer',
    }.get(sort_type, sort_type)]
