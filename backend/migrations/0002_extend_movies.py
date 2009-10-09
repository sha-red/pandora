# -*- coding: utf-8 -*-

from south.db import db
from django.db import models
from oxdb.backend.models import *

class Migration:
    
    def forwards(self, orm):
        
        # Adding field 'Movie.available'
        db.add_column('backend_movie', 'available', orm['backend.movie:available'])
        
        # Deleting field 'Movie.filename'
        db.delete_column('backend_movie', 'filename')
        
        # Deleting field 'Movie.extracted'
        db.delete_column('backend_movie', 'extracted')
        
        # Deleting field 'Movie.files_modified'
        db.delete_column('backend_movie', 'files_modified')
        
        # Deleting model 'file'
        db.delete_table('backend_file')
        
        # Deleting model 'archivefile'
        db.delete_table('backend_archivefile')
        
        # Deleting model 'subtitle'
        db.delete_table('backend_subtitle')
        
        # Deleting model 'archive'
        db.delete_table('backend_archive')
        
    
    
    def backwards(self, orm):
        
        # Deleting field 'Movie.available'
        db.delete_column('backend_movie', 'available')
        
        # Adding field 'Movie.filename'
        db.add_column('backend_movie', 'filename', orm['backend.movie:filename'])
        
        # Adding field 'Movie.extracted'
        db.add_column('backend_movie', 'extracted', orm['backend.movie:extracted'])
        
        # Adding field 'Movie.files_modified'
        db.add_column('backend_movie', 'files_modified', orm['backend.movie:files_modified'])
        
        # Adding model 'file'
        db.create_table('backend_file', (
            ('computed_path', orm['backend.movie:computed_path']),
            ('pixel_format', orm['backend.movie:pixel_format']),
            ('height', orm['backend.movie:height']),
            ('channels', orm['backend.movie:channels']),
            ('audio_codec', orm['backend.movie:audio_codec']),
            ('duration', orm['backend.movie:duration']),
            ('samplerate', orm['backend.movie:samplerate']),
            ('id', orm['backend.movie:id']),
            ('size', orm['backend.movie:size']),
            ('width', orm['backend.movie:width']),
            ('movie', orm['backend.movie:movie']),
            ('pixel_aspect_ratio', orm['backend.movie:pixel_aspect_ratio']),
            ('oshash', orm['backend.movie:oshash']),
            ('part', orm['backend.movie:part']),
            ('display_aspect_ratio', orm['backend.movie:display_aspect_ratio']),
            ('pixels', orm['backend.movie:pixels']),
            ('md5', orm['backend.movie:md5']),
            ('sha1', orm['backend.movie:sha1']),
            ('created', orm['backend.movie:created']),
            ('framerate', orm['backend.movie:framerate']),
            ('modified', orm['backend.movie:modified']),
            ('bpp', orm['backend.movie:bpp']),
            ('video_codec', orm['backend.movie:video_codec']),
        ))
        db.send_create_signal('backend', ['file'])
        
        # Adding model 'archivefile'
        db.create_table('backend_archivefile', (
            ('created', orm['backend.movie:created']),
            ('modified', orm['backend.movie:modified']),
            ('archive', orm['backend.movie:archive']),
            ('movie_file', orm['backend.movie:movie_file']),
            ('path', orm['backend.movie:path']),
            ('id', orm['backend.movie:id']),
        ))
        db.send_create_signal('backend', ['archivefile'])
        
        # Adding model 'subtitle'
        db.create_table('backend_subtitle', (
            ('language', orm['backend.movie:language']),
            ('created', orm['backend.movie:created']),
            ('modified', orm['backend.movie:modified']),
            ('user', orm['backend.movie:user']),
            ('srt', orm['backend.movie:srt']),
            ('movie_file', orm['backend.movie:movie_file']),
            ('id', orm['backend.movie:id']),
        ))
        db.send_create_signal('backend', ['subtitle'])
        
        # Adding model 'archive'
        db.create_table('backend_archive', (
            ('name', orm['backend.movie:name']),
            ('created', orm['backend.movie:created']),
            ('modified', orm['backend.movie:modified']),
            ('id', orm['backend.movie:id']),
            ('users', orm['backend.movie:users']),
        ))
        db.send_create_signal('backend', ['archive'])
        
    
    
    models = {
        'auth.group': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'blank': 'True'})
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
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True', 'blank': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'backend.alternativetitle': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'alternative_titles'", 'to': "orm['backend.Movie']"}),
            'title': ('django.db.models.fields.TextField', [], {}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '1000'})
        },
        'backend.cast': {
            'character': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"}),
            'person': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Person']"}),
            'position': ('django.db.models.fields.IntegerField', [], {}),
            'role': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        },
        'backend.connection': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'object': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"}),
            'relation': ('django.db.models.fields.CharField', [], {'max_length': '512'}),
            'subject': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'connections'", 'to': "orm['backend.Movie']"})
        },
        'backend.country': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.genre': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.keyword': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.language': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.list': {
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']"}),
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
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.movie': {
            'accessed': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'budget': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'duration': ('django.db.models.fields.FloatField', [], {'null': 'True', 'blank': 'True'}),
            'episode': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'episode_title': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'gross': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imdbId': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '7', 'blank': 'True'}),
            'kg_id': ('django.db.models.fields.CharField', [], {'max_length': '128', 'blank': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movieId': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '128', 'blank': 'True'}),
            'open_subtitle_id': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'oxdbId': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '42', 'blank': 'True'}),
            'plot': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'plot_outline': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'poster': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'poster_height': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'poster_width': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'posters_available': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'posters_disabled': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'profit': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'rating': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'release_date': ('django.db.models.fields.DateField', [], {'null': 'True', 'blank': 'True'}),
            'rights_level': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'runtime': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'scene_height': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'season': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'series_imdb': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '7'}),
            'series_title': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'still_pos': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'tagline': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'tpb_id': ('django.db.models.fields.CharField', [], {'max_length': '128', 'blank': 'True'}),
            'votes': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'wikipedia_url': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'year': ('django.db.models.fields.CharField', [], {'max_length': '4'})
        },
        'backend.moviecountry': {
            'country': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Country']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"}),
            'position': ('django.db.models.fields.IntegerField', [], {})
        },
        'backend.moviefind': {
            'all': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'cast': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'cinematographer': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'country': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'director': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'editor': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'filename': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'genre': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'keywords': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'language': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'locations': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'find'", 'unique': 'True', 'to': "orm['backend.Movie']"}),
            'producer': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'summary': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'trivia': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'writer': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'year': ('django.db.models.fields.CharField', [], {'max_length': '4'})
        },
        'backend.movielanguage': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Language']"}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"}),
            'position': ('django.db.models.fields.IntegerField', [], {})
        },
        'backend.moviesort': {
            'aspectratio': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'bitrate': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'cast': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'cinematographer': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'connections': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'country': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'director': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'duration': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'editor': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'filename': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'files': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'genre': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'keywords': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'language': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'sort'", 'unique': 'True', 'to': "orm['backend.Movie']"}),
            'movieId': ('django.db.models.fields.CharField', [], {'max_length': '128', 'blank': 'True'}),
            'pixels': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'producer': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'resolution': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'risk': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'runtime': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'scenes': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'size': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'summary': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'trivia': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'words': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'wpm': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'writer': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'year': ('django.db.models.fields.CharField', [], {'max_length': '4'})
        },
        'backend.person': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imdbId': ('django.db.models.fields.CharField', [], {'max_length': '7', 'blank': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'name_sort': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        },
        'backend.review': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'reviews'", 'to': "orm['backend.Movie']"}),
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
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'trivia'", 'to': "orm['backend.Movie']"}),
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
