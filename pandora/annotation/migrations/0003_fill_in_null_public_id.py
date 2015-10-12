# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import DataMigration
from django.db import models, connection
import ox

class Migration(DataMigration):

    def forwards(self, orm):
        pass

    def backwards(self, orm):
        pass

    models = {
        'annotation.annotation': {
            'Meta': {'object_name': 'Annotation'},
            'clip': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'annotations'", 'null': 'True', 'to': "orm['clip.Clip']"}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'end': ('django.db.models.fields.FloatField', [], {'default': '-1', 'db_index': 'True'}),
            'findvalue': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'annotations'", 'to': "orm['item.Item']"}),
            'languages': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True', 'blank': 'True'}),
            'layer': ('django.db.models.fields.CharField', [], {'max_length': '255', 'db_index': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'public_id': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '128', 'null': 'True'}),
            'sortvalue': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '1000', 'null': 'True', 'blank': 'True'}),
            'start': ('django.db.models.fields.FloatField', [], {'default': '-1', 'db_index': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'annotations'", 'to': "orm['auth.User']"}),
            'value': ('django.db.models.fields.TextField', [], {})
        },
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '255', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'})
        },
        'clip.clip': {
            'Meta': {'unique_together': "(('item', 'start', 'end'),)", 'object_name': 'Clip'},
            'actions': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'archived_subscenes': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'aspect_ratio': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'data': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'duration': ('django.db.models.fields.FloatField', [], {'default': '0', 'db_index': 'True'}),
            'end': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'findvalue': ('django.db.models.fields.TextField', [], {'null': 'True', 'db_index': 'True'}),
            'hue': ('django.db.models.fields.FloatField', [], {'default': '0', 'db_index': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'clips'", 'to': "orm['item.Item']"}),
            'lab_rolls': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'lightness': ('django.db.models.fields.FloatField', [], {'default': '0', 'db_index': 'True'}),
            'locations': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'markers': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'notes': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'participants': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'participantsdiscussed': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'questions': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'quotes': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'saturation': ('django.db.models.fields.FloatField', [], {'default': '0', 'db_index': 'True'}),
            'sort': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'matching_clips'", 'to': "orm['item.ItemSort']"}),
            'sortvalue': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'start': ('django.db.models.fields.FloatField', [], {'default': '-1', 'db_index': 'True'}),
            'storylines': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'subscenes': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'subtitles': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'themes': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'themesdiscussed': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'themessubjective': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'user': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'db_index': 'True'}),
            'volume': ('django.db.models.fields.FloatField', [], {'default': '0', 'null': 'True', 'db_index': 'True'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'item.access': {
            'Meta': {'unique_together': "(('item', 'user'),)", 'object_name': 'Access'},
            'access': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'accessed': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'accessed'", 'to': "orm['item.Item']"}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'accessed_items'", 'null': 'True', 'to': "orm['auth.User']"})
        },
        'item.annotationsequence': {
            'Meta': {'object_name': 'AnnotationSequence'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'_annotation_sequence'", 'unique': 'True', 'to': "orm['item.Item']"}),
            'value': ('django.db.models.fields.BigIntegerField', [], {'default': '1'})
        },
        'item.description': {
            'Meta': {'unique_together': "(('key', 'value'),)", 'object_name': 'Description'},
            'description': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '200', 'db_index': 'True'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'db_index': 'True'})
        },
        'item.facet': {
            'Meta': {'unique_together': "(('item', 'key', 'value'),)", 'object_name': 'Facet'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'facets'", 'to': "orm['item.Item']"}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '200', 'db_index': 'True'}),
            'sortvalue': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'db_index': 'True'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'db_index': 'True'})
        },
        'item.item': {
            'Meta': {'object_name': 'Item'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'data': ('ox.django.fields.DictField', [], {'default': '{}'}),
            'external_data': ('ox.django.fields.DictField', [], {'default': '{}'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'items'", 'blank': 'True', 'to': "orm['auth.Group']"}),
            'icon': ('django.db.models.fields.files.ImageField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'json': ('ox.django.fields.DictField', [], {'default': '{}'}),
            'level': ('django.db.models.fields.IntegerField', [], {'db_index': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'oxdbId': ('django.db.models.fields.CharField', [], {'max_length': '42', 'unique': 'True', 'null': 'True', 'blank': 'True'}),
            'poster': ('django.db.models.fields.files.ImageField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'}),
            'poster_frame': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'poster_height': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'poster_source': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'poster_width': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'public_id': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '128', 'blank': 'True'}),
            'rendered': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'stream_aspect': ('django.db.models.fields.FloatField', [], {'default': '1.3333333333333333'}),
            'stream_info': ('ox.django.fields.DictField', [], {'default': '{}'}),
            'torrent': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '1000', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'items'", 'null': 'True', 'to': "orm['auth.User']"})
        },
        'item.itemfind': {
            'Meta': {'unique_together': "(('item', 'key'),)", 'object_name': 'ItemFind'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'find'", 'to': "orm['item.Item']"}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '200', 'db_index': 'True'}),
            'value': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'})
        },
        'item.itemsort': {
            'Meta': {'object_name': 'ItemSort'},
            'accessed': ('django.db.models.fields.DateTimeField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'aspectratio': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'bitrate': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'code': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'cutsperminute': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'date': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'duration': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'height': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'hue': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'item': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'sort'", 'unique': 'True', 'primary_key': 'True', 'to': "orm['item.Item']"}),
            'lightness': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'numberofannotations': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'numberofcuts': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'numberoffiles': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'order': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'participants': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'participantsdiscussed': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'pixels': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'public_id': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'random': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'resolution': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'rightslevel': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'saturation': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'shooting_date': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'size': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'timesaccessed': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'}),
            'volume': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'width': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'words': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'wordsperminute': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'year': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'db_index': 'True'})
        }
    }

    complete_apps = ['item', 'annotation']
    symmetrical = True
