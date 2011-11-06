# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
#
from decimal import Decimal
import re
import unicodedata
import ox

def decode_id(id):
    try:
        id = ox.from26(id)
    except:
        id = 0
    return id

def parse_decimal(string):
    string = string.replace(':', '/')
    if '/' not in string:
        string = '%s/1' % string
    d = string.split('/')
    return Decimal(d[0]) / Decimal(d[1])


def plural_key(term):
    return {
        'country': 'countries',
    }.get(term, term + 's')


def sort_string(string):
    string = string.replace(u'Æ', 'AE').replace(u'Ø', 'O').replace(u'Þ', 'Th')

    #pad numbered titles
    string = re.sub('(\d+)', lambda x: '%010d' % int(x.group(0)), string)
    return unicodedata.normalize('NFKD', string)


def sort_title(title):

    title = title.replace(u'Æ', 'Ae')
    if isinstance(title, str):
        title = unicode(title)
    title = sort_string(title)

    #title
    title = re.sub(u'[\'!¿¡,\.;\-"\:\*\[\]]', '', title)
    return title.strip()

def get_positions(ids, pos):
    '''
    >>> get_positions([1,2,3,4], [2,4])
    {2: 1, 4: 3}
    '''
    positions = {}
    for i in pos:
        try:
            positions[i] = ids.index(i)
        except:                         
            pass                                    
    return positions
