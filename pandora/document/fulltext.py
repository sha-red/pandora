import subprocess

from django.conf import settings


def extract_text(pdf):
    cmd = ['pdftotext', pdf, '-']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = p.communicate()
    stdout = stdout.decode()
    return stdout.strip()

def ocr_image(path):
    cmd = ['tesseract', path, '-', 'txt']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = p.communicate()
    stdout = stdout.decode()
    return stdout.strip()

class FulltextMixin:
    _ES_INDEX = "document-index"

    @classmethod
    def elasticsearch(cls):
        from elasticsearch import Elasticsearch
        es = Elasticsearch(settings.ELASTICSEARCH_HOST)
        return es

    def extract_fulltext(self):
        if self.file:
            if self.extension == 'pdf':
                return extract_text(self.file.path)
            elif self.extension in ('png', 'jpg'):
                return ocr_image(self.file.path)
        elif self.extension == 'html':
            return self.data.get('text', '')
        return ''

    def has_fulltext_key(self):
        return bool([k for k in settings.CONFIG['documentKeys'] if k.get('fulltext')])

    def delete_fulltext(self):
        if self.has_fulltext_key():
            from elasticsearch.exceptions import NotFoundError
            try:
                res = self.elasticsearch().delete(index=self._ES_INDEX, doc_type='document', id=self.id)
            except NotFoundError:
                pass

    def update_fulltext(self):
        if self.has_fulltext_key():
            text = self.extract_fulltext()
            if text:
                doc = {
                    'text': text.lower()
                }
                res = self.elasticsearch().index(index=self._ES_INDEX, doc_type='document', id=self.id, body=doc)

    @classmethod
    def find_fulltext(cls, query):
        ids = cls.find_fulltext_ids(query)
        return cls.objects.filter(id__in=ids)

    @classmethod
    def find_fulltext_ids(cls, query):
        if query and query[0] == '"' and query[-1] == '"':
            query = {
                "match_phrase": {
                    "text": query.lower()[1:-1]
                },
            }
        else:
            query = {
                "match": {
                    "text": {
                        "query": query.lower(),
                        "operator": "and"
                    }
                }
            }
        ids = []
        res = None
        from_ = 0
        es = cls.elasticsearch()
        while not res or len(ids) < res['hits']['total']['value']:
            res = es.search(index=cls._ES_INDEX, body={
                "from": from_,
                "_source": False,
                "query": query
            })
            if not res['hits']['hits']:
                break
            ids += [int(r['_id']) for r in res['hits']['hits']]
            from_ += len(res['hits']['hits'])
        return ids
