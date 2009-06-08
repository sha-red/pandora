# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os.path
from django.db import models
from django.contrib.auth.models import User

import oxweb.imdb
from oxlib import stripTags, findRe

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
        movie = models.Movie()
        movie.imdbId = imdbId

    info = oxweb.imdb.getMovieInfo(imdbId)
    for key in ('title',
                'tagline',
                'year',
                'release_date',
                'rating',
                'votes',
                'series_imdb'
                'season',
                'episode'):
        if key in info:
            setattr(movie, key, info[key])
            debug(key, info[key])
    _info_map = {
        'episode title': 'episode_title',
        'series title': 'series_title',
    }
    for key in _info_map.keys():
        if key in info:
            setattr(movie, _info_map.get(key, key), info[key])

    movie.plot = oxweb.imdb.getMoviePlot(imdbId)
    debug("plot", movie.plot)

    movie.runtime = oxweb.imdb.getMovieRuntimeSeconds(imdbId)
    business = oxweb.imdb.getMovieBusinessSum(imdbId)
    for key in ('gross', 'profit', 'budget'):
        setattr(movie, key, business[key])

    movie.save()

    #FIXME: related tables should be cleaned to not accumulate cruft
    #Country
    models.MovieCountry.objects.filter(movie=movie).delete()
    position = 0
    for i in info['country']:
        debug("add country", i)
        country = models.Country.get_or_create(i)
        models.MovieCountry.link(movie, country, position)
        position += 1

    #Language
    models.MovieLanguage.objects.filter(movie=movie).delete()
    position = 0
    for i in info['language']:
        debug("add language", i)
        language = models.Language.get_or_create(i)
        models.MovieLanguage.link(movie, language, position)
        position += 1

    #Location
    movie.locations.all().delete()
    locations = oxweb.imdb.getMovieLocations(imdbId)
    for i in locations:
        debug("add location", i)
        location = models.Location.get_or_create(i)
        location.movies.add(movie)

    #Genre
    movie.genres.all().delete()
    for i in info['genre']:
        debug("add genre", i)
        genre = models.Genre.get_or_create(i)
        genre.movies.add(movie)

    #Keyword
    movie.keywords.all().delete()
    keywords = oxweb.imdb.getMovieKeywords(imdbId)
    for g in keywords:
        debug("add keyword", g)
        keyword = models.Keyword.get_or_create(g)
        keyword.movies.add(movie)

    movie.trivia.all().delete()
    position = 0
    trivia = oxweb.imdb.getMovieTrivia(imdbId)
    for i in trivia:
        debug("add trivia", g)
        t = models.Trivia()
        t.movie = movie
        t.trivia = i
        t.position = position
        t.save()
        position += 1

    position = 0
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

    #FIXME: connections
    #m.addMovieConnections(IMDb['connections'])

    reviews = oxweb.imdb.getMovieExternalReviews(imdbId)
    for r in reviews:
        debug("add review", r)
        review = models.Review.get_or_create(movie, r)
        review.title = reviews[r]
        review.save()

    movie.oxdbId = movie.oxid()
    movie.save()
    return movie

