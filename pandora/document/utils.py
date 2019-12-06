# -*- coding: utf-8 -*-
import os
import re
import subprocess

import ox

from item.utils import sort_title, sort_string, get_by_id

def pdfpages(pdf):
    return int(pdfinfo(pdf).get('pages', '0'))

def pdfinfo(pdf):
    cmd = ['pdfinfo', pdf]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, close_fds=True)
    stdout, stderr = p.communicate()
    data = {}
    for line in stdout.decode('utf-8', 'replace').strip().split('\n'):
        parts = line.split(':')
        key = parts[0].lower().strip()
        if key:
            data[key] = ':'.join(parts[1:]).strip()
    return data

def extract_pdfpage(pdf, image, page):
    page = str(page)
    cmd = [
        'pdftocairo',
        '-cropbox',
        '-jpeg',
        '-f', page, '-l', page,
        '-singlefile',
        '-scale-to', '2048',
        pdf,
        os.path.splitext(image)[0]
    ]
    subprocess.call(cmd, stdout=open('/dev/null', 'wb'))
    return image

def get_documents(text):
    ids = re.compile('/documents/([A-Z]+)').findall(text)
    ids += re.compile('/document/([A-Z]+)').findall(text)
    return [ox.fromAZ(id) for id in set(ids)]
