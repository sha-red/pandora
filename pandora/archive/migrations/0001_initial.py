# -*- coding: utf-8 -*-

from south.db import db
from django.db import models
from archive.models import *

class Migration:
    
    def forwards(self, orm):
        
        # Adding model 'Volume'
        db.create_table('archive_volume', (
            ('id', orm['archive.Volume:id']),
            ('start', orm['archive.Volume:start']),
            ('end', orm['archive.Volume:end']),
            ('name', orm['archive.Volume:name']),
        ))
        db.send_create_signal('archive', ['Volume'])
        
        # Adding model 'Frame'
        db.create_table('archive_frame', (
            ('id', orm['archive.Frame:id']),
            ('created', orm['archive.Frame:created']),
            ('modified', orm['archive.Frame:modified']),
            ('file', orm['archive.Frame:file']),
            ('position', orm['archive.Frame:position']),
            ('frame', orm['archive.Frame:frame']),
        ))
        db.send_create_signal('archive', ['Frame'])
        
        # Adding model 'Archive'
        db.create_table('archive_archive', (
            ('id', orm['archive.Archive:id']),
            ('created', orm['archive.Archive:created']),
            ('modified', orm['archive.Archive:modified']),
            ('published', orm['archive.Archive:published']),
            ('name', orm['archive.Archive:name']),
            ('user', orm['archive.Archive:user']),
        ))
        db.send_create_signal('archive', ['Archive'])
        
        # Adding model 'File'
        db.create_table('archive_file', (
            ('id', orm['archive.File:id']),
            ('created', orm['archive.File:created']),
            ('modified', orm['archive.File:modified']),
            ('verified', orm['archive.File:verified']),
            ('oshash', orm['archive.File:oshash']),
            ('movie', orm['archive.File:movie']),
            ('name', orm['archive.File:name']),
            ('sort_name', orm['archive.File:sort_name']),
            ('part', orm['archive.File:part']),
            ('version', orm['archive.File:version']),
            ('language', orm['archive.File:language']),
            ('season', orm['archive.File:season']),
            ('episode', orm['archive.File:episode']),
            ('size', orm['archive.File:size']),
            ('duration', orm['archive.File:duration']),
            ('info', orm['archive.File:info']),
            ('video_codec', orm['archive.File:video_codec']),
            ('pixel_format', orm['archive.File:pixel_format']),
            ('display_aspect_ratio', orm['archive.File:display_aspect_ratio']),
            ('width', orm['archive.File:width']),
            ('height', orm['archive.File:height']),
            ('framerate', orm['archive.File:framerate']),
            ('audio_codec', orm['archive.File:audio_codec']),
            ('channels', orm['archive.File:channels']),
            ('samplerate', orm['archive.File:samplerate']),
            ('bits_per_pixel', orm['archive.File:bits_per_pixel']),
            ('pixels', orm['archive.File:pixels']),
            ('is_audio', orm['archive.File:is_audio']),
            ('is_video', orm['archive.File:is_video']),
            ('is_extra', orm['archive.File:is_extra']),
            ('is_main', orm['archive.File:is_main']),
            ('is_subtitle', orm['archive.File:is_subtitle']),
            ('is_version', orm['archive.File:is_version']),
        ))
        db.send_create_signal('archive', ['File'])
        
        # Adding model 'Instance'
        db.create_table('archive_fileinstance', (
            ('id', orm['archive.Instance:id']),
            ('created', orm['archive.Instance:created']),
            ('modified', orm['archive.Instance:modified']),
            ('published', orm['archive.Instance:published']),
            ('accessed', orm['archive.Instance:accessed']),
            ('path', orm['archive.Instance:path']),
            ('folder', orm['archive.Instance:folder']),
            ('file', orm['archive.Instance:file']),
            ('archive', orm['archive.Instance:archive']),
        ))
        db.send_create_signal('archive', ['Instance'])
        
    
    
    def backwards(self, orm):
        
        # Deleting model 'Volume'
        db.delete_table('archive_volume')
        
        # Deleting model 'Frame'
        db.delete_table('archive_frame')
        
        # Deleting model 'Archive'
        db.delete_table('archive_archive')
        
        # Deleting model 'File'
        db.delete_table('archive_file')
        
        # Deleting model 'Instance'
        db.delete_table('archive_fileinstance')
        
    
    
    models = {
        'archive.archive': {
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'published': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'owned_archives'", 'to': "orm['auth.User']"}),
            'users': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.User']", 'symmetrical': 'False'}),
            'volumes': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['archive.Volume']", 'symmetrical': 'False'})
        },
        'archive.file': {
            'audio_codec': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'bits_per_pixel': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'channels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'display_aspect_ratio': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'duration': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'episode': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'framerate': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'height': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'info': ('fields.DictField', [], {'default': '{}'}),
            'is_audio': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'is_extra': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'is_main': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'is_subtitle': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'is_version': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'is_video': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '8'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'files'", 'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '2048'}),
            'oshash': ('django.db.models.fields.CharField', [], {'max_length': '16'}),
            'part': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '255'}),
            'pixel_format': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'pixels': ('django.db.models.fields.BigIntegerField', [], {'default': '0'}),
            'samplerate': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'season': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'size': ('django.db.models.fields.BigIntegerField', [], {'default': '0'}),
            'sort_name': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '2048'}),
            'verified': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'version': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '255'}),
            'video_codec': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'width': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        'archive.fileinstance': {
            'accessed': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'archive': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'files'", 'to': "orm['archive.Archive']"}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'file': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'instances'", 'to': "orm['archive.File']"}),
            'folder': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'path': ('django.db.models.fields.CharField', [], {'max_length': '2048'}),
            'published': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'})
        },
        'archive.frame': {
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'file': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'frames'", 'to': "orm['archive.File']"}),
            'frame': ('django.db.models.fields.files.ImageField', [], {'default': 'None', 'max_length': '100', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'position': ('django.db.models.fields.FloatField', [], {})
        },
        'archive.volume': {
            'end': ('django.db.models.fields.CharField', [], {'max_length': '1'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'start': ('django.db.models.fields.CharField', [], {'max_length': '1'})
        },
        'auth.group': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'unique_together': "(('content_type', 'codename'),)"},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True', 'blank': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'backend.movie': {
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True', 'blank': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imdb': ('fields.DictField', [], {'default': '{}', 'editable': 'False'}),
            'json': ('fields.DictField', [], {'default': '{}', 'editable': 'False'}),
            'metadata': ('fields.DictField', [], {'default': '{}', 'editable': 'False'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movieId': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '128', 'blank': 'True'}),
            'oxdbId': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '42', 'blank': 'True'}),
            'poster_height': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'poster_width': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'published': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'scene_height': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'stream_high': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'}),
            'stream_low': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'}),
            'stream_mid': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'})
        },
        'contenttypes.contenttype': {
            'Meta': {'unique_together': "(('app_label', 'model'),)", 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        }
    }
    
    complete_apps = ['archive']
