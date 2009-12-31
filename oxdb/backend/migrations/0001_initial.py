# -*- coding: utf-8 -*-

from south.db import db
from django.db import models
from backend.models import *

class Migration:
    
    def forwards(self, orm):
        
        # Adding model 'Trivia'
        db.create_table('backend_trivia', (
            ('id', orm['backend.Trivia:id']),
            ('trivia', orm['backend.Trivia:trivia']),
            ('manual', orm['backend.Trivia:manual']),
            ('position', orm['backend.Trivia:position']),
            ('movie', orm['backend.Trivia:movie']),
        ))
        db.send_create_signal('backend', ['Trivia'])
        
        # Adding model 'AlternativeTitle'
        db.create_table('backend_alternativetitle', (
            ('id', orm['backend.AlternativeTitle:id']),
            ('movie', orm['backend.AlternativeTitle:movie']),
            ('title', orm['backend.AlternativeTitle:title']),
            ('type', orm['backend.AlternativeTitle:type']),
            ('manual', orm['backend.AlternativeTitle:manual']),
        ))
        db.send_create_signal('backend', ['AlternativeTitle'])
        
        # Adding model 'MovieLanguage'
        db.create_table('backend_movielanguage', (
            ('id', orm['backend.MovieLanguage:id']),
            ('movie', orm['backend.MovieLanguage:movie']),
            ('language', orm['backend.MovieLanguage:language']),
            ('position', orm['backend.MovieLanguage:position']),
            ('manual', orm['backend.MovieLanguage:manual']),
        ))
        db.send_create_signal('backend', ['MovieLanguage'])
        
        # Adding model 'Movie'
        db.create_table('backend_movie', (
            ('id', orm['backend.Movie:id']),
            ('created', orm['backend.Movie:created']),
            ('modified', orm['backend.Movie:modified']),
            ('available', orm['backend.Movie:available']),
            ('movieId', orm['backend.Movie:movieId']),
            ('oxdbId', orm['backend.Movie:oxdbId']),
            ('imdb', orm['backend.Movie:imdb']),
            ('oxdb', orm['backend.Movie:oxdb']),
            ('rights_level', orm['backend.Movie:rights_level']),
            ('title', orm['backend.Movie:title']),
            ('year', orm['backend.Movie:year']),
            ('runtime', orm['backend.Movie:runtime']),
            ('release_date', orm['backend.Movie:release_date']),
            ('tagline', orm['backend.Movie:tagline']),
            ('plot', orm['backend.Movie:plot']),
            ('plot_outline', orm['backend.Movie:plot_outline']),
            ('rating', orm['backend.Movie:rating']),
            ('votes', orm['backend.Movie:votes']),
            ('budget', orm['backend.Movie:budget']),
            ('gross', orm['backend.Movie:gross']),
            ('profit', orm['backend.Movie:profit']),
            ('series_imdb', orm['backend.Movie:series_imdb']),
            ('series_title', orm['backend.Movie:series_title']),
            ('episode_title', orm['backend.Movie:episode_title']),
            ('season', orm['backend.Movie:season']),
            ('episode', orm['backend.Movie:episode']),
            ('directors', orm['backend.Movie:directors']),
            ('writers', orm['backend.Movie:writers']),
            ('editors', orm['backend.Movie:editors']),
            ('producers', orm['backend.Movie:producers']),
            ('cinematographers', orm['backend.Movie:cinematographers']),
            ('cast', orm['backend.Movie:cast']),
            ('alternative_titles', orm['backend.Movie:alternative_titles']),
            ('genres', orm['backend.Movie:genres']),
            ('keywords', orm['backend.Movie:keywords']),
            ('countries', orm['backend.Movie:countries']),
            ('languages', orm['backend.Movie:languages']),
            ('trivia', orm['backend.Movie:trivia']),
            ('locations', orm['backend.Movie:locations']),
            ('connections', orm['backend.Movie:connections']),
            ('reviews', orm['backend.Movie:reviews']),
            ('stream128', orm['backend.Movie:stream128']),
            ('stream320', orm['backend.Movie:stream320']),
            ('stream640', orm['backend.Movie:stream640']),
            ('scene_height', orm['backend.Movie:scene_height']),
        ))
        db.send_create_signal('backend', ['Movie'])
        
        # Adding model 'Archive'
        db.create_table('backend_archive', (
            ('id', orm['backend.Archive:id']),
            ('created', orm['backend.Archive:created']),
            ('modified', orm['backend.Archive:modified']),
            ('name', orm['backend.Archive:name']),
            ('public', orm['backend.Archive:public']),
        ))
        db.send_create_signal('backend', ['Archive'])
        
        # Adding model 'ArchiveFile'
        db.create_table('backend_archivefile', (
            ('id', orm['backend.ArchiveFile:id']),
            ('created', orm['backend.ArchiveFile:created']),
            ('modified', orm['backend.ArchiveFile:modified']),
            ('archive', orm['backend.ArchiveFile:archive']),
            ('file', orm['backend.ArchiveFile:file']),
            ('path', orm['backend.ArchiveFile:path']),
        ))
        db.send_create_signal('backend', ['ArchiveFile'])
        
        # Adding model 'MovieOxdb'
        db.create_table('backend_movieoxdb', (
            ('id', orm['backend.MovieOxdb:id']),
            ('created', orm['backend.MovieOxdb:created']),
            ('modified', orm['backend.MovieOxdb:modified']),
            ('title', orm['backend.MovieOxdb:title']),
            ('year', orm['backend.MovieOxdb:year']),
            ('runtime', orm['backend.MovieOxdb:runtime']),
            ('release_date', orm['backend.MovieOxdb:release_date']),
            ('tagline', orm['backend.MovieOxdb:tagline']),
            ('plot', orm['backend.MovieOxdb:plot']),
            ('plot_outline', orm['backend.MovieOxdb:plot_outline']),
            ('rating', orm['backend.MovieOxdb:rating']),
            ('votes', orm['backend.MovieOxdb:votes']),
            ('budget', orm['backend.MovieOxdb:budget']),
            ('gross', orm['backend.MovieOxdb:gross']),
            ('profit', orm['backend.MovieOxdb:profit']),
            ('series_imdb', orm['backend.MovieOxdb:series_imdb']),
            ('series_title', orm['backend.MovieOxdb:series_title']),
            ('episode_title', orm['backend.MovieOxdb:episode_title']),
            ('season', orm['backend.MovieOxdb:season']),
            ('episode', orm['backend.MovieOxdb:episode']),
        ))
        db.send_create_signal('backend', ['MovieOxdb'])
        
        # Adding model 'Language'
        db.create_table('backend_language', (
            ('id', orm['backend.Language:id']),
            ('name', orm['backend.Language:name']),
        ))
        db.send_create_signal('backend', ['Language'])
        
        # Adding model 'ReviewWhitelist'
        db.create_table('backend_reviewwhitelist', (
            ('id', orm['backend.ReviewWhitelist:id']),
            ('name', orm['backend.ReviewWhitelist:name']),
            ('url', orm['backend.ReviewWhitelist:url']),
        ))
        db.send_create_signal('backend', ['ReviewWhitelist'])
        
        # Adding model 'Layer'
        db.create_table('backend_layer', (
            ('id', orm['backend.Layer:id']),
            ('created', orm['backend.Layer:created']),
            ('modified', orm['backend.Layer:modified']),
            ('user', orm['backend.Layer:user']),
            ('movie', orm['backend.Layer:movie']),
            ('time_in', orm['backend.Layer:time_in']),
            ('time_out', orm['backend.Layer:time_out']),
            ('type', orm['backend.Layer:type']),
            ('value', orm['backend.Layer:value']),
        ))
        db.send_create_signal('backend', ['Layer'])
        
        # Adding model 'MovieSort'
        db.create_table('backend_moviesort', (
            ('movie', orm['backend.MovieSort:movie']),
            ('title', orm['backend.MovieSort:title']),
            ('director', orm['backend.MovieSort:director']),
            ('country', orm['backend.MovieSort:country']),
            ('year', orm['backend.MovieSort:year']),
            ('producer', orm['backend.MovieSort:producer']),
            ('writer', orm['backend.MovieSort:writer']),
            ('editor', orm['backend.MovieSort:editor']),
            ('cinematographer', orm['backend.MovieSort:cinematographer']),
            ('language', orm['backend.MovieSort:language']),
            ('runtime', orm['backend.MovieSort:runtime']),
            ('keywords', orm['backend.MovieSort:keywords']),
            ('genre', orm['backend.MovieSort:genre']),
            ('cast', orm['backend.MovieSort:cast']),
            ('summary', orm['backend.MovieSort:summary']),
            ('trivia', orm['backend.MovieSort:trivia']),
            ('connections', orm['backend.MovieSort:connections']),
            ('rating', orm['backend.MovieSort:rating']),
            ('votes', orm['backend.MovieSort:votes']),
            ('scenes', orm['backend.MovieSort:scenes']),
            ('words', orm['backend.MovieSort:words']),
            ('wpm', orm['backend.MovieSort:wpm']),
            ('risk', orm['backend.MovieSort:risk']),
            ('movieId', orm['backend.MovieSort:movieId']),
            ('duration', orm['backend.MovieSort:duration']),
            ('resolution', orm['backend.MovieSort:resolution']),
            ('aspectratio', orm['backend.MovieSort:aspectratio']),
            ('bitrate', orm['backend.MovieSort:bitrate']),
            ('pixels', orm['backend.MovieSort:pixels']),
            ('filename', orm['backend.MovieSort:filename']),
            ('files', orm['backend.MovieSort:files']),
            ('size', orm['backend.MovieSort:size']),
        ))
        db.send_create_signal('backend', ['MovieSort'])
        
        # Adding model 'File'
        db.create_table('backend_file', (
            ('id', orm['backend.File:id']),
            ('created', orm['backend.File:created']),
            ('modified', orm['backend.File:modified']),
            ('oshash', orm['backend.File:oshash']),
            ('sha1', orm['backend.File:sha1']),
            ('md5', orm['backend.File:md5']),
            ('movie', orm['backend.File:movie']),
            ('computed_path', orm['backend.File:computed_path']),
            ('size', orm['backend.File:size']),
            ('duration', orm['backend.File:duration']),
            ('is_video', orm['backend.File:is_video']),
            ('video_codec', orm['backend.File:video_codec']),
            ('pixel_format', orm['backend.File:pixel_format']),
            ('width', orm['backend.File:width']),
            ('height', orm['backend.File:height']),
            ('pixel_aspect_ratio', orm['backend.File:pixel_aspect_ratio']),
            ('display_aspect_ratio', orm['backend.File:display_aspect_ratio']),
            ('framerate', orm['backend.File:framerate']),
            ('audio_codec', orm['backend.File:audio_codec']),
            ('samplerate', orm['backend.File:samplerate']),
            ('channels', orm['backend.File:channels']),
            ('bpp', orm['backend.File:bpp']),
            ('pixels', orm['backend.File:pixels']),
            ('part', orm['backend.File:part']),
            ('available', orm['backend.File:available']),
            ('stream128', orm['backend.File:stream128']),
            ('stream320', orm['backend.File:stream320']),
            ('stream640', orm['backend.File:stream640']),
        ))
        db.send_create_signal('backend', ['File'])
        
        # Adding model 'Country'
        db.create_table('backend_country', (
            ('id', orm['backend.Country:id']),
            ('name', orm['backend.Country:name']),
        ))
        db.send_create_signal('backend', ['Country'])
        
        # Adding model 'Genre'
        db.create_table('backend_genre', (
            ('id', orm['backend.Genre:id']),
            ('name', orm['backend.Genre:name']),
            ('manual', orm['backend.Genre:manual']),
        ))
        db.send_create_signal('backend', ['Genre'])
        
        # Adding model 'MovieCountry'
        db.create_table('backend_moviecountry', (
            ('id', orm['backend.MovieCountry:id']),
            ('movie', orm['backend.MovieCountry:movie']),
            ('country', orm['backend.MovieCountry:country']),
            ('position', orm['backend.MovieCountry:position']),
            ('manual', orm['backend.MovieCountry:manual']),
        ))
        db.send_create_signal('backend', ['MovieCountry'])
        
        # Adding model 'Review'
        db.create_table('backend_review', (
            ('id', orm['backend.Review:id']),
            ('movie', orm['backend.Review:movie']),
            ('title', orm['backend.Review:title']),
            ('url', orm['backend.Review:url']),
            ('manual', orm['backend.Review:manual']),
        ))
        db.send_create_signal('backend', ['Review'])
        
        # Adding model 'Subtitle'
        db.create_table('backend_subtitle', (
            ('id', orm['backend.Subtitle:id']),
            ('created', orm['backend.Subtitle:created']),
            ('modified', orm['backend.Subtitle:modified']),
            ('user', orm['backend.Subtitle:user']),
            ('file', orm['backend.Subtitle:file']),
            ('language', orm['backend.Subtitle:language']),
            ('srt', orm['backend.Subtitle:srt']),
        ))
        db.send_create_signal('backend', ['Subtitle'])
        
        # Adding model 'Cast'
        db.create_table('backend_cast', (
            ('id', orm['backend.Cast:id']),
            ('movie', orm['backend.Cast:movie']),
            ('person', orm['backend.Cast:person']),
            ('role', orm['backend.Cast:role']),
            ('character', orm['backend.Cast:character']),
            ('position', orm['backend.Cast:position']),
            ('manual', orm['backend.Cast:manual']),
        ))
        db.send_create_signal('backend', ['Cast'])
        
        # Adding model 'Person'
        db.create_table('backend_person', (
            ('id', orm['backend.Person:id']),
            ('name', orm['backend.Person:name']),
            ('imdbId', orm['backend.Person:imdbId']),
            ('name_sort', orm['backend.Person:name_sort']),
        ))
        db.send_create_signal('backend', ['Person'])
        
        # Adding model 'Keyword'
        db.create_table('backend_keyword', (
            ('id', orm['backend.Keyword:id']),
            ('name', orm['backend.Keyword:name']),
            ('manual', orm['backend.Keyword:manual']),
        ))
        db.send_create_signal('backend', ['Keyword'])
        
        # Adding model 'MovieImdb'
        db.create_table('backend_movieimdb', (
            ('id', orm['backend.MovieImdb:id']),
            ('created', orm['backend.MovieImdb:created']),
            ('modified', orm['backend.MovieImdb:modified']),
            ('imdbId', orm['backend.MovieImdb:imdbId']),
            ('title', orm['backend.MovieImdb:title']),
            ('year', orm['backend.MovieImdb:year']),
            ('runtime', orm['backend.MovieImdb:runtime']),
            ('release_date', orm['backend.MovieImdb:release_date']),
            ('tagline', orm['backend.MovieImdb:tagline']),
            ('plot', orm['backend.MovieImdb:plot']),
            ('plot_outline', orm['backend.MovieImdb:plot_outline']),
            ('rating', orm['backend.MovieImdb:rating']),
            ('votes', orm['backend.MovieImdb:votes']),
            ('budget', orm['backend.MovieImdb:budget']),
            ('gross', orm['backend.MovieImdb:gross']),
            ('profit', orm['backend.MovieImdb:profit']),
            ('series_imdb', orm['backend.MovieImdb:series_imdb']),
            ('series_title', orm['backend.MovieImdb:series_title']),
            ('episode_title', orm['backend.MovieImdb:episode_title']),
            ('season', orm['backend.MovieImdb:season']),
            ('episode', orm['backend.MovieImdb:episode']),
        ))
        db.send_create_signal('backend', ['MovieImdb'])
        
        # Adding model 'List'
        db.create_table('backend_list', (
            ('id', orm['backend.List:id']),
            ('created', orm['backend.List:created']),
            ('modified', orm['backend.List:modified']),
            ('user', orm['backend.List:user']),
            ('name', orm['backend.List:name']),
            ('public', orm['backend.List:public']),
        ))
        db.send_create_signal('backend', ['List'])
        
        # Adding model 'Connection'
        db.create_table('backend_connection', (
            ('id', orm['backend.Connection:id']),
            ('subject', orm['backend.Connection:subject']),
            ('relation', orm['backend.Connection:relation']),
            ('object', orm['backend.Connection:object']),
            ('manual', orm['backend.Connection:manual']),
        ))
        db.send_create_signal('backend', ['Connection'])
        
        # Adding model 'Location'
        db.create_table('backend_location', (
            ('id', orm['backend.Location:id']),
            ('name', orm['backend.Location:name']),
            ('manual', orm['backend.Location:manual']),
            ('lat_sw', orm['backend.Location:lat_sw']),
            ('lng_sw', orm['backend.Location:lng_sw']),
            ('lat_ne', orm['backend.Location:lat_ne']),
            ('lng_ne', orm['backend.Location:lng_ne']),
            ('lat_center', orm['backend.Location:lat_center']),
            ('lng_center', orm['backend.Location:lng_center']),
            ('area', orm['backend.Location:area']),
        ))
        db.send_create_signal('backend', ['Location'])
        
        # Adding model 'MovieFind'
        db.create_table('backend_moviefind', (
            ('movie', orm['backend.MovieFind:movie']),
            ('all', orm['backend.MovieFind:all']),
            ('title', orm['backend.MovieFind:title']),
            ('director', orm['backend.MovieFind:director']),
            ('country', orm['backend.MovieFind:country']),
            ('year', orm['backend.MovieFind:year']),
            ('language', orm['backend.MovieFind:language']),
            ('writer', orm['backend.MovieFind:writer']),
            ('producer', orm['backend.MovieFind:producer']),
            ('editor', orm['backend.MovieFind:editor']),
            ('cinematographer', orm['backend.MovieFind:cinematographer']),
            ('cast', orm['backend.MovieFind:cast']),
            ('genre', orm['backend.MovieFind:genre']),
            ('keywords', orm['backend.MovieFind:keywords']),
            ('summary', orm['backend.MovieFind:summary']),
            ('trivia', orm['backend.MovieFind:trivia']),
            ('locations', orm['backend.MovieFind:locations']),
            ('filename', orm['backend.MovieFind:filename']),
        ))
        db.send_create_signal('backend', ['MovieFind'])
        
        # Adding model 'ListItem'
        db.create_table('backend_listitem', (
            ('id', orm['backend.ListItem:id']),
            ('created', orm['backend.ListItem:created']),
            ('modified', orm['backend.ListItem:modified']),
            ('list', orm['backend.ListItem:list']),
            ('movie', orm['backend.ListItem:movie']),
        ))
        db.send_create_signal('backend', ['ListItem'])
        
        # Adding ManyToManyField 'Location.movies'
        db.create_table('backend_location_movies', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('location', models.ForeignKey(orm.Location, null=False)),
            ('movie', models.ForeignKey(orm.Movie, null=False))
        ))
        
        # Adding ManyToManyField 'Archive.users'
        db.create_table('backend_archive_users', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('archive', models.ForeignKey(orm.Archive, null=False)),
            ('user', models.ForeignKey(orm['auth.User'], null=False))
        ))
        
        # Adding ManyToManyField 'Keyword.movies'
        db.create_table('backend_keyword_movies', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('keyword', models.ForeignKey(orm.Keyword, null=False)),
            ('movie', models.ForeignKey(orm.Movie, null=False))
        ))
        
        # Adding ManyToManyField 'Genre.movies'
        db.create_table('backend_genre_movies', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('genre', models.ForeignKey(orm.Genre, null=False)),
            ('movie', models.ForeignKey(orm.Movie, null=False))
        ))
        
    
    
    def backwards(self, orm):
        
        # Deleting model 'Trivia'
        db.delete_table('backend_trivia')
        
        # Deleting model 'AlternativeTitle'
        db.delete_table('backend_alternativetitle')
        
        # Deleting model 'MovieLanguage'
        db.delete_table('backend_movielanguage')
        
        # Deleting model 'Movie'
        db.delete_table('backend_movie')
        
        # Deleting model 'Archive'
        db.delete_table('backend_archive')
        
        # Deleting model 'ArchiveFile'
        db.delete_table('backend_archivefile')
        
        # Deleting model 'MovieOxdb'
        db.delete_table('backend_movieoxdb')
        
        # Deleting model 'Language'
        db.delete_table('backend_language')
        
        # Deleting model 'ReviewWhitelist'
        db.delete_table('backend_reviewwhitelist')
        
        # Deleting model 'Layer'
        db.delete_table('backend_layer')
        
        # Deleting model 'MovieSort'
        db.delete_table('backend_moviesort')
        
        # Deleting model 'File'
        db.delete_table('backend_file')
        
        # Deleting model 'Country'
        db.delete_table('backend_country')
        
        # Deleting model 'Genre'
        db.delete_table('backend_genre')
        
        # Deleting model 'MovieCountry'
        db.delete_table('backend_moviecountry')
        
        # Deleting model 'Review'
        db.delete_table('backend_review')
        
        # Deleting model 'Subtitle'
        db.delete_table('backend_subtitle')
        
        # Deleting model 'Cast'
        db.delete_table('backend_cast')
        
        # Deleting model 'Person'
        db.delete_table('backend_person')
        
        # Deleting model 'Keyword'
        db.delete_table('backend_keyword')
        
        # Deleting model 'MovieImdb'
        db.delete_table('backend_movieimdb')
        
        # Deleting model 'List'
        db.delete_table('backend_list')
        
        # Deleting model 'Connection'
        db.delete_table('backend_connection')
        
        # Deleting model 'Location'
        db.delete_table('backend_location')
        
        # Deleting model 'MovieFind'
        db.delete_table('backend_moviefind')
        
        # Deleting model 'ListItem'
        db.delete_table('backend_listitem')
        
        # Dropping ManyToManyField 'Location.movies'
        db.delete_table('backend_location_movies')
        
        # Dropping ManyToManyField 'Archive.users'
        db.delete_table('backend_archive_users')
        
        # Dropping ManyToManyField 'Keyword.movies'
        db.delete_table('backend_keyword_movies')
        
        # Dropping ManyToManyField 'Genre.movies'
        db.delete_table('backend_genre_movies')
        
    
    
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
            'users': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.User']"})
        },
        'backend.archivefile': {
            'archive': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'files'", 'to': "orm['backend.Archive']"}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'file': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.File']"}),
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
        'backend.connection': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'object': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"}),
            'relation': ('django.db.models.fields.CharField', [], {'max_length': '512'}),
            'subject': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'connections_all'", 'to': "orm['backend.Movie']"})
        },
        'backend.country': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.file': {
            'audio_codec': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'bpp': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'channels': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'computed_path': ('django.db.models.fields.CharField', [], {'max_length': '2048', 'blank': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'display_aspect_ratio': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'duration': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'framerate': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'height': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_video': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'md5': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '32', 'blank': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'default': 'None', 'related_name': "'files'", 'to': "orm['backend.Movie']"}),
            'oshash': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '16', 'blank': 'True'}),
            'part': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'pixel_aspect_ratio': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'pixel_format': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'pixels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'samplerate': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'sha1': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '40', 'blank': 'True'}),
            'size': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'stream128': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100'}),
            'stream320': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100'}),
            'stream640': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100'}),
            'video_codec': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'width': ('django.db.models.fields.IntegerField', [], {'default': '-1'})
        },
        'backend.genre': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.keyword': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.language': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']"}),
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
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.movie': {
            'alternative_titles': ('fields.TupleField', [], {'default': '()'}),
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True', 'blank': 'True'}),
            'budget': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'cast': ('fields.TupleField', [], {'default': '()'}),
            'cinematographers': ('fields.TupleField', [], {'default': '()'}),
            'connections': ('fields.TupleField', [], {'default': '()'}),
            'countries': ('fields.TupleField', [], {'default': '()'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'directors': ('fields.TupleField', [], {'default': '()'}),
            'editors': ('fields.TupleField', [], {'default': '()'}),
            'episode': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'episode_title': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'genres': ('fields.TupleField', [], {'default': '()'}),
            'gross': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imdb': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'movie'", 'unique': 'True', 'null': 'True', 'to': "orm['backend.MovieImdb']"}),
            'keywords': ('fields.TupleField', [], {'default': '()'}),
            'languages': ('fields.TupleField', [], {'default': '()'}),
            'locations': ('fields.TupleField', [], {'default': '()'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movieId': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '128', 'blank': 'True'}),
            'oxdb': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'movie'", 'unique': 'True', 'null': 'True', 'to': "orm['backend.MovieOxdb']"}),
            'oxdbId': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '42', 'blank': 'True'}),
            'plot': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'plot_outline': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'producers': ('fields.TupleField', [], {'default': '()'}),
            'profit': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'rating': ('django.db.models.fields.FloatField', [], {'null': 'True', 'blank': 'True'}),
            'release_date': ('django.db.models.fields.DateField', [], {'null': 'True', 'blank': 'True'}),
            'reviews': ('fields.TupleField', [], {'default': '()'}),
            'rights_level': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'runtime': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'scene_height': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'season': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'series_imdb': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '7'}),
            'series_title': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'stream128': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100'}),
            'stream320': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100'}),
            'stream640': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100'}),
            'tagline': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'trivia': ('fields.TupleField', [], {'default': '()'}),
            'votes': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'writers': ('fields.TupleField', [], {'default': '()'}),
            'year': ('django.db.models.fields.CharField', [], {'max_length': '4'})
        },
        'backend.moviecountry': {
            'country': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Country']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"}),
            'position': ('django.db.models.fields.IntegerField', [], {})
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
            'keywords': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'language': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'movie': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'sort'", 'unique': 'True', 'primary_key': 'True', 'to': "orm['backend.Movie']"}),
            'movieId': ('django.db.models.fields.CharField', [], {'max_length': '128', 'blank': 'True'}),
            'pixels': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'producer': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'rating': ('django.db.models.fields.FloatField', [], {'blank': 'True'}),
            'resolution': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'risk': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'runtime': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'scenes': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'size': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'summary': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'trivia': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
            'votes': ('django.db.models.fields.IntegerField', [], {'blank': 'True'}),
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
        'backend.subtitle': {
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'file': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'subtitles'", 'to': "orm['backend.File']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'max_length': '16'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'srt': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
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
