# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Deleting model 'archive'
        db.delete_table('archive_archive')

        # Removing M2M table for field users on 'archive'
        db.delete_table('archive_archive_users')

        # Removing M2M table for field volumes on 'archive'
        db.delete_table('archive_archive_volumes')

        # Adding model 'Stream'
        db.create_table('archive_stream', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('file', self.gf('django.db.models.fields.related.ForeignKey')(related_name='streams', to=orm['archive.File'])),
            ('profile', self.gf('django.db.models.fields.CharField')(default='96p.webm', max_length=255)),
            ('video', self.gf('django.db.models.fields.files.FileField')(default=None, max_length=100, blank=True)),
            ('source', self.gf('django.db.models.fields.related.ForeignKey')(default=None, related_name='derivatives', blank=True, to=orm['archive.Stream'])),
            ('available', self.gf('django.db.models.fields.BooleanField')(default=False, blank=True)),
        ))
        db.send_create_signal('archive', ['Stream'])

        # Deleting field 'volume.start'
        db.delete_column('archive_volume', 'start')

        # Deleting field 'volume.end'
        db.delete_column('archive_volume', 'end')

        # Adding field 'Volume.created'
        db.add_column('archive_volume', 'created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, default=datetime.datetime(2010, 8, 9, 14, 19, 30, 463275), blank=True), keep_default=False)

        # Adding field 'Volume.modified'
        db.add_column('archive_volume', 'modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, default=datetime.datetime(2010, 8, 9, 14, 19, 42, 576261), blank=True), keep_default=False)

        # Adding field 'Volume.user'
        db.add_column('archive_volume', 'user', self.gf('django.db.models.fields.related.ForeignKey')(default=None, related_name='volumes', to=orm['auth.User']), keep_default=False)

        # Changing field 'Volume.name'
        db.alter_column('archive_volume', 'name', self.gf('django.db.models.fields.CharField')(max_length=1024))

        # Adding unique constraint on 'Volume', fields ['user', 'name']
        db.create_unique('archive_volume', ['user_id', 'name'])

        # Adding unique constraint on 'Frame', fields ['position', 'file']
        db.create_unique('archive_frame', ['position', 'file_id'])

        # Adding field 'File.available'
        db.add_column('archive_file', 'available', self.gf('django.db.models.fields.BooleanField')(default=False, blank=True), keep_default=False)

        # Changing field 'File.info'
        db.alter_column('archive_file', 'info', self.gf('oxdjango.fields.DictField')())

        # Deleting field 'fileinstance.published'
        db.delete_column('archive_fileinstance', 'published')

        # Deleting field 'fileinstance.accessed'
        db.delete_column('archive_fileinstance', 'accessed')

        # Deleting field 'fileinstance.archive'
        db.delete_column('archive_fileinstance', 'archive_id')

        # Adding field 'FileInstance.ctime'
        db.add_column('archive_fileinstance', 'ctime', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now), keep_default=False)

        # Adding field 'FileInstance.mtime'
        db.add_column('archive_fileinstance', 'mtime', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now), keep_default=False)

        # Adding field 'FileInstance.atime'
        db.add_column('archive_fileinstance', 'atime', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now), keep_default=False)

        # Adding field 'FileInstance.volume'
        db.add_column('archive_fileinstance', 'volume', self.gf('django.db.models.fields.related.ForeignKey')(default=None, related_name='files', to=orm['archive.Volume']), keep_default=False)

        # Adding unique constraint on 'FileInstance', fields ['volume', 'path', 'folder']
        db.create_unique('archive_fileinstance', ['volume_id', 'path', 'folder'])


    def backwards(self, orm):
        
        # Adding model 'archive'
        db.create_table('archive_archive', (
            ('name', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(related_name='owned_archives', to=orm['auth.User'])),
            ('published', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
        ))
        db.send_create_signal('archive', ['archive'])

        # Adding M2M table for field users on 'archive'
        db.create_table('archive_archive_users', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('archive', models.ForeignKey(orm['archive.archive'], null=False)),
            ('user', models.ForeignKey(orm['auth.user'], null=False))
        ))
        db.create_unique('archive_archive_users', ['archive_id', 'user_id'])

        # Adding M2M table for field volumes on 'archive'
        db.create_table('archive_archive_volumes', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('archive', models.ForeignKey(orm['archive.archive'], null=False)),
            ('volume', models.ForeignKey(orm['archive.volume'], null=False))
        ))
        db.create_unique('archive_archive_volumes', ['archive_id', 'volume_id'])

        # Deleting model 'Stream'
        db.delete_table('archive_stream')

        # Adding field 'volume.start'
        db.add_column('archive_volume', 'start', self.gf('django.db.models.fields.CharField')(default='', max_length=1), keep_default=False)

        # Adding field 'volume.end'
        db.add_column('archive_volume', 'end', self.gf('django.db.models.fields.CharField')(default='', max_length=1), keep_default=False)

        # Deleting field 'Volume.created'
        db.delete_column('archive_volume', 'created')

        # Deleting field 'Volume.modified'
        db.delete_column('archive_volume', 'modified')

        # Deleting field 'Volume.user'
        db.delete_column('archive_volume', 'user_id')

        # Changing field 'Volume.name'
        db.alter_column('archive_volume', 'name', self.gf('django.db.models.fields.CharField')(max_length=255))

        # Removing unique constraint on 'Volume', fields ['user', 'name']
        db.delete_unique('archive_volume', ['user_id', 'name'])

        # Removing unique constraint on 'Frame', fields ['position', 'file']
        db.delete_unique('archive_frame', ['position', 'file_id'])

        # Deleting field 'File.available'
        db.delete_column('archive_file', 'available')

        # Changing field 'File.info'
        db.alter_column('archive_file', 'info', self.gf('fields.DictField')())

        # Adding field 'fileinstance.published'
        db.add_column('archive_fileinstance', 'published', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now), keep_default=False)

        # Adding field 'fileinstance.accessed'
        db.add_column('archive_fileinstance', 'accessed', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now), keep_default=False)

        # Adding field 'fileinstance.archive'
        db.add_column('archive_fileinstance', 'archive', self.gf('django.db.models.fields.related.ForeignKey')(default=None, related_name='files', to=orm['archive.Archive']), keep_default=False)

        # Deleting field 'FileInstance.ctime'
        db.delete_column('archive_fileinstance', 'ctime')

        # Deleting field 'FileInstance.mtime'
        db.delete_column('archive_fileinstance', 'mtime')

        # Deleting field 'FileInstance.atime'
        db.delete_column('archive_fileinstance', 'atime')

        # Deleting field 'FileInstance.volume'
        db.delete_column('archive_fileinstance', 'volume_id')

        # Removing unique constraint on 'FileInstance', fields ['volume', 'path', 'folder']
        db.delete_unique('archive_fileinstance', ['volume_id', 'path', 'folder'])


    models = {
        'archive.file': {
            'Meta': {'object_name': 'File'},
            'audio_codec': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'bits_per_pixel': ('django.db.models.fields.FloatField', [], {'default': '-1'}),
            'channels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'display_aspect_ratio': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'duration': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'episode': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'framerate': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'height': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'info': ('oxdjango.fields.DictField', [], {'default': '{}'}),
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
            'Meta': {'unique_together': "(('path', 'folder', 'volume'),)", 'object_name': 'FileInstance'},
            'atime': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'ctime': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'file': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'instances'", 'to': "orm['archive.File']"}),
            'folder': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'mtime': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'path': ('django.db.models.fields.CharField', [], {'max_length': '2048'}),
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'files'", 'to': "orm['archive.Volume']"})
        },
        'archive.frame': {
            'Meta': {'unique_together': "(('file', 'position'),)", 'object_name': 'Frame'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'file': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'frames'", 'to': "orm['archive.File']"}),
            'frame': ('django.db.models.fields.files.ImageField', [], {'default': 'None', 'max_length': '100', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'position': ('django.db.models.fields.FloatField', [], {})
        },
        'archive.stream': {
            'Meta': {'unique_together': "(('file', 'profile'),)", 'object_name': 'Stream'},
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'file': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'streams'", 'to': "orm['archive.File']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'profile': ('django.db.models.fields.CharField', [], {'default': "'96p.webm'", 'max_length': '255'}),
            'source': ('django.db.models.fields.related.ForeignKey', [], {'default': 'None', 'related_name': "'derivatives'", 'blank': 'True', 'to': "orm['archive.Stream']"}),
            'video': ('django.db.models.fields.files.FileField', [], {'default': 'None', 'max_length': '100', 'blank': 'True'})
        },
        'archive.volume': {
            'Meta': {'unique_together': "(('user', 'name'),)", 'object_name': 'Volume'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '1024'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'volumes'", 'to': "orm['auth.User']"})
        },
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
            'poster_width': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'posters_url': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'published': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'stream_aspect': ('django.db.models.fields.FloatField', [], {'default': '1.3333333333333333'})
        },
        'contenttypes.contenttype': {
            'Meta': {'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        }
    }

    complete_apps = ['archive']
