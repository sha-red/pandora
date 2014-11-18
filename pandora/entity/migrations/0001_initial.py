# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Entity'
        db.create_table('entity_entity', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('alternativeNames', self.gf('ox.django.fields.TupleField')(default=[])),
            ('data', self.gf('ox.django.fields.DictField')(default={})),
            ('matches', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('name_sort', self.gf('django.db.models.fields.CharField')(max_length=255, null=True)),
            ('name_find', self.gf('django.db.models.fields.TextField')(default='')),
        ))
        db.send_create_signal('entity', ['Entity'])

        # Adding unique constraint on 'Entity', fields ['type', 'name']
        db.create_unique('entity_entity', ['type', 'name'])


    def backwards(self, orm):
        # Removing unique constraint on 'Entity', fields ['type', 'name']
        db.delete_unique('entity_entity', ['type', 'name'])

        # Deleting model 'Entity'
        db.delete_table('entity_entity')


    models = {
        'entity.entity': {
            'Meta': {'unique_together': "(('type', 'name'),)", 'object_name': 'Entity'},
            'alternativeNames': ('ox.django.fields.TupleField', [], {'default': '[]'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'data': ('ox.django.fields.DictField', [], {'default': '{}'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'matches': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'name_find': ('django.db.models.fields.TextField', [], {'default': "''"}),
            'name_sort': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        }
    }

    complete_apps = ['entity']