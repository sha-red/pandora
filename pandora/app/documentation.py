# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import print_function

import re
import ox.jsonc


def get(config_jsonc='config.pandora.jsonc'):
    with open(config_jsonc, 'rb') as fd:
        data = fd.read().decode('utf-8')
    config = ox.jsonc.loads(data)
    docs = {}
    for m in re.compile('(    \/\*.*?\*\/)\W+"([^\W]+?)":', re.DOTALL).findall(data):
        docs[m[1]] = m[0].strip()
    '''
    for key in config:
        if key not in docs:
            print(config_jsonc, 'missing', key)
    '''
    for key in docs.keys():
        if key not in config:
            print('parse error, invalid config key:', key)
            del docs[key]
    return docs

def update(config_jsonc='config.jsonc', base='config.pandora.jsonc'):
    with open(config_jsonc, 'rb') as fd:
        config = data = fd.read().decode('utf-8')
    docs = get(base)
    current_docs = get(config_jsonc)
    for key in docs:
        if key in current_docs:
            match = '\n' + re.escape('    '+docs[key]) + '\W+"' + re.escape(key) + '":'
        else:
            match = '\n    "' + re.escape(key) + '":'
        data = re.sub(match, '\n    %s\n    "%s":' % (docs[key], key), data)
    if data != config:
        print('updating config documentation', config_jsonc)
        with open('%s' % config_jsonc, 'wb') as fd:
            fd.write(data.encode('utf-8'))
