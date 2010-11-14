#!/usr/bin/env python
# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
#
import errno
import os
import sys
import re
import hashlib
import unicodedata

import ox
import ox.iso
from ox.normalize import normalizeName, normalizeTitle, canonicalTitle


def plural_key(term):
    return {
        'country': 'countries',
    }.get(term, term + 's')

def oxid(title, directors, year='', seriesTitle='', episodeTitle='', season=0, episode=0):
    director = ', '.join(directors)
    oxid_value = u"\n".join([title, director, year])
    oxid = hashlib.sha1(oxid_value.encode('utf-8')).hexdigest()
    if seriesTitle:
        oxid_value = u"\n".join([seriesTitle, "%02d" % season])
        oxid = hashlib.sha1(oxid_value.encode('utf-8')).hexdigest()[:20]
        oxid_value = u"\n".join(["%02d" % episode, episodeTitle, director, year])
        oxid += hashlib.sha1(oxid_value.encode('utf-8')).hexdigest()[:20]
    return u"0x" + oxid

def oxdb_id(title, directors=[], year='', season='', episode='', episode_title='', episode_director='', episode_year=''):
    # new id function, will replace oxid()
    def get_hash(string):
        return hashlib.sha1(string.encode('utf-8')).hexdigest().upper()
    director = ', '.join(directors)
    if not episode:
        oxdb_id = get_hash(director)[:8] + get_hash('\n'.join([title, year]))[:8]
    else:
        oxdb_id = get_hash('\n'.join([director, title, year, season]))[:8] + \
            get_hash('\n'.join([episode, episode_director, episode_title, episode_year]))[:8]
    return u'0x' + oxdb_id

def oxdb_directors(director):
    director = os.path.basename(os.path.dirname(director))
    if director.endswith('_'):
        director = "%s." % director[:-1]
    directors = [normalizeName(d) for d in director.split('; ')]
    def cleanup(director):
        director = director.strip()
        director = director.replace('Series', '')
        director = director.replace('Unknown Director', '')
        director = director.replace('Various Directors', '')
        return director
    directors = filter(None, [cleanup(d) for d in directors])
    return directors

def oxdb_title(_title, searchTitle = False):
    '''
      normalize filename to get item title
    '''
    _title = os.path.basename(_title)
    _title = _title.replace('... ', '_dot_dot_dot_')
    _title = _title.replace('. ', '_dot__space_')
    _title = _title.replace(' .', '_space__dot_')
    title = _title.split('.')[0]
    title = re.sub('([a-z0-9])_ ', '\\1: ', title)
    se = re.compile('Season (\d+).Episode (\d+)').findall(_title)
    if se:
        se = "S%02dE%02d" % (int(se[0][0]), int(se[0][1]))
        if 'Part' in _title.split('.')[-2] and 'Episode' not in _title.split('.')[-3]:
            stitle = _title.split('.')[-3]
        else:
            stitle = _title.split('.')[-2]
        if stitle.startswith('Episode '):
            stitle = '' 
        if searchTitle:
            title = '"%s" %s' % (title, stitle)
        else:
            title = '%s (%s) %s' % (title, se, stitle)
            title = title.strip()
    title = title.replace('_dot_dot_dot_', '... ')
    title = title.replace('_dot__space_', '. ')
    title = title.replace('_space__dot_', ' .')
    year = ox.findRe(title, '(\(\d{4}\))')
    if title.endswith(year):
        title = title[:-len(year)].strip()
    title = normalizeTitle(title)
    return title

def oxdb_year(data):
    return ox.findRe(data, '\.(\d{4})\.')

def oxdb_series_title(path):
    seriesTitle = u''
    if path.startswith('Series'):
        seriesTitle = os.path.basename(os.path.dirname(path))
    else:
        t = oxdb_title(path)
        if " (S" in t:
            seriesTitle = t.split(" (S")[0]
    return seriesTitle

def oxdb_episode_title(path):
    episodeTitle = u''
    ep = re.compile('.Episode \d+?\.(.*?)\.[a-zA-Z]').findall(path)
    if ep:
        episodeTitle = ep[0]
    return episodeTitle

def oxdb_season_episode(path):
    season = 0
    episode = 0
    path = os.path.basename(path)
    se = re.compile('Season (\d+).Episode (\d+)').findall(path)
    if se:
        season = int(se[0][0])
        episode = int(se[0][1])
    else:
        ep = re.compile('.Episode (\d+?)').findall(path)
        if ep:
            episode = int(ep[0][0])
    if season == 0 and episode == 0:
        se = re.compile('S(\d\d)E(\d\d)').findall(path)
        if se:
            season = int(se[0][0])
            episode = int(se[0][1])
    return (season, episode)

def oxdb_part(path):
    part = 1
    path = path.lower()
    p = re.compile('part\s*?(\d+)\.').findall(path)
    if p:
        part = p[0]
    else:
        p = re.compile('cd\s*?(\d+)\.').findall(path)
        if p:
            part = p[0]
    return part

def parse_path(path):
    import ox.web.imdb
    search_title = oxdb_title(path, True)
    r = {}
    r['title'] = oxdb_title(path)
    r['directors'] = oxdb_directors(path)
    year = ox.findRe(path, '\((\d{4})\)')
    if year:
        r['year'] = year

    #FIXME: only include it its actually a series
    r['episode_title'] = oxdb_episode_title(path)
    r['season'], r['episode'] = oxdb_season_episode(path)
    r['series_title'] = oxdb_series_title(path)

    r['imdbId'] = ox.web.imdb.guess(search_title, ', '.join(r['directors']), timeout=-1)
    r['oxdbId'] = oxid(r['title'], r['directors'],
                       seriesTitle=r['series_title'],
                       episodeTitle=r['episode_title'],
                       season=r['season'], episode=r['episode'])
    return r

def sort_title(title):
    #title
    title = re.sub(u'[\'!¿¡,\.;\-"\:\*\[\]]', '', title)

    #title = title.replace(u'Æ', 'Ae')
    title = unicodedata.normalize('NFKD',title)

    #pad numbered titles
    title = re.sub('(\d+)', lambda x: '%010d' % int(x.group(0)), title)
    return title.strip()

