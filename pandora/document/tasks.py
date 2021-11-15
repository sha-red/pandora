import ox
from celery.task import task

@task(queue="encoding")
def extract_fulltext(id):
    from . import models
    d = models.Document.objects.get(id=id)
    d.update_fulltext()
    d.create_pages()
    for page in d.pages_set.all():
        page.update_fulltext()


@task(queue='default')
def bulk_edit(data, username):
    from django.db import transaction
    from . import models
    from item.models import Item
    user = models.User.objects.get(username=username)
    item = 'item' in data and Item.objects.get(public_id=data['item']) or None
    documents = models.Document.objects.filter(pk__in=map(ox.fromAZ, data['id']))
    for document in documents:
        if document.editable(user, item):
            with transaction.atomic():
                document.refresh_from_db()
                document.edit(data, user, item)
                document.save()
    return {}
