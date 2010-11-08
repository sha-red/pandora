# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'PosterUrl'
        db.create_table('backend_posterurl', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('movie', self.gf('django.db.models.fields.related.ForeignKey')(related_name='poster_urls', to=orm['backend.Movie'])),
            ('url', self.gf('django.db.models.fields.CharField')(max_length=1024)),
            ('service', self.gf('django.db.models.fields.CharField')(max_length=1024)),
            ('width', self.gf('django.db.models.fields.IntegerField')(default=80)),
            ('height', self.gf('django.db.models.fields.IntegerField')(default=128)),
        ))
        db.send_create_signal('backend', ['PosterUrl'])


    def backwards(self, orm):
        
        # Deleting model 'PosterUrl'
        db.delete_table('backend_posterurl')


    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
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
            'Meta': {'object_name': 'Collection'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movies': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '2048', 'blank': 'True'}),
            'subdomain': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '2048'}),
            'users': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'collections'", 'symmetrical': 'False', 'to': "orm['auth.User']"})
        },
        'backend.facet': {
            'Meta': {'object_name': 'Facet'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '200', 'db_index': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'facets'", 'to': "orm['backend.Movie']"}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'value_sort': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        },
        'backend.layer': {
            'Meta': {'object_name': 'Layer'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"}),
            'start': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'stop': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'value': ('django.db.models.fields.TextField', [], {})
        },
        'backend.list': {
            'Meta': {'object_name': 'List'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'lists'", 'symmetrical': 'False', 'through': "orm['backend.ListItem']", 'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'public': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'backend.listitem': {
            'Meta': {'object_name': 'ListItem'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'list': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.List']"}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Movie']"})
        },
        'backend.location': {
            'Meta': {'object_name': 'Location'},
            'area': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'lat_center': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'lat_ne': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'lat_sw': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'lng_center': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'lng_ne': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'lng_sw': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'movies': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'locations_all'", 'symmetrical': 'False', 'to': "orm['backend.Movie']"}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.movie': {
            'Meta': {'object_name': 'Movie'},
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True', 'blank': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imdb': ('oxdjango.fields.DictField', [], {'default': '{}'}),
            'json': ('oxdjango.fields.DictField', [], {'default': '{}'}),
            'metadata': ('oxdjango.fields.DictField', [], {'default': '{}'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'movieId': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '128', 'blank': 'True'}),
            'oxdbId': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '42', 'blank': 'True'}),
            'poster': ('django.db.models.fields.files.ImageField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'}),
            'poster_frame': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'poster_height': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'poster_url': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'poster_width': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'published': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'stream_aspect': ('django.db.models.fields.FloatField', [], {'default': '1.3333333333333333'})
        },
        'backend.moviefind': {
            'Meta': {'object_name': 'MovieFind'},
            'actor': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'all': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'character': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'cinematographer': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'country': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
            'dialog': ('django.db.models.fields.TextField', [], {'default': "''", 'blank': 'True'}),
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
            'Meta': {'object_name': 'MovieSort'},
            'aspectratio': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'bitrate': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'cast': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'cinematographer': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'cinematographer_desc': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'connections': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'country': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'country_desc': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'dialog': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
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
            'Meta': {'object_name': 'Person'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imdbId': ('django.db.models.fields.CharField', [], {'max_length': '7', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'name_sort': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        },
        'backend.posterurl': {
            'Meta': {'object_name': 'PosterUrl'},
            'height': ('django.db.models.fields.IntegerField', [], {'default': '128'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'poster_urls'", 'to': "orm['backend.Movie']"}),
            'service': ('django.db.models.fields.CharField', [], {'max_length': '1024'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '1024'}),
            'width': ('django.db.models.fields.IntegerField', [], {'default': '80'})
        },
        'backend.reviewwhitelist': {
            'Meta': {'object_name': 'ReviewWhitelist'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'url': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'})
        },
        'backend.stream': {
            'Meta': {'unique_together': "(('movie', 'profile'),)", 'object_name': 'Stream'},
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'info': ('oxdjango.fields.DictField', [], {'default': '{}'}),
            'movie': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'streams'", 'to': "orm['backend.Movie']"}),
            'profile': ('django.db.models.fields.CharField', [], {'default': "'96p.webm'", 'max_length': '255'}),
            'source': ('django.db.models.fields.related.ForeignKey', [], {'default': 'None', 'related_name': "'derivatives'", 'null': 'True', 'to': "orm['backend.Stream']"}),
            'video': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'})
        },
        'contenttypes.contenttype': {
            'Meta': {'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        }
    }

    complete_apps = ['backend']
