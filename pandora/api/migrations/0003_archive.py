# -*- coding: utf-8 -*-

from south.db import db
from django.db import models
from backend.models import *

class Migration:
    
    def forwards(self, orm):
        
        # Deleting unique_together for [imdb] on movie.
        db.delete_unique('backend_movie', ['imdb_id'])
        
        # Adding model 'Facet'
        db.create_table('backend_facet', (
            ('id', orm['backend.facet:id']),
            ('movie', orm['backend.facet:movie']),
            ('key', orm['backend.facet:key']),
            ('value', orm['backend.facet:value']),
            ('value_sort', orm['backend.facet:value_sort']),
        ))
        db.send_create_signal('backend', ['Facet'])
        
        # Adding field 'Movie.metadata'
        db.add_column('backend_movie', 'metadata', orm['backend.movie:metadata'])
        
        # Adding field 'MovieSort.director_desc'
        db.add_column('backend_moviesort', 'director_desc', orm['backend.moviesort:director_desc'])
        
        # Adding field 'MovieSort.writer_desc'
        db.add_column('backend_moviesort', 'writer_desc', orm['backend.moviesort:writer_desc'])
        
        # Adding field 'MovieSort.country_desc'
        db.add_column('backend_moviesort', 'country_desc', orm['backend.moviesort:country_desc'])
        
        # Adding field 'MovieFind.location'
        db.add_column('backend_moviefind', 'location', orm['backend.moviefind:location'])
        
        # Adding field 'MovieFind.actor'
        db.add_column('backend_moviefind', 'actor', orm['backend.moviefind:actor'])
        
        # Adding field 'MovieSort.producer_desc'
        db.add_column('backend_moviesort', 'producer_desc', orm['backend.moviesort:producer_desc'])
        
        # Adding field 'MovieSort.cinematographer_desc'
        db.add_column('backend_moviesort', 'cinematographer_desc', orm['backend.moviesort:cinematographer_desc'])
        
        # Adding field 'MovieSort.title_desc'
        db.add_column('backend_moviesort', 'title_desc', orm['backend.moviesort:title_desc'])
        
        # Adding field 'MovieSort.language_desc'
        db.add_column('backend_moviesort', 'language_desc', orm['backend.moviesort:language_desc'])
        
        # Adding field 'MovieSort.year_desc'
        db.add_column('backend_moviesort', 'year_desc', orm['backend.moviesort:year_desc'])
        
        # Adding field 'MovieFind.character'
        db.add_column('backend_moviefind', 'character', orm['backend.moviefind:character'])
        
        # Adding field 'MovieSort.editor_desc'
        db.add_column('backend_moviesort', 'editor_desc', orm['backend.moviesort:editor_desc'])
        
        # Adding field 'MovieFind.keyword'
        db.add_column('backend_moviefind', 'keyword', orm['backend.moviefind:keyword'])
        
        # Deleting field 'Movie.extra'
        db.delete_column('backend_movie', 'extra_id')
        
        # Deleting field 'MovieFind.cast'
        db.delete_column('backend_moviefind', 'cast')
        
        # Dropping ManyToManyField 'Person.movies'
        db.delete_table('backend_person_movies')
        
        # Deleting field 'Movie.oxdb'
        db.delete_column('backend_movie', 'oxdb_id')
        
        # Deleting field 'MovieFind.keywords'
        db.delete_column('backend_moviefind', 'keywords')
        
        # Deleting field 'MovieFind.locations'
        db.delete_column('backend_moviefind', 'locations')
        
        # Deleting model 'movieoxdb'
        db.delete_table('backend_movieoxdb')
        
        # Deleting model 'review'
        db.delete_table('backend_review')
        
        # Deleting model 'archive'
        db.delete_table('backend_archive')
        
        # Deleting model 'alternativetitle'
        db.delete_table('backend_alternativetitle')
        
        # Deleting model 'moviecountry'
        db.delete_table('backend_moviecountry')
        
        # Deleting model 'trivia'
        db.delete_table('backend_trivia')
        
        # Deleting model 'connection'
        db.delete_table('backend_connection')
        
        # Deleting model 'cast'
        db.delete_table('backend_cast')
        
        # Deleting model 'frame'
        db.delete_table('backend_frame')
        
        # Deleting model 'movielanguage'
        db.delete_table('backend_movielanguage')
        
        # Deleting model 'file'
        db.delete_table('backend_file')
        
        # Deleting model 'movieimdb'
        db.delete_table('backend_movieimdb')
        
        # Deleting model 'country'
        db.delete_table('backend_country')
        
        # Deleting model 'archivefile'
        db.delete_table('backend_archivefile')
        
        # Deleting model 'movieextra'
        db.delete_table('backend_movieextra')
        
        # Deleting model 'language'
        db.delete_table('backend_language')
        
        # Deleting model 'keyword'
        db.delete_table('backend_keyword')
        
        # Deleting model 'genre'
        db.delete_table('backend_genre')
        
        # Changing field 'Movie.imdb'
        # (to signature: fields.DictField(default={}, editable=False))
        db.alter_column('backend_movie', 'imdb', orm['backend.movie:imdb'])
        
    
    
    def backwards(self, orm):
        
        # Deleting model 'Facet'
        db.delete_table('backend_facet')
        
        # Deleting field 'Movie.metadata'
        db.delete_column('backend_movie', 'metadata')
        
        # Deleting field 'MovieSort.director_desc'
        db.delete_column('backend_moviesort', 'director_desc')
        
        # Deleting field 'MovieSort.writer_desc'
        db.delete_column('backend_moviesort', 'writer_desc')
        
        # Deleting field 'MovieSort.country_desc'
        db.delete_column('backend_moviesort', 'country_desc')
        
        # Deleting field 'MovieFind.location'
        db.delete_column('backend_moviefind', 'location')
        
        # Deleting field 'MovieFind.actor'
        db.delete_column('backend_moviefind', 'actor')
        
        # Deleting field 'MovieSort.producer_desc'
        db.delete_column('backend_moviesort', 'producer_desc')
        
        # Deleting field 'MovieSort.cinematographer_desc'
        db.delete_column('backend_moviesort', 'cinematographer_desc')
        
        # Deleting field 'MovieSort.title_desc'
        db.delete_column('backend_moviesort', 'title_desc')
        
        # Deleting field 'MovieSort.language_desc'
        db.delete_column('backend_moviesort', 'language_desc')
        
        # Deleting field 'MovieSort.year_desc'
        db.delete_column('backend_moviesort', 'year_desc')
        
        # Deleting field 'MovieFind.character'
        db.delete_column('backend_moviefind', 'character')
        
        # Deleting field 'MovieSort.editor_desc'
        db.delete_column('backend_moviesort', 'editor_desc')
        
        # Deleting field 'MovieFind.keyword'
        db.delete_column('backend_moviefind', 'keyword')
        
        # Adding field 'Movie.extra'
        db.add_column('backend_movie', 'extra', orm['backend.movie:extra'])
        
        # Adding field 'MovieFind.cast'
        db.add_column('backend_moviefind', 'cast', orm['backend.moviefind:cast'])
        
        # Adding ManyToManyField 'Person.movies'
        db.create_table('backend_person_movies', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('person', models.ForeignKey(orm.Person, null=False)),
            ('movie', models.ForeignKey(orm.movie, null=False))
        ))
        
        # Adding field 'Movie.oxdb'
        db.add_column('backend_movie', 'oxdb', orm['backend.movie:oxdb'])
        
        # Adding field 'MovieFind.keywords'
        db.add_column('backend_moviefind', 'keywords', orm['backend.moviefind:keywords'])
        
        # Adding field 'MovieFind.locations'
        db.add_column('backend_moviefind', 'locations', orm['backend.moviefind:locations'])
        
        # Adding model 'movieoxdb'
        db.create_table('backend_movieoxdb', (
            ('series_title', orm['backend.moviefind:series_title']),
            ('gross', orm['backend.moviefind:gross']),
            ('votes', orm['backend.moviefind:votes']),
            ('episode', orm['backend.moviefind:episode']),
            ('created', orm['backend.moviefind:created']),
            ('profit', orm['backend.moviefind:profit']),
            ('season', orm['backend.moviefind:season']),
            ('plot', orm['backend.moviefind:plot']),
            ('rating', orm['backend.moviefind:rating']),
            ('year', orm['backend.moviefind:year']),
            ('budget', orm['backend.moviefind:budget']),
            ('modified', orm['backend.moviefind:modified']),
            ('episode_title', orm['backend.moviefind:episode_title']),
            ('series_imdb', orm['backend.moviefind:series_imdb']),
            ('tagline', orm['backend.moviefind:tagline']),
            ('title', orm['backend.moviefind:title']),
            ('runtime', orm['backend.moviefind:runtime']),
            ('release_date', orm['backend.moviefind:release_date']),
            ('id', orm['backend.moviefind:id']),
            ('plot_outline', orm['backend.moviefind:plot_outline']),
        ))
        db.send_create_signal('backend', ['movieoxdb'])
        
        # Adding model 'review'
        db.create_table('backend_review', (
            ('title', orm['backend.moviefind:title']),
            ('url', orm['backend.moviefind:url']),
            ('movie', orm['backend.moviefind:movie']),
            ('manual', orm['backend.moviefind:manual']),
            ('id', orm['backend.moviefind:id']),
        ))
        db.send_create_signal('backend', ['review'])
        
        # Adding model 'archive'
        db.create_table('backend_archive', (
            ('users', orm['backend.moviefind:users']),
            ('created', orm['backend.moviefind:created']),
            ('modified', orm['backend.moviefind:modified']),
            ('id', orm['backend.moviefind:id']),
            ('public', orm['backend.moviefind:public']),
            ('name', orm['backend.moviefind:name']),
        ))
        db.send_create_signal('backend', ['archive'])
        
        # Adding model 'alternativetitle'
        db.create_table('backend_alternativetitle', (
            ('title', orm['backend.moviefind:title']),
            ('movie', orm['backend.moviefind:movie']),
            ('manual', orm['backend.moviefind:manual']),
            ('type', orm['backend.moviefind:type']),
            ('id', orm['backend.moviefind:id']),
        ))
        db.send_create_signal('backend', ['alternativetitle'])
        
        # Adding model 'moviecountry'
        db.create_table('backend_moviecountry', (
            ('country', orm['backend.moviefind:country']),
            ('manual', orm['backend.moviefind:manual']),
            ('movie', orm['backend.moviefind:movie']),
            ('position', orm['backend.moviefind:position']),
            ('id', orm['backend.moviefind:id']),
        ))
        db.send_create_signal('backend', ['moviecountry'])
        
        # Adding model 'trivia'
        db.create_table('backend_trivia', (
            ('movie', orm['backend.moviefind:movie']),
            ('manual', orm['backend.moviefind:manual']),
            ('position', orm['backend.moviefind:position']),
            ('trivia', orm['backend.moviefind:trivia']),
            ('id', orm['backend.moviefind:id']),
        ))
        db.send_create_signal('backend', ['trivia'])
        
        # Adding model 'connection'
        db.create_table('backend_connection', (
            ('object', orm['backend.moviefind:object']),
            ('manual', orm['backend.moviefind:manual']),
            ('relation', orm['backend.moviefind:relation']),
            ('id', orm['backend.moviefind:id']),
            ('subject', orm['backend.moviefind:subject']),
        ))
        db.send_create_signal('backend', ['connection'])
        
        # Adding model 'cast'
        db.create_table('backend_cast', (
            ('character', orm['backend.moviefind:character']),
            ('manual', orm['backend.moviefind:manual']),
            ('person', orm['backend.moviefind:person']),
            ('role', orm['backend.moviefind:role']),
            ('movie', orm['backend.moviefind:movie']),
            ('position', orm['backend.moviefind:position']),
            ('id', orm['backend.moviefind:id']),
        ))
        db.send_create_signal('backend', ['cast'])
        
        # Adding model 'frame'
        db.create_table('backend_frame', (
            ('created', orm['backend.moviefind:created']),
            ('frame', orm['backend.moviefind:frame']),
            ('modified', orm['backend.moviefind:modified']),
            ('file', orm['backend.moviefind:file']),
            ('position', orm['backend.moviefind:position']),
            ('id', orm['backend.moviefind:id']),
        ))
        db.send_create_signal('backend', ['frame'])
        
        # Adding model 'movielanguage'
        db.create_table('backend_movielanguage', (
            ('language', orm['backend.moviefind:language']),
            ('movie', orm['backend.moviefind:movie']),
            ('manual', orm['backend.moviefind:manual']),
            ('position', orm['backend.moviefind:position']),
            ('id', orm['backend.moviefind:id']),
        ))
        db.send_create_signal('backend', ['movielanguage'])
        
        # Adding model 'file'
        db.create_table('backend_file', (
            ('available', orm['backend.moviefind:available']),
            ('needs_data', orm['backend.moviefind:needs_data']),
            ('pixel_aspect_ratio', orm['backend.moviefind:pixel_aspect_ratio']),
            ('stream_high', orm['backend.moviefind:stream_high']),
            ('pixel_format', orm['backend.moviefind:pixel_format']),
            ('oshash', orm['backend.moviefind:oshash']),
            ('stream_low', orm['backend.moviefind:stream_low']),
            ('height', orm['backend.moviefind:height']),
            ('channels', orm['backend.moviefind:channels']),
            ('part', orm['backend.moviefind:part']),
            ('display_aspect_ratio', orm['backend.moviefind:display_aspect_ratio']),
            ('audio_codec', orm['backend.moviefind:audio_codec']),
            ('duration', orm['backend.moviefind:duration']),
            ('path', orm['backend.moviefind:path']),
            ('samplerate', orm['backend.moviefind:samplerate']),
            ('id', orm['backend.moviefind:id']),
            ('md5', orm['backend.moviefind:md5']),
            ('info', orm['backend.moviefind:info']),
            ('sha1', orm['backend.moviefind:sha1']),
            ('verified', orm['backend.moviefind:verified']),
            ('created', orm['backend.moviefind:created']),
            ('movie', orm['backend.moviefind:movie']),
            ('framerate', orm['backend.moviefind:framerate']),
            ('modified', orm['backend.moviefind:modified']),
            ('pixels', orm['backend.moviefind:pixels']),
            ('bpp', orm['backend.moviefind:bpp']),
            ('stream_mid', orm['backend.moviefind:stream_mid']),
            ('published', orm['backend.moviefind:published']),
            ('video_codec', orm['backend.moviefind:video_codec']),
            ('size', orm['backend.moviefind:size']),
            ('type', orm['backend.moviefind:type']),
            ('width', orm['backend.moviefind:width']),
        ))
        db.send_create_signal('backend', ['file'])
        
        # Adding model 'movieimdb'
        db.create_table('backend_movieimdb', (
            ('rating', orm['backend.moviefind:rating']),
            ('modified', orm['backend.moviefind:modified']),
            ('year', orm['backend.moviefind:year']),
            ('id', orm['backend.moviefind:id']),
            ('gross', orm['backend.moviefind:gross']),
            ('votes', orm['backend.moviefind:votes']),
            ('title', orm['backend.moviefind:title']),
            ('profit', orm['backend.moviefind:profit']),
            ('tagline', orm['backend.moviefind:tagline']),
            ('season', orm['backend.moviefind:season']),
            ('plot', orm['backend.moviefind:plot']),
            ('imdbId', orm['backend.moviefind:imdbId']),
            ('series_imdb', orm['backend.moviefind:series_imdb']),
            ('series_title', orm['backend.moviefind:series_title']),
            ('episode', orm['backend.moviefind:episode']),
            ('created', orm['backend.moviefind:created']),
            ('release_date', orm['backend.moviefind:release_date']),
            ('budget', orm['backend.moviefind:budget']),
            ('episode_title', orm['backend.moviefind:episode_title']),
            ('runtime', orm['backend.moviefind:runtime']),
            ('plot_outline', orm['backend.moviefind:plot_outline']),
        ))
        db.send_create_signal('backend', ['movieimdb'])
        
        # Adding model 'country'
        db.create_table('backend_country', (
            ('movies', orm['backend.moviefind:movies']),
            ('id', orm['backend.moviefind:id']),
            ('name', orm['backend.moviefind:name']),
        ))
        db.send_create_signal('backend', ['country'])
        
        # Adding model 'archivefile'
        db.create_table('backend_archivefile', (
            ('created', orm['backend.moviefind:created']),
            ('modified', orm['backend.moviefind:modified']),
            ('archive', orm['backend.moviefind:archive']),
            ('file', orm['backend.moviefind:file']),
            ('path', orm['backend.moviefind:path']),
            ('id', orm['backend.moviefind:id']),
        ))
        db.send_create_signal('backend', ['archivefile'])
        
        # Adding model 'movieextra'
        db.create_table('backend_movieextra', (
            ('rights_level', orm['backend.moviefind:rights_level']),
            ('description', orm['backend.moviefind:description']),
            ('created', orm['backend.moviefind:created']),
            ('title', orm['backend.moviefind:title']),
            ('modified', orm['backend.moviefind:modified']),
            ('contributor', orm['backend.moviefind:contributor']),
            ('id', orm['backend.moviefind:id']),
        ))
        db.send_create_signal('backend', ['movieextra'])
        
        # Adding model 'language'
        db.create_table('backend_language', (
            ('movies', orm['backend.moviefind:movies']),
            ('id', orm['backend.moviefind:id']),
            ('name', orm['backend.moviefind:name']),
        ))
        db.send_create_signal('backend', ['language'])
        
        # Adding model 'keyword'
        db.create_table('backend_keyword', (
            ('movies', orm['backend.moviefind:movies']),
            ('manual', orm['backend.moviefind:manual']),
            ('id', orm['backend.moviefind:id']),
            ('name', orm['backend.moviefind:name']),
        ))
        db.send_create_signal('backend', ['keyword'])
        
        # Adding model 'genre'
        db.create_table('backend_genre', (
            ('movies', orm['backend.moviefind:movies']),
            ('manual', orm['backend.moviefind:manual']),
            ('id', orm['backend.moviefind:id']),
            ('name', orm['backend.moviefind:name']),
        ))
        db.send_create_signal('backend', ['genre'])
        
        # Changing field 'Movie.imdb'
        # (to signature: django.db.models.fields.related.OneToOneField(unique=True, null=True, to=orm['backend.MovieImdb']))
        db.alter_column('backend_movie', 'imdb', orm['backend.movie:imdb'])
        
        # Creating unique_together for [imdb] on movie.
        db.create_unique('backend_movie', ['imdb_id'])
        
    
    
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
        'backend.collection': {
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movies': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '2048', 'blank': 'True'}),
            'subdomain': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '2048'}),
            'users': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.User']", 'symmetrical': 'False'})
        },
        'backend.facet': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '200', 'db_index': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'facets'", 'to': "orm['backend.Movie']"}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'value_sort': ('django.db.models.fields.CharField', [], {'max_length': '200'})
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
        'backend.moviefind': {
            'actor': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'all': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'character': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'cinematographer': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'country': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'director': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'editor': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'filename': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'genre': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'keyword': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'language': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'location': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'find'", 'unique': 'True', 'primary_key': 'True', 'to': "orm['backend.Movie']"}),
            'producer': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'summary': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'title': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'trivia': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'writer': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'year': ('django.db.models.fields.CharField', [], {'max_length': '4'})
        },
        'backend.moviesort': {
            'aspectratio': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'bitrate': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'cast': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'cinematographer': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'cinematographer_desc': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'connections': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'country': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'country_desc': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'director': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'director_desc': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'duration': ('django.db.models.fields.FloatField', [], {'default': '-1', 'db_index': 'True'}),
            'editor': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'editor_desc': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'filename': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'files': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'genre': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'keywords': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'language': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'language_desc': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'sort'", 'unique': 'True', 'primary_key': 'True', 'to': "orm['backend.Movie']"}),
            'movieId': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '128', 'blank': 'True'}),
            'pixels': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'producer': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'producer_desc': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'rating': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'blank': 'True'}),
            'resolution': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'risk': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'runtime': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'scenes': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'size': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'summary': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'db_index': 'True'}),
            'title_desc': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'db_index': 'True'}),
            'trivia': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'votes': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'words': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'wpm': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'writer': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'writer_desc': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'year': ('django.db.models.fields.CharField', [], {'max_length': '4', 'db_index': 'True'}),
            'year_desc': ('django.db.models.fields.CharField', [], {'max_length': '4', 'db_index': 'True'})
        },
        'backend.person': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imdbId': ('django.db.models.fields.CharField', [], {'max_length': '7', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'name_sort': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        },
        'backend.reviewwhitelist': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'url': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'})
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
