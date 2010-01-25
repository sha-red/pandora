#!/usr/bin/env python
# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
#
import errno
import os
import sys
import re
import hashlib

import oxlib
import oxlib.iso
from oxlib.normalize import normalizeName

def oxid(title, director, year='', seriesTitle='', episodeTitle='', season=0, episode=0):
    oxid_value = u"\n".join([title, director, year])
    oxid = hashlib.sha1(oxid_value.encode('utf-8')).hexdigest()
    if seriesTitle:
        oxid_value = u"\n".join([seriesTitle, "%02d" % season])
        oxid = hashlib.sha1(oxid_value.encode('utf-8')).hexdigest()[:20]
        oxid_value = u"\n".join(["%02d" % episode, episodeTitle, director, year])
        oxid += hashlib.sha1(oxid_value.encode('utf-8')).hexdigest()[:20]
    return u"0x" + oxid

def oxdb_director(director):
    director = os.path.basename(os.path.dirname(director))
    if director.endswith('_'):
        director = "%s." % director[:-1]
    director = ", ".join([normalizeName(d) for d in director.split('; ')])
    director = director.replace('Series', '')
    director = director.replace('Unknown Director', '')
    director = director.replace('Various Directors', '')
    return director

def oxdb_title(_title, searchTitle = False):
    '''
      normalize filename to get movie title
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
    return title

def oxdb_year(data):
    return oxlib.findRe(data, '\.(\d{4})\.')

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

def parsePath(path):
    import oxweb.imdb
    search_title = oxdb_title(path, True)
    r = {}
    r['title'] = oxdb_title(path)
    r['director'] = oxdb_director(path)
    r['episode_title'] = oxdb_episode_title(path)
    r['season'], r['episode'] = oxdb_season_episode(path)
    r['series'] = oxdb_series_title(path)
    r['part'] = oxdb_part(path)
    r['imdbId'] = oxweb.imdb.guess(search_title, r['director'], timeout=-1)
    return r

