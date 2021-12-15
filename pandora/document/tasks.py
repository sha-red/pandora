import ox
from app.celery import app

@app.task(queue="encoding")
def extract_fulltext(id):
    from . import models
    d = models.Document.objects.get(id=id)
    d.update_fulltext()
    d.create_pages()
    for page in d.pages_set.all():
        page.update_fulltext()


@app.task(queue='default')
def bulk_edit(data, username):
    from django.db import transaction
    from . import models
    from item.models import Item
    user = models.User.objects.get(username=username)
    item = 'item' in data and Item.objects.get(public_id=data['item']) or None
    ids = data['id']
    del data['id']
    documents = models.Document.objects.filter(pk__in=map(ox.fromAZ, ids))
    for document in documents:
        if document.editable(user, item):
            with transaction.atomic():
                document.refresh_from_db()
                document.edit(data, user, item)
                document.save()
    return {}
