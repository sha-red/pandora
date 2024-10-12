# -*- coding: utf-8 -*-
import ox


def cleanup_value(value, layer_type):
    # FIXME: what about other types? location etc
    if layer_type == 'text':
        value = ox.sanitize_html(value, global_attributes=['lang'])
    else:
        value = ox.escape_html(value)
    return value
