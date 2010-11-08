# -*- coding: utf-8 -*-

from south.db import db
from django.db import models
from backend.models import *

class Migration:
    
    def forwards(self, orm):
        
        # Adding field 'Movie.poster_height'
        db.add_column('backend_movie', 'poster_height', orm['backend.movie:poster_height'])
        
        # Adding field 'Movie.poster_width'
        db.add_column('backend_movie', 'poster_width', orm['backend.movie:poster_width'])
        
    
    
    def backwards(self, orm):
        
        # Deleting field 'Movie.poster_height'
        db.delete_column('backend_movie', 'poster_height')
        
        # Deleting field 'Movie.poster_width'
        db.delete_column('backend_movie', 'poster_width')
        
    
    
    models = {
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
        'backend.alternativetitle': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'alternative_titles_all'", 'to': "orm['backend.Movie']"}),
            'title': ('django.db.models.fields.TextField', [], {}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '1000'})
        },
        'backend.archive': {
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'public': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'users': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.User']", 'symmetrical': 'False'})
        },
        'backend.archivefile': {
            'archive': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'files'", 'to': "orm['backend.Archive']"}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'file': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'archive_files'", 'to': "orm['backend.File']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'path': ('django.db.models.fields.CharField', [], {'max_length': '2048', 'blank': 'True'})
        },
        'backend.cast': {
            'character': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'cast_relation'", 'to': "orm['backend.Movie']"}),
            'person': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Person']"}),
            'position': ('django.db.models.fields.IntegerField', [], {}),
            'role': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        },
        'backend.collection': {
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movies': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '2048', 'blank': 'True'}),
            'subdomain': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '2048'}),
            'users': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.User']", 'symmetrical': 'False'})
        },
        'backend.connection': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'object': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"}),
            'relation': ('django.db.models.fields.CharField', [], {'max_length': '512'}),
            'subject': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'connections_all'", 'to': "orm['backend.Movie']"})
        },
        'backend.country': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']", 'symmetrical': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.file': {
            'audio_codec': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'bpp': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'channels': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'display_aspect_ratio': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'duration': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'framerate': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'height': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'info': ('fields.DictField', [], {'default': '{}'}),
            'md5': ('django.db.models.fields.CharField', [], {'max_length': '32', 'unique': 'True', 'null': 'True', 'blank': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'default': 'None', 'related_name': "'files'", 'null': 'True', 'to': "orm['backend.Movie']"}),
            'needs_data': ('django.db.models.fields.BooleanField', [], {'default': 'True', 'blank': 'True'}),
            'oshash': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '16', 'blank': 'True'}),
            'part': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'path': ('django.db.models.fields.CharField', [], {'max_length': '2048', 'blank': 'True'}),
            'pixel_aspect_ratio': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'pixel_format': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'pixels': ('django.db.models.fields.BigIntegerField', [], {'default': '0'}),
            'published': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'samplerate': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'sha1': ('django.db.models.fields.CharField', [], {'max_length': '40', 'unique': 'True', 'null': 'True', 'blank': 'True'}),
            'size': ('django.db.models.fields.BigIntegerField', [], {'default': '-1'}),
            'stream_high': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100'}),
            'stream_low': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100'}),
            'stream_mid': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100'}),
            'type': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'verified': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'video_codec': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'width': ('django.db.models.fields.IntegerField', [], {'default': '-1'})
        },
        'backend.frame': {
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'file': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'frames'", 'to': "orm['backend.File']"}),
            'frame': ('django.db.models.fields.files.ImageField', [], {'default': 'None', 'max_length': '100', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'position': ('django.db.models.fields.FloatField', [], {})
        },
        'backend.genre': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']", 'symmetrical': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.keyword': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']", 'symmetrical': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.language': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']", 'symmetrical': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.layer': {
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"}),
            'time_in': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'time_out': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'value': ('django.db.models.fields.TextField', [], {})
        },
        'backend.list': {
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']", 'symmetrical': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'public': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'backend.listitem': {
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'list': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.List']"}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"})
        },
        'backend.location': {
            'area': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'lat_center': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'lat_ne': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'lat_sw': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'lng_center': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'lng_ne': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'lng_sw': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']", 'symmetrical': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.movie': {
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True', 'blank': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'extra': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'movie'", 'unique': 'True', 'null': 'True', 'to': "orm['backend.MovieExtra']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imdb': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'movie'", 'unique': 'True', 'null': 'True', 'to': "orm['backend.MovieImdb']"}),
            'json': ('fields.DictField', [], {'default': '{}', 'editable': 'False'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movieId': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '128', 'blank': 'True'}),
            'oxdb': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'movie'", 'unique': 'True', 'null': 'True', 'to': "orm['backend.MovieOxdb']"}),
            'oxdbId': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '42', 'blank': 'True'}),
            'poster_height': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'poster_width': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'published': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'scene_height': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'stream_high': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'}),
            'stream_low': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'}),
            'stream_mid': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'})
        },
        'backend.moviecountry': {
            'country': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Country']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"}),
            'position': ('django.db.models.fields.IntegerField', [], {})
        },
        'backend.movieextra': {
            'contributor': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'rights_level': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '1000'})
        },
        'backend.moviefind': {
            'all': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'cast': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'cinematographer': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'country': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'director': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'editor': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'filename': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'genre': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'keywords': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'language': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'locations': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'find'", 'unique': 'True', 'primary_key': 'True', 'to': "orm['backend.Movie']"}),
            'producer': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'summary': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'title': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'trivia': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'writer': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'year': ('django.db.models.fields.CharField', [], {'max_length': '4'})
        },
        'backend.movieimdb': {
            'budget': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'episode': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'episode_title': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '1000', 'blank': 'True'}),
            'gross': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imdbId': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '7'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'plot': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'plot_outline': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'profit': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'rating': ('django.db.models.fields.FloatField', [], {'null': 'True', 'blank': 'True'}),
            'release_date': ('django.db.models.fields.DateField', [], {'null': 'True', 'blank': 'True'}),
            'runtime': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'season': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'series_imdb': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '7'}),
            'series_title': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '1000', 'blank': 'True'}),
            'tagline': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'votes': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'year': ('django.db.models.fields.CharField', [], {'max_length': '4'})
        },
        'backend.movielanguage': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Language']"}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"}),
            'position': ('django.db.models.fields.IntegerField', [], {})
        },
        'backend.movieoxdb': {
            'budget': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'episode': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'episode_title': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'gross': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'plot': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'plot_outline': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'profit': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'rating': ('django.db.models.fields.FloatField', [], {'null': 'True', 'blank': 'True'}),
            'release_date': ('django.db.models.fields.DateField', [], {'null': 'True', 'blank': 'True'}),
            'runtime': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'season': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'series_imdb': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '7'}),
            'series_title': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'tagline': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'votes': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'year': ('django.db.models.fields.CharField', [], {'max_length': '4'})
        },
        'backend.moviesort': {
            'aspectratio': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'bitrate': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'cast': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'cinematographer': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'connections': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'country': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'director': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'duration': ('django.db.models.fields.FloatField', [], {'default': '-1', 'db_index': 'True'}),
            'editor': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'filename': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'files': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'genre': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'keywords': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'language': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'sort'", 'unique': 'True', 'primary_key': 'True', 'to': "orm['backend.Movie']"}),
            'movieId': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '128', 'blank': 'True'}),
            'pixels': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'producer': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'rating': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'blank': 'True'}),
            'resolution': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'risk': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'runtime': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'scenes': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'size': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'summary': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'db_index': 'True'}),
            'trivia': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'votes': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'words': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'wpm': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'writer': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'year': ('django.db.models.fields.CharField', [], {'max_length': '4', 'db_index': 'True'})
        },
        'backend.person': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imdbId': ('django.db.models.fields.CharField', [], {'max_length': '7', 'blank': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']", 'symmetrical': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'name_sort': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        },
        'backend.review': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'reviews_all'", 'to': "orm['backend.Movie']"}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '2048', 'blank': 'True'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '2048', 'blank': 'True'})
        },
        'backend.reviewwhitelist': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'url': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'})
        },
        'backend.trivia': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'trivia_all'", 'to': "orm['backend.Movie']"}),
            'position': ('django.db.models.fields.IntegerField', [], {}),
            'trivia': ('django.db.models.fields.TextField', [], {})
        },
        'contenttypes.contenttype': {
            'Meta': {'unique_together': "(('app_label', 'model'),)", 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        }
    }
    
    complete_apps = ['backend']
