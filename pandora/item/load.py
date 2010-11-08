# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import random
import os.path

from django.db import models
from django.contrib.auth.models import User

from ox import stripTags, findRe
import ox.web.imdb

import models


def debug(*msgs):
    for m in msgs:
        print m,
    print

'''Import data from imdb into database,
   param: impdb id
   return: Item Object, None if failed
'''

def loadIMDb(imdbId):
    if len(imdbId) != 7:
        debug("IMDb ID not valid")
        return None
    try:
        item = models.Item.byImdbId(imdbId)
    except models.Item.DoesNotExist:
        #this shound not happen, just in case previous imports failed
        try:
            imdb = models.ItemImdb.objects.get(imdbId=imdbId)
        except models.ItemImdb.DoesNotExist:
            imdb = models.ItemImdb()
            imdb.imdbId = imdbId
            imdb.save()
        item = models.Item()
        item.imdb = imdb

    info = ox.web.imdb.getMovieInfo(imdbId)
    for key in ('title',
                'tagline',
                'year',
                'release_date',
                'rating',
                'votes',
                'series_imdb',
                'season',
                'episode'):
        if key in info:
            setattr(item.imdb, key, info[key])
            debug(key, info[key])
    _info_map = {
        'episode title': 'episode_title',
        'series title': 'series_title',
    }
    for key in _info_map.keys():
        if key in info:
            setattr(item.imdb, _info_map.get(key, key), info[key])

    item.imdb.plot = ox.web.imdb.getMoviePlot(imdbId)
    debug("plot", item.imdb.plot)

    item.imdb.runtime = ox.web.imdb.getMovieRuntimeSeconds(imdbId)
    business = ox.web.imdb.getMovieBusinessSum(imdbId)
    for key in ('gross', 'profit', 'budget'):
        setattr(item.imdb, key, business[key])

    item.imdb.save()
    item.oxdbId = "__init__%s" % random.randint(0, 100000)
    item.save()
    models.AlternativeTitle.objects.filter(item=item, manual=False).delete()
    for i in ox.web.imdb.getMovieAKATitles(imdbId):
        t = models.AlternativeTitle()
        t.item = item
        t.title = i[0]
        t.type = i[1]
        t.save()

    #FIXME: related tables should be cleaned to not accumulate cruft
    #Country
    models.ItemCountry.objects.filter(item=item, manual=False).delete()
    position = 0
    if 'country' in info:
        for i in info['country']:
            debug("add country", i)
            country, created = models.Country.objects.get_or_create(name=i)
            models.ItemCountry.link(item, country, position)
            position += 1

    #Language
    models.ItemLanguage.objects.filter(item=item, manual=False).delete()
    position = 0
    if 'language' in info:
        for i in info['language']:
            debug("add language", i)
            language, created = models.Language.objects.get_or_create(name=i)
            models.ItemLanguage.link(item, language, position)
            position += 1

    #Location
    item.locations_all.filter(manual=False).delete()
    locations = ox.web.imdb.getMovieLocations(imdbId)
    for i in locations:
        debug("add location", i)
        location, created = models.Location.objects.get_or_create(name=i)
        location.items.add(item)

    #Genre
    item.genres_all.filter(manual=False).delete()
    if 'genre' in info:
        for i in info['genre']:
            debug("add genre", i)
            genre, created = models.Genre.objects.get_or_create(name=i)
            genre.items.add(item)

    #Keyword
    item.keywords_all.filter(manual=False).delete()
    keywords = ox.web.imdb.getMovieKeywords(imdbId)
    for g in keywords:
        debug("add keyword", g)
        keyword, created = models.Keyword.objects.get_or_create(name=g)
        keyword.items.add(item)

    item.trivia_all.filter(manual=False).delete()
    position = 0
    trivia = ox.web.imdb.getMovieTrivia(imdbId)
    for i in trivia:
        debug("add trivia", i)
        t = models.Trivia()
        t.item = item
        t.trivia = i
        t.position = position
        t.save()
        position += 1

    position = 0
    models.Cast.objects.filter(item=item).filter(manual=False).delete()
    credits = ox.web.imdb.getMovieCredits(imdbId)
    for role in credits:
        for p in credits[role]:
            name = stripTags(p[0])
            imdb_id = findRe(p[0], 'nm(\d{7})')
            debug("add cast", name)
            #FIXME: we could save character information here
            character = stripTags(p[1])
            person = models.Person.get_or_create(name, imdb_id)
            models.Cast.link(item, person, role, character, position)
            position += 1

    item.connections_all.filter(manual=False).delete()
    connections = ox.web.imdb.getMovieConnections(imdbId)
    for relation in connections:
        for otherId in connections[relation]:
            try:
                object = models.Item.objects.get(imdb__imdbId=otherId)
                debug("add connection", relation, object)
                models.Connection.get_or_create(item, relation, object)
            except models.Item.DoesNotExist:
                pass

    reviews = ox.web.imdb.getMovieExternalReviews(imdbId)
    item.reviews_all.filter(manual=False).delete()
    for r in reviews:
        debug("add review", r)
        review = models.Review.get_or_create(item, r)
        review.title = reviews[r]
        review.save()

    item.oxdbId = item.oxid()
    item.save()
    return item

