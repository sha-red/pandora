# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
#
from decimal import Decimal
import re
import unicodedata
import ox

def safe_filename(filename):
    filename = filename.replace('_ ', ': ')
    filename = filename.replace('/', '_')
    filename = filename.replace('\\', '_')
    if filename.endswith('.'):
        filename = filename[:-1] + '_'
    return filename

def decode_id(id):
    try:
        id = ox.fromAZ(id)
    except:
        id = 0
    return id

def parse_decimal(string):
    string = string.replace(':', '/')
    if '/' not in string:
        string = '%s/1' % string
    d = string.split('/')
    return Decimal(d[0]) / Decimal(d[1])

def parse_time(t):
    '''
        parse time string and return seconds as float
    '''
    s = 0.0
    p = t.split(':')
    for i in range(len(p)):
        _p = p[i]
        if _p.endswith('.'):
            _p =_p[:-1]
        s = s * 60 + float(_p)
    return s

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

def get_by_id(objects, id):
    obj = filter(lambda o: o['id'] == id, objects)
    return obj and obj[0] or None
