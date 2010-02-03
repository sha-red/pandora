# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import random
import os.path

from django.db import models
from django.contrib.auth.models import User

from oxlib import stripTags, findRe
import oxweb.imdb

import models


def debug(*msgs):
    for m in msgs:
        print m,
    print

'''Import data from imdb into database,
   param: impdb id
   return: Movie Object, None if failed
'''

def loadIMDb(imdbId):
    if len(imdbId) != 7:
        debug("IMDb ID not valid")
        return None
    try:
        movie = models.Movie.byImdbId(imdbId)
    except models.Movie.DoesNotExist:
        #this shound not happen, just in case previous imports failed
        try:
            imdb = models.MovieImdb.objects.get(imdbId=imdbId)
        except models.MovieImdb.DoesNotExist:
            imdb = models.MovieImdb()
            imdb.imdbId = imdbId
            imdb.save()
        movie = models.Movie()
        movie.imdb = imdb

    info = oxweb.imdb.getMovieInfo(imdbId)
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
            setattr(movie.imdb, key, info[key])
            debug(key, info[key])
    _info_map = {
        'episode title': 'episode_title',
        'series title': 'series_title',
    }
    for key in _info_map.keys():
        if key in info:
            setattr(movie.imdb, _info_map.get(key, key), info[key])

    movie.imdb.plot = oxweb.imdb.getMoviePlot(imdbId)
    debug("plot", movie.imdb.plot)

    movie.imdb.runtime = oxweb.imdb.getMovieRuntimeSeconds(imdbId)
    business = oxweb.imdb.getMovieBusinessSum(imdbId)
    for key in ('gross', 'profit', 'budget'):
        setattr(movie.imdb, key, business[key])

    movie.imdb.save()
    movie.oxdbId = "__init__%s" % random.randint(0, 100000)
    movie.save()
    models.AlternativeTitle.objects.filter(movie=movie, manual=False).delete()
    for i in oxweb.imdb.getMovieAKATitles(imdbId):
        t = models.AlternativeTitle()
        t.movie = movie
        t.title = i[0]
        t.type = i[1]
        t.save()

    #FIXME: related tables should be cleaned to not accumulate cruft
    #Country
    models.MovieCountry.objects.filter(movie=movie, manual=False).delete()
    position = 0
    if 'country' in info:
        for i in info['country']:
            debug("add country", i)
            country = models.Country.get_or_create(i)
            models.MovieCountry.link(movie, country, position)
            position += 1

    #Language
    models.MovieLanguage.objects.filter(movie=movie, manual=False).delete()
    position = 0
    if 'language' in info:
        for i in info['language']:
            debug("add language", i)
            language = models.Language.get_or_create(i)
            models.MovieLanguage.link(movie, language, position)
            position += 1

    #Location
    movie.locations_all.filter(manual=False).delete()
    locations = oxweb.imdb.getMovieLocations(imdbId)
    for i in locations:
        debug("add location", i)
        location = models.Location.get_or_create(i)
        location.movies.add(movie)

    #Genre
    movie.genres_all.filter(manual=False).delete()
    if 'genre' in info:
        for i in info['genre']:
            debug("add genre", i)
            genre = models.Genre.get_or_create(i)
            genre.movies.add(movie)

    #Keyword
    movie.keywords_all.filter(manual=False).delete()
    keywords = oxweb.imdb.getMovieKeywords(imdbId)
    for g in keywords:
        debug("add keyword", g)
        keyword = models.Keyword.get_or_create(g)
        keyword.movies.add(movie)

    movie.trivia_all.filter(manual=False).delete()
    position = 0
    trivia = oxweb.imdb.getMovieTrivia(imdbId)
    for i in trivia:
        debug("add trivia", i)
        t = models.Trivia()
        t.movie = movie
        t.trivia = i
        t.position = position
        t.save()
        position += 1

    position = 0
    models.Cast.objects.filter(movie=movie).filter(manual=False).delete()
    credits = oxweb.imdb.getMovieCredits(imdbId)
    for role in credits:
        for p in credits[role]:
            name = stripTags(p[0])
            imdb_id = findRe(p[0], 'nm(\d{7})')
            debug("add cast", name)
            #FIXME: we could save character information here
            character = stripTags(p[1])
            person = models.Person.get_or_create(name, imdb_id)
            models.Cast.link(movie, person, role, character, position)
            position += 1

    movie.connections_all.filter(manual=False).delete()
    connections = oxweb.imdb.getMovieConnections(imdbId)
    for relation in connections:
        for otherId in connections[relation]:
            try:
                object = models.Movie.objects.get(imdb__imdbId=otherId)
                debug("add connection", relation, object)
                models.Connection.get_or_create(movie, relation, object)
            except models.Movie.DoesNotExist:
                pass

    reviews = oxweb.imdb.getMovieExternalReviews(imdbId)
    movie.reviews_all.filter(manual=False).delete()
    for r in reviews:
        debug("add review", r)
        review = models.Review.get_or_create(movie, r)
        review.title = reviews[r]
        review.save()

    movie.oxdbId = movie.oxid()
    movie.save()
    return movie

