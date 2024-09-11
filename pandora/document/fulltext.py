import logging
import os
import subprocess
import tempfile

from django.conf import settings


logger = logging.getLogger('pandora.' + __name__)


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
            p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, close_fds=True)
            stdout, stderr = p.communicate()
            text = ocr_image(page_pdf)
            os.unlink(page_pdf)
            os.close(fd)
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
                res = self.elasticsearch().delete(index=self._ES_INDEX, id=self.id)
            except NotFoundError:
                pass
            except:
                logger.error('failed to delete fulltext document', exc_info=True)

    def update_fulltext(self):
        if self.has_fulltext_key():
            text = self.extract_fulltext()
            if text:
                doc = {
                    'text': text.lower()
                }
                res = self.elasticsearch().index(index=self._ES_INDEX, id=self.id, body=doc)

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

    def highlight_page(self, page, query, size):
        import pypdfium2 as pdfium
        from PIL import Image
        from PIL import ImageDraw

        pdfpath = self.file.path
        pagenumber = int(page) - 1
        jpg = tempfile.NamedTemporaryFile(suffix='.jpg')
        output = jpg.name
        TINT_COLOR = (255, 255, 0)
        TRANSPARENCY = .45
        OPACITY = int(255 * TRANSPARENCY)
        scale = 150/72

        pdf = pdfium.PdfDocument(pdfpath)
        page = pdf[pagenumber]

        bitmap = page.render(scale=scale, rotation=0)
        img = bitmap.to_pil().convert('RGBA')
        overlay = Image.new('RGBA', img.size, TINT_COLOR+(0,))
        draw = ImageDraw.Draw(overlay)

        textpage = page.get_textpage()
        search = textpage.search(query)
        result = search.get_next()
        while result:
            pos, steps = result
            steps += 1
            while steps:
                box = textpage.get_charbox(pos)
                box = [b*scale for b in box]
                tl = (box[0], img.size[1] - box[3])
                br = (box[2], img.size[1] - box[1])
                draw.rectangle((tl, br), fill=TINT_COLOR+(OPACITY,))
                pos += 1
                steps -= 1
            result = search.get_next()
        img = Image.alpha_composite(img, overlay)
        img = img.convert("RGB")
        aspect = img.size[0] / img.size[1]
        resize_method = Image.LANCZOS
        if img.size[0] >= img.size[1]:
            width = size
            height = int(size / aspect)
        else:
            width = int(size / aspect)
            height = size
        img = img.resize((width, height), resize_method)
        img.save(output, quality=72)
        return jpg


class FulltextPageMixin(FulltextMixin):
    _ES_INDEX = "document-page-index"

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
