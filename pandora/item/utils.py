#!/usr/bin/env python
# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
#
from decimal import Decimal
import os
import re
import hashlib
import unicodedata

from django.conf import settings
import ox
import ox.iso
from ox.normalize import normalizeName, normalizeTitle
import ox.web.imdb


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


def oxid(title, director, year='', seriesTitle='', episodeTitle='', season=0, episode=0):
    director = ', '.join(director)
    oxid_value = u"\n".join([title, director, year])
    oxid = hashlib.sha1(oxid_value.encode('utf-8')).hexdigest()
    if seriesTitle:
        oxid_value = u"\n".join([seriesTitle, "%02d" % season])
        oxid = hashlib.sha1(oxid_value.encode('utf-8')).hexdigest()[:20]
        oxid_value = u"\n".join(["%02d" % episode, episodeTitle, director, year])
        oxid += hashlib.sha1(oxid_value.encode('utf-8')).hexdigest()[:20]
    return u"0x" + oxid


def oxdb_id(title, director=[], year='', season='', episode='', episode_title='', episode_director=[], episode_year=''):
    # new id function, will replace oxid()
    def get_hash(string):
        return hashlib.sha1(string.encode('utf-8')).hexdigest().upper()
    director = ', '.join(director)
    episode_director = ', '.join(episode_director)
    if not episode:
        oxdb_id = get_hash(director)[:8] + get_hash('\n'.join([title, str(year)]))[:8]
    else:
        oxdb_id = get_hash('\n'.join([director, title, str(year), str(season)]))[:8] + \
                  get_hash('\n'.join([str(episode), episode_director, episode_title, str(episode_year)]))[:8]
    return u'0x' + oxdb_id


def parse_director(director):
    director = os.path.basename(os.path.dirname(director))
    if director.endswith('_'):
        director = "%s." % director[:-1]
    director = [normalizeName(d) for d in director.split('; ')]

    def cleanup(director):
        director = director.strip()
        director = director.replace('Series', '')
        director = director.replace('Unknown Director', '')
        director = director.replace('Various Directors', '')
        return director
    director = filter(None, [cleanup(d) for d in director])
    return director


def parse_title(_title, searchTitle = False):
    '''
      normalize filename to get item title
    '''
    _title = os.path.basename(_title)
    _title = _title.replace('... ', '_dot_dot_dot_')
    _title = _title.replace('. ', '_dot__space_')
    _title = _title.replace(' .', '_space__dot_')
    title = _title.split('.')[0]
    title = re.sub('([A-Za-z0-9])_ ', '\\1: ', title)
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
    if year and title.endswith(year):
        title = title[:-len(year)].strip()
    title = normalizeTitle(title)
    if searchTitle and year:
        title = u"%s %s" % (title, year)
    return title


def parse_series_title(path):
    seriesTitle = u''
    if path.startswith('Series'):
        seriesTitle = os.path.basename(path)
    else:
        t = parse_title(path)
        if " (S" in t:
            seriesTitle = t.split(" (S")[0]
    return seriesTitle


def parse_episode_title(path):
    episodeTitle = u''
    ep = re.compile('.Episode \d+?\.(.*?)\.[a-zA-Z]').findall(path)
    if ep:
        episodeTitle = ep[0]
    return episodeTitle


def parse_season_episode(path):
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
    '''
        expects path in the form
            L/Last, First/Title (YYYY)
            M/McCarthy, Thomas/The Visitor (2007)
            G/Godard, Jean-Luc/Histoire(s) du cinema_ Toutes les histoires (1988)
    '''
    r = {}
    r['title'] = parse_title(path)
    year = ox.findRe(path, '\((\d{4})\)')
    if year:
        r['year'] = year
    if not settings.USE_IMDB:
        return r

    search_title = parse_title(path, True)
    r['director'] = parse_director(path)

    #FIXME: only include it its actually a series
    r['episode_title'] = parse_episode_title(path)
    r['season'], r['episode'] = parse_season_episode(path)
    r['series_title'] = parse_series_title(path)

    #FIXME: use oxdata/id/?title=title&director=director&year=year
    #r['imdbId'] = ox.web.imdb.guess(search_title, ', '.join(r['director']), timeout=-1)
    r['imdbId'] = ox.web.imdb.guess(search_title, timeout=-1)
    r['oxdbId'] = oxdb_id(r['title'], r['director'], r.get('year', ''),
                          r.get('season', ''), r.get('episode', ''),
                          episode_title=r['episode_title'],
                          episode_director=[],
                          episode_year='')
    return r


def sort_string(string):
    string = string.replace(u'Þ', 'Th')
    #pad numbered titles
    string = re.sub('(\d+)', lambda x: '%010d' % int(x.group(0)), string)
    return unicodedata.normalize('NFKD', string)


def sort_title(title):

    #title = title.replace(u'Æ', 'Ae')
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
