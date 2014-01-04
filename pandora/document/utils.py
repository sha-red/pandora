# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

import subprocess

def pdfpages(pdf):
    return int(pdfinfo(pdf).get('pages', '0'))

def pdfinfo(pdf):
    cmd = ['pdfinfo', pdf]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = p.communicate()
    data = {}
    for line in stdout.strip().split('\n'):
        parts = line.split(':')
        key = parts[0].lower().strip()
        if key:
            data[key] = ':'.join(parts[1:]).strip()
    return data