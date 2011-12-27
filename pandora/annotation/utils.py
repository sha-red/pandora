# -*- coding: utf-8 -*-
# ci:si:et:sw=4:sts=4:ts=4
import re
import ox
import html5lib


def cleanup_value(value, layer_type):
    #FIXME: what about other types? location etc
    if layer_type == 'text':
        value = sanitize_fragment(value)
    else:
        value = ox.stripTags(value)
    return value

def sanitize_fragment(html):
    return html5lib.parseFragment(html).toxml().decode('utf-8')

