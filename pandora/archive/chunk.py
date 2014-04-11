# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import os

import ox
from django import forms

class ChunkForm(forms.Form):
    chunk = forms.FileField()
    chunkId = forms.IntegerField(required=False)
    offset = forms.IntegerField(required=False)
    done = forms.IntegerField(required=False)

def save_chunk(obj, file, chunk, offset, name, done_cb=None):
    if not file:
        file.name = name
        ox.makedirs(os.path.dirname(file.path))
        with open(file.path, 'w') as f:
            f.write(chunk.read())
        obj.save()
    else:
        path = file.path
        size = file.size
        if offset == None:
            offset = size
        elif offset > size:
            return False, size
        with open(path, 'r+') as f:
            f.seek(offset)
            f.write(chunk.read())
    return done_cb() if done_cb else True, file.size

def process_chunk(request, save_chunk):
    response = {
        'result': 1,
    }
    form = ChunkForm(request.POST, request.FILES)
    if form.is_valid():
        d = form.cleaned_data
        ok, _offset = save_chunk(d['chunk'], d['offset'], d['done'])
        response['offset'] = _offset
        response['result'] = 1 if ok else -1
        if d['done']:
            response['done'] = 1
    else:
        response['result'] = -1
    return response
