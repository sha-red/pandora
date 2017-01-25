# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import os
import ox

from django.db import migrations, models
from django.db.models import Max
from PIL import Image

import oxdjango.fields


def migrate_texts(apps, schema_editor):
    import os
    import ox
    import shutil

    import document.models
    from document import utils

    Text = apps.get_model("text", "Text")
    Document = apps.get_model("document", "Document")
    Collection = apps.get_model("documentcollection", "Collection")
    CollectionDocument = apps.get_model("documentcollection", "CollectionDocument")
    User = apps.get_model("auth", "User")

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

    def path(self, name=''):
        h = ox.toAZ(self.id)
        h = (7-len(h))*'0' + h
        return os.path.join('documents', h[:2], h[2:4], h[4:6], h[6:], name)

    def update_info(self):
        pdf = self.file.path
        page = 1
        image = os.path.join(os.path.dirname(pdf), '1024p%d.jpg' % page)
        utils.extract_pdfpage(pdf, image, page)
        self.pages = utils.pdfpages(self.file.path)
        if os.path.exists(image):
            size = Image.open(image).size
            self.ratio = size[0] / size[1]

    if Text.objects.filter(status='featured').count():
        first_user = User.objects.all()[0]
        featured, created = Collection.objects.get_or_create(user=first_user, name='Featured Texts')
        if created:
            featured.status = 'featured'
            featured.save()

    for t in Text.objects.all():
        d = Document()
        d.extension = t.type
        if t.name == '':
            d.name = 'Index'
        else:
            d.name = t.name
        d.user = t.user
        d.description = t.description
        d.rightslevel = 2 if t.status == 'private' else 0
        d.data['text'] = t.text
        d.data['embeds'] = t.embeds
        d.save()
        if t.type == 'pdf':
            d.file.name = path(d, 'data.pdf')
            os.makedirs(os.path.dirname(d.file.path))
            shutil.copy2(t.file.path, d.file.path)
            d.oshash = ox.oshash(d.file.path)
            update_info(d)
            d.save()
        Document.objects.filter(id=d.id).update(created=t.created, modified=t.modified)
        c, created = Collection.objects.get_or_create(user=t.user, name='Texts')
        add(c, d)
        if t.status == 'featured':
            add(featured, d)
        for user in t.subscribed_users.all():
            favorite, created = Collection.objects.get_or_create(user=user, name='Favorite Texts')
            add(favorite, d)

        '''
        for d in document.models.Document.objects.filter(id__in=fix_info):
            d.get_info()
            d.get_ratio()
            d.save()
        '''

class Migration(migrations.Migration):

    dependencies = [
        ('auth', '__first__'),
        ('text', '__first__'),
        ('document', '0003_new_fields'),
        ('documentcollection', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(migrate_texts),
    ]
