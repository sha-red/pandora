# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4


import subprocess

from item.utils import sort_title, sort_string, get_by_id

def pdfpages(pdf):
    return int(pdfinfo(pdf).get('pages', '0'))

def pdfinfo(pdf):
    cmd = ['pdfinfo', pdf]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, close_fds=True)
    stdout, stderr = p.communicate()
    data = {}
    for line in stdout.decode('utf-8').strip().split('\n'):
        parts = line.split(':')
        key = parts[0].lower().strip()
        if key:
            data[key] = ':'.join(parts[1:]).strip()
    return data

def extract_pdfpage(pdf, image, page):
    page -= 1
    cmd = ['convert', '%s[%d]' % (pdf, page),
        '-background', 'white', '-flatten', '-resize', '1024x1024', image]
    p = subprocess.Popen(cmd, close_fds=True)
    p.wait()
    return image
