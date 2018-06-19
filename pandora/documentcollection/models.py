# -*- coding: utf-8 -*-
from __future__ import division, print_function, absolute_import

import os
import re
import subprocess
from glob import glob

from django.db import models
from django.db.models import Max
from django.contrib.auth.models import User, Group
from django.conf import settings
from django.utils.encoding import python_2_unicode_compatible

import ox

from oxdjango.fields import DictField, TupleField

from archive import extract
from user.utils import update_groups

from . import managers


def get_path(f, x):
    return f.path(x)

def get_icon_path(f, x):
    return get_path(f, 'icon.jpg')

def get_collectionview():
    return settings.CONFIG['user']['ui']['collectionView']

def get_collectionsort():
    return tuple(settings.CONFIG['user']['ui']['collectionSort'])

@python_2_unicode_compatible
class Collection(models.Model):

    class Meta:
        unique_together = ("user", "name")

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, related_name='collections')
    groups = models.ManyToManyField(Group, blank=True, related_name='collections')
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, default='private')
    _status = ['private', 'public', 'featured']
    query = DictField(default={"static": True})
    type = models.CharField(max_length=255, default='static')
    description = models.TextField(default='')

    icon = models.ImageField(default=None, blank=True, upload_to=get_icon_path)

    view = models.TextField(default=get_collectionview)
    sort = TupleField(default=get_collectionsort, editable=False)

    poster_frames = TupleField(default=[], editable=False)

    #is through table still required?
    documents = models.ManyToManyField('document.Document', related_name='collections',
                                   through='CollectionDocument')

    numberofdocuments = models.IntegerField(default=0)
    subscribed_users = models.ManyToManyField(User, related_name='subscribed_collections')

    objects = managers.CollectionManager()

    def save(self, *args, **kwargs):
        if self.query.get('static', False):
            self.type = 'static'
        else:
            self.type = 'smart'
        if self.id:
            self.numberofdocuments = self.get_numberofdocuments(self.user)
        super(Collection, self).save(*args, **kwargs)

    @classmethod
    def get(cls, id):
        id = id.split(':')
        username = id[0]
        collectionname = ":".join(id[1:])
        return cls.objects.get(user__username=username, name=collectionname)

    def get_documents(self, user=None):
        if self.query.get('static', False):
            return self.documents
        from document.models import Document
        return Document.objects.find({'query': self.query}, user)

    def get_numberofdocuments(self, user=None):
        return self.get_documents(user).count()

    def add(self, document):
        q = self.documents.filter(id=document.id)
        if q.count() == 0:
            l = CollectionDocument()
            l.collection = self
            l.document = document
            l.index = CollectionDocument.objects.filter(collection=self).aggregate(Max('index'))['index__max']
            if l.index is None:
                l.index = 0
            else:
                l.index += 1
            l.save()

    def remove(self, document=None, documents=None):
        if document:
            CollectionDocument.objects.all().filter(document=document, collection=self).delete()
        if documents:
            CollectionDocument.objects.all().filter(document__id__in=documents, collection=self).delete()

    def __str__(self):
        return self.get_id()

    def get_id(self):
        return u'%s:%s' % (self.user.username, self.name)

    def accessible(self, user):
        return self.user == user or self.status in ('public', 'featured')

    def editable(self, user):
        if not user or user.is_anonymous():
            return False
        if self.user == user or \
           self.groups.filter(id__in=user.groups.all()).count() > 0 or \
           user.is_staff or \
           user.profile.capability('canEditFeaturedCollections'):
            return True
        return False

    def edit(self, data, user):
        if 'groups' in data:
            groups = data.pop('groups')
            update_groups(self, groups)
        for key in data:
            if key == 'query' and not data['query']:
                setattr(self, key, {"static": True})
            elif key == 'query' and isinstance(data[key], dict):
                setattr(self, key, data[key])
            elif key == 'type':
                if data[key] == 'static':
                    self.query = {"static": True}
                    self.type = 'static'
                else:
                    self.type = 'smart'
                    if self.query.get('static', False):
                        self.query = {}
            elif key == 'status':
                value = data[key]
                if value not in self._status:
                    value = self._status[0]
                if value == 'private':
                    for user in self.subscribed_users.all():
                        self.subscribed_users.remove(user)
                    qs = Position.objects.filter(user=user, collection=self)
                    if qs.count() > 1:
                        pos = qs[0]
                        pos.section = 'personal'
                        pos.save()
                elif value == 'featured':
                    if user.profile.capability('canEditFeaturedCollections'):
                        pos, created = Position.objects.get_or_create(collection=self, user=user,
                                                                      section='featured')
                        if created:
                            qs = Position.objects.filter(user=user, section='featured')
                            pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                            pos.save()
                        Position.objects.filter(collection=self).exclude(id=pos.id).delete()
                    else:
                        value = self.status
                elif self.status == 'featured' and value == 'public':
                    Position.objects.filter(collection=self).delete()
                    pos, created = Position.objects.get_or_create(collection=self,
                                                  user=self.user, section='personal')
                    qs = Position.objects.filter(user=self.user, section='personal')
                    pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                    pos.save()
                    for u in self.subscribed_users.all():
                        pos, created = Position.objects.get_or_create(collection=self, user=u,
                                                                      section='public')
                        qs = Position.objects.filter(user=u, section='public')
                        pos.position = qs.aggregate(Max('position'))['position__max'] + 1
                        pos.save()

                self.status = value
            elif key == 'name':
                data['name'] = re.sub(' \[\d+\]$', '', data['name']).strip()
                if not data['name']:
                    data['name'] = "Untitled"
                name = data['name']
                num = 1
                while Collection.objects.filter(name=name, user=self.user).exclude(id=self.id).count() > 0:
                    num += 1
                    name = data['name'] + ' [%d]' % num
                self.name = name
            elif key == 'description':
                self.description = ox.sanitize_html(data['description'])

        if 'position' in data:
            pos, created = Position.objects.get_or_create(collection=self, user=user)
            pos.position = data['position']
            pos.section = 'featured'
            if self.status == 'private':
                pos.section = 'personal'
            pos.save()
        if 'posterFrames' in data:
            self.poster_frames = tuple(data['posterFrames'])
        if 'view' in data:
            self.view = data['view']
        if 'sort' in data:
            self.sort = tuple(data['sort'])
        self.save()
        if 'posterFrames' in data:
            self.update_icon()

    def json(self, keys=None, user=None):
        if not keys:
            keys = [
                'description',
                'editable',
                'groups',
                'id',
                'name',
                'posterFrames',
                'query',
                'status',
                'subscribed',
                'type',
                'user',
                'view',
            ]
        response = {}
        for key in keys:
            if key in ('items', 'documents'):
                response[key] = self.get_numberofdocuments(user)
            elif key == 'id':
                response[key] = self.get_id()
            elif key == 'user':
                response[key] = self.user.username
            elif key == 'groups':
                response[key] = [g.name for g in self.groups.all()]
            elif key == 'editable':
                response[key] = self.editable(user)
            elif key == 'query':
                if not self.query.get('static', False):
                    response[key] = self.query
            elif key == 'subscribers':
                response[key] = self.subscribed_users.all().count()
            elif key == 'subscribed':
                if user and not user.is_anonymous():
                    response[key] = self.subscribed_users.filter(id=user.id).exists()
            else:
                response[key] = getattr(self, {
                    'posterFrames': 'poster_frames'
                }.get(key, key))
        return response

    def path(self, name=''):
        h = "%07d" % self.id
        return os.path.join('collections', h[:2], h[2:4], h[4:6], h[6:], name)

    def update_icon(self):
        frames = []
        #fixme
        '''
        if not self.poster_frames:
            documents = self.get_documents(self.user)
            if documents.count():
                poster_frames = []
                for i in range(0, documents.count(), max(1, int(documents.count()/4))):
                    poster_frames.append({
                        'document': documents[int(i)].id,
                        'position': documents[int(i)].poster_frame
                    })
                self.poster_frames = tuple(poster_frames)
                self.save()
        for i in self.poster_frames:
            from document.models import Document
            qs = Document.objects.filter(id=i['document'])
            if qs.count() > 0:
                if i.get('position'):
                    frame = qs[0].frame(i['position'])
                    if frame:
                        frames.append(frame)
        '''
        from item.models import Item
        for i in self.poster_frames:
            try:
                qs = Item.objects.filter(public_id=i['item'])
                if qs.count() > 0:
                    frame = qs[0].frame(i['position'])
                    if frame:
                        frames.append(frame)
            except:
                pass
        self.icon.name = self.path('icon.jpg')
        icon = self.icon.path
        if frames:
            while len(frames) < 4:
                frames += frames
            folder = os.path.dirname(icon)
            ox.makedirs(folder)
            for f in glob("%s/icon*.jpg" % folder):
                os.unlink(f)
            cmd = [
                settings.COLLECTION_ICON,
                '-f', ','.join(frames),
                '-o', icon
            ]
            p = subprocess.Popen(cmd, close_fds=True)
            p.wait()
            self.save()

    def get_icon(self, size=16):
        path = self.path('icon%d.jpg' % size)
        path = os.path.join(settings.MEDIA_ROOT, path)
        if not os.path.exists(path):
            folder = os.path.dirname(path)
            ox.makedirs(folder)
            if self.icon and os.path.exists(self.icon.path):
                source = self.icon.path
                max_size = min(self.icon.width, self.icon.height)
            else:
                source = os.path.join(settings.STATIC_ROOT, 'jpg/list256.jpg')
                max_size = 256
            if size < max_size:
                extract.resize_image(source, path, size=size)
            else:
                path = source
        return path

@python_2_unicode_compatible
class CollectionDocument(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    collection = models.ForeignKey(Collection)
    index = models.IntegerField(default=0)
    document = models.ForeignKey('document.Document')

    def __str__(self):
        return u'%s in %s' % (self.document, self.collection)

@python_2_unicode_compatible
class Position(models.Model):

    class Meta:
        unique_together = ("user", "collection", "section")

    collection = models.ForeignKey(Collection, related_name='position')
    user = models.ForeignKey(User, related_name='collection_positions')
    section = models.CharField(max_length=255)
    position = models.IntegerField(default=0)

    def __str__(self):
        return u'%s/%s/%s' % (self.section, self.position, self.collection)

