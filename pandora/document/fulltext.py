import os
import subprocess
import tempfile

from django.conf import settings


def extract_text(pdf, page=None):
    if page is not None:
        page = str(page)
        cmd = ['pdftotext', '-f', page, '-l', page, pdf, '-']
    else:
        cmd = ['pdftotext', pdf, '-']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = p.communicate()
    stdout = stdout.decode().strip()
    if not stdout:
        if page:
            # split page from pdf and ocr
            fd, page_pdf = tempfile.mkstemp('.pdf')
            cmd = ['pdfseparate', '-f', page, '-l', page, pdf, page_pdf]
            p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, stderr = p.communicate()
            text = ocr_image(page_pdf)
            os.unlink(page_pdf)
            return text
        else:
            return ocr_image(pdf)
    return stdout

def ocr_image(path):
    cmd = ['tesseract', path, '-', 'txt']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = p.communicate()
    stdout = stdout.decode()
    return stdout.strip()

class FulltextMixin:
    _ES_INDEX = "document-index"
    _ES_DOC_TYPE = "document"

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
                res = self.elasticsearch().delete(index=self._ES_INDEX, doc_type=self._ES_DOC_TYPE, id=self.id)
            except NotFoundError:
                pass

    def update_fulltext(self):
        if self.has_fulltext_key():
            text = self.extract_fulltext()
            if text:
                doc = {
                    'text': text.lower()
                }
                res = self.elasticsearch().index(index=self._ES_INDEX, doc_type=self._ES_DOC_TYPE, id=self.id, body=doc)

    @classmethod
    def find_fulltext(cls, query):
        ids = cls.find_fulltext_ids(query)
        return cls.objects.filter(id__in=ids)

    @classmethod
    def find_fulltext_ids(cls, query):
        if not query:
            return []
        elif query[0] == '"' and query[-1] == '"':
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


class FulltextPageMixin(FulltextMixin):
    _ES_INDEX = "document-page-index"
    _DOC_TYPE = 'page'

    def extract_fulltext(self):
        if self.document.file:
            if self.document.extension == 'pdf':
                return extract_text(self.document.file.path, self.page)
            elif self.extension in ('png', 'jpg'):
                return ocr_image(self.document.file.path)
        elif self.extension == 'html':
            # FIXME: is there a nice way to split that into pages
            return self.data.get('text', '')
        return ''
