# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Deleting field 'ItemFind.all'
        db.delete_column('backend_itemfind', 'all')

        # Deleting field 'ItemFind.trivia'
        db.delete_column('backend_itemfind', 'trivia')

        # Deleting field 'ItemFind.language'
        db.delete_column('backend_itemfind', 'language')

        # Deleting field 'ItemFind.keyword'
        db.delete_column('backend_itemfind', 'keyword')

        # Deleting field 'ItemFind.title'
        db.delete_column('backend_itemfind', 'title')

        # Deleting field 'ItemFind.country'
        db.delete_column('backend_itemfind', 'country')

        # Deleting field 'ItemFind.producer'
        db.delete_column('backend_itemfind', 'producer')

        # Deleting field 'ItemFind.writer'
        db.delete_column('backend_itemfind', 'writer')

        # Deleting field 'ItemFind.character'
        db.delete_column('backend_itemfind', 'character')

        # Deleting field 'ItemFind.actor'
        db.delete_column('backend_itemfind', 'actor')

        # Deleting field 'ItemFind.filename'
        db.delete_column('backend_itemfind', 'filename')

        # Deleting field 'ItemFind.director'
        db.delete_column('backend_itemfind', 'director')

        # Deleting field 'ItemFind.cinematographer'
        db.delete_column('backend_itemfind', 'cinematographer')

        # Deleting field 'ItemFind.editor'
        db.delete_column('backend_itemfind', 'editor')

        # Deleting field 'ItemFind.dialog'
        db.delete_column('backend_itemfind', 'dialog')

        # Deleting field 'ItemFind.year'
        db.delete_column('backend_itemfind', 'year')

        # Deleting field 'ItemFind.genre'
        db.delete_column('backend_itemfind', 'genre')

        # Deleting field 'ItemFind.summary'
        db.delete_column('backend_itemfind', 'summary')

        # Deleting field 'ItemFind.location'
        db.delete_column('backend_itemfind', 'location')

        # Adding field 'ItemFind.id'
        db.add_column('backend_itemfind', 'id', self.gf('django.db.models.fields.AutoField')(default=None, primary_key=True), keep_default=False)

        # Adding field 'ItemFind.key'
        db.add_column('backend_itemfind', 'key', self.gf('django.db.models.fields.CharField')(default=None, max_length=200), keep_default=False)

        # Adding field 'ItemFind.value'
        db.add_column('backend_itemfind', 'value', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Changing field 'ItemFind.item'
        db.alter_column('backend_itemfind', 'item_id', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['backend.Item']))

        # Removing unique constraint on 'ItemFind', fields ['item']
        db.delete_unique('backend_itemfind', ['item_id'])

        # Adding unique constraint on 'ItemFind', fields ['item', 'key']
        db.create_unique('backend_itemfind', ['item_id', 'key'])

        # Adding unique constraint on 'PosterUrl', fields ['url', 'item', 'service']
        db.create_unique('backend_posterurl', ['url', 'item_id', 'service'])


    def backwards(self, orm):
        
        # Adding field 'ItemFind.all'
        db.add_column('backend_itemfind', 'all', self.gf('django.db.models.fields.TextField')(default=None, blank=True), keep_default=False)

        # Adding field 'ItemFind.trivia'
        db.add_column('backend_itemfind', 'trivia', self.gf('django.db.models.fields.TextField')(default=None, blank=True), keep_default=False)

        # Adding field 'ItemFind.language'
        db.add_column('backend_itemfind', 'language', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding field 'ItemFind.keyword'
        db.add_column('backend_itemfind', 'keyword', self.gf('django.db.models.fields.TextField')(default=None, blank=True), keep_default=False)

        # Adding field 'ItemFind.title'
        db.add_column('backend_itemfind', 'title', self.gf('django.db.models.fields.TextField')(default=None, blank=True), keep_default=False)

        # Adding field 'ItemFind.country'
        db.add_column('backend_itemfind', 'country', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding field 'ItemFind.producer'
        db.add_column('backend_itemfind', 'producer', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding field 'ItemFind.writer'
        db.add_column('backend_itemfind', 'writer', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding field 'ItemFind.character'
        db.add_column('backend_itemfind', 'character', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding field 'ItemFind.actor'
        db.add_column('backend_itemfind', 'actor', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding field 'ItemFind.filename'
        db.add_column('backend_itemfind', 'filename', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding field 'ItemFind.director'
        db.add_column('backend_itemfind', 'director', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding field 'ItemFind.cinematographer'
        db.add_column('backend_itemfind', 'cinematographer', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding field 'ItemFind.editor'
        db.add_column('backend_itemfind', 'editor', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding field 'ItemFind.dialog'
        db.add_column('backend_itemfind', 'dialog', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding field 'ItemFind.year'
        db.add_column('backend_itemfind', 'year', self.gf('django.db.models.fields.CharField')(default=None, max_length=4), keep_default=False)

        # Adding field 'ItemFind.genre'
        db.add_column('backend_itemfind', 'genre', self.gf('django.db.models.fields.TextField')(default=None, blank=True), keep_default=False)

        # Adding field 'ItemFind.summary'
        db.add_column('backend_itemfind', 'summary', self.gf('django.db.models.fields.TextField')(default=None, blank=True), keep_default=False)

        # Adding field 'ItemFind.location'
        db.add_column('backend_itemfind', 'location', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Deleting field 'ItemFind.id'
        db.delete_column('backend_itemfind', 'id')

        # Deleting field 'ItemFind.key'
        db.delete_column('backend_itemfind', 'key')

        # Deleting field 'ItemFind.value'
        db.delete_column('backend_itemfind', 'value')

        # Changing field 'ItemFind.item'
        db.alter_column('backend_itemfind', 'item_id', self.gf('django.db.models.fields.related.OneToOneField')(unique=True, primary_key=True, to=orm['backend.Item']))

        # Adding unique constraint on 'ItemFind', fields ['item']
        db.create_unique('backend_itemfind', ['item_id'])

        # Removing unique constraint on 'ItemFind', fields ['item', 'key']
        db.delete_unique('backend_itemfind', ['item_id', 'key'])

        # Removing unique constraint on 'PosterUrl', fields ['url', 'item', 'service']
        db.delete_unique('backend_posterurl', ['url', 'item_id', 'service'])


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
            'items': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Item']"}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '2048', 'blank': 'True'}),
            'subdomain': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '2048'}),
            'users': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'collections'", 'symmetrical': 'False', 'to': "orm['auth.User']"})
        },
        'backend.facet': {
            'Meta': {'object_name': 'Facet'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'facets'", 'to': "orm['backend.Item']"}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '200', 'db_index': 'True'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'value_sort': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        },
        'backend.item': {
            'Meta': {'object_name': 'Item'},
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True', 'blank': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imdb': ('oxdjango.fields.DictField', [], {'default': '{}'}),
            'itemId': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '128', 'blank': 'True'}),
            'json': ('oxdjango.fields.DictField', [], {'default': '{}'}),
            'metadata': ('oxdjango.fields.DictField', [], {'default': '{}'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'oxdbId': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '42', 'blank': 'True'}),
            'poster': ('django.db.models.fields.files.ImageField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'}),
            'poster_frame': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'poster_height': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'poster_url': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'poster_width': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'published': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'stream_aspect': ('django.db.models.fields.FloatField', [], {'default': '1.3333333333333333'})
        },
        'backend.itemfind': {
            'Meta': {'unique_together': "(('item', 'key'),)", 'object_name': 'ItemFind'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'find'", 'to': "orm['backend.Item']"}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'value': ('django.db.models.fields.TextField', [], {'blank': 'True'})
        },
        'backend.itemsort': {
            'Meta': {'object_name': 'ItemSort'},
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
            'item': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'sort'", 'unique': 'True', 'primary_key': 'True', 'to': "orm['backend.Item']"}),
            'itemId': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '128', 'blank': 'True'}),
            'keywords': ('django.db.models.fields.IntegerField', [], {'db_index': 'True', 'blank': 'True'}),
            'language': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
            'language_desc': ('django.db.models.fields.TextField', [], {'db_index': 'True', 'blank': 'True'}),
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
        'backend.layer': {
            'Meta': {'object_name': 'Layer'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Item']"}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
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
            'items': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'lists'", 'symmetrical': 'False', 'through': "orm['backend.ListItem']", 'to': "orm['backend.Item']"}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'public': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'backend.listitem': {
            'Meta': {'object_name': 'ListItem'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.Item']"}),
            'list': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['backend.List']"}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'backend.location': {
            'Meta': {'object_name': 'Location'},
            'area': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'items': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'locations_all'", 'symmetrical': 'False', 'to': "orm['backend.Item']"}),
            'lat_center': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'lat_ne': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'lat_sw': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'lng_center': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'lng_ne': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'lng_sw': ('django.db.models.fields.FloatField', [], {'default': '0'}),
            'manual': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'})
        },
        'backend.person': {
            'Meta': {'object_name': 'Person'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imdbId': ('django.db.models.fields.CharField', [], {'max_length': '7', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'name_sort': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        },
        'backend.posterurl': {
            'Meta': {'unique_together': "(('item', 'service', 'url'),)", 'object_name': 'PosterUrl'},
            'height': ('django.db.models.fields.IntegerField', [], {'default': '128'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'poster_urls'", 'to': "orm['backend.Item']"}),
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
            'Meta': {'unique_together': "(('item', 'profile'),)", 'object_name': 'Stream'},
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'info': ('oxdjango.fields.DictField', [], {'default': '{}'}),
            'item': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'streams'", 'to': "orm['backend.Item']"}),
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
