# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import os.path
from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User

import oxlib

import utils
import managers


class Movie(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    accessed = models.DateTimeField(null=True, blank=True)

    movieId = models.CharField(max_length=128, unique=True, blank=True)
    imdbId = models.CharField(max_length=7, unique=True, blank=True)
    oxdbId = models.CharField(max_length=42, unique=True, blank=True)
    title = models.CharField(max_length=1000)
    year = models.CharField(max_length=4)
    runtime = models.IntegerField(null=True, blank=True)
    release_date = models.DateField(null=True, blank=True)

    tagline = models.TextField(blank=True)
    plot = models.TextField(blank=True)
    plot_outline = models.TextField(blank=True)

    rating = models.IntegerField(null=True, blank=True)
    votes = models.IntegerField(null=True, blank=True)

    budget = models.IntegerField(null=True, blank=True)
    gross = models.IntegerField(null=True, blank=True)
    profit = models.IntegerField(null=True, blank=True)

    #FIXME: how to deal with files now?
    #files =
    files_modified = models.DateTimeField(auto_now=True)
    filename = models.TextField(blank=True)
    extracted = models.IntegerField(null=True, blank=True)

    #length = models.IntegerField(null=True, blank=True)
    duration = models.FloatField(null=True, blank=True)

    objects = managers.MovieManager()

    #FIXME: should this be a done via a manager for person?
    def directors(self):
        return self.people.filter(cast__role='directors').order_by('cast__position')
    def writers(self):
        return self.people.filter(cast__role='writers').order_by('cast__position')
    def editors(self):
        return self.people.filter(cast__role='editors').order_by('cast__position')
    def producers(self):
        return self.people.filter(cast__role='producers').order_by('cast__position')
    def cinematographers(self):
        return self.people.filter(cast__role='cinematographers').order_by('cast__position')

    #FIXME: include role and character
    def cast(self):
        cast = []
        for c in Cast.objects.filter(movie=self, role=cast).order_by('position'):
            cast.append((c.person.name, c.character))
        return tuple(cast)
        #return self.person.filter(cast__role='cast').order_by('cast__position')

    def filtered_reviews(self):
        whitelist = ReviewWhitelist.objects.all()
        q = Q(id=-1)
        for w in whitelist:
            q = q | Q(url__contains=w.url)
        return self.reviews.filter(q)

    risk = models.IntegerField(null=True, blank=True)
    rights_level = models.IntegerField(null=True, blank=True)
    rights_text = models.TextField(blank=True)

    #title_english = models.TextField(blank=True)
    #FIXME: join AltTitle

    #FIXME: use mapping
    tpb_id = models.CharField(max_length=128, blank=True)
    kg_id = models.CharField(max_length=128, blank=True)
    open_subtitle_id = models.IntegerField(null=True, blank=True)
    wikipedia_url = models.TextField(blank=True)

    #FIXME: join Location
    #locations = models.TextField(blank=True)

    #Series information
    series_imdb = models.CharField(max_length=7, default='')
    series_title = models.TextField(blank=True, default='')
    episode_title = models.TextField(blank=True, default='')
    season = models.IntegerField(default=-1)
    episode = models.IntegerField(default=-1)

    #what of this is still required?
    still_pos = models.IntegerField(null=True, blank=True)
    poster = models.TextField(blank=True)
    posters_disabled = models.TextField(blank=True)
    posters_available = models.TextField(blank=True)
    poster_height = models.IntegerField(null=True, blank=True)
    poster_width = models.IntegerField(null=True, blank=True)

    scene_height = models.IntegerField(null=True, blank=True)

    def __unicode__(self):
        return "%s (%s)" % (self.title, self.year)

    def save(self, *args, **kwargs):
        if self.imdbId:
            mid = self.imdbId
        else:
            mid = self.oxdbId
        self.movieId = mid
        #FIXME: update sort and find values here
        
        super(Movie, self).save(*args, **kwargs)

    _public_fields = {
        'movieId': 'id',
        'title':   'title',
        'year':    'year',

        'runtime':    'runtime',
        'release_date':    'release_date',

        'countries': 'country',
        'directors': 'director',
        'genres': 'genres',
        'keywords': 'keywords',
        'cast': 'cast',
        'series_title': 'series_title',
        'episode_title': 'episode_title',
        'season': 'season',
        'episode': 'episode',
        'filtered_reviews': 'reviews',
        'trivia': 'trivia',
    }
    def json(self, fields=None):
        movie = {}
        for key in self._public_fields:
            pub_key = self._public_fields.get(key, key)
            if not fields or pub_key in fields:
                value = getattr(self, key)
                if key in ('directors', 'writers', 'filtered_reviews'):
                    movie[pub_key] = tuple([v.json() for v in value()])
                elif key in ('countries', 'keywords', 'genres', 'trivia'):
                    movie[pub_key] = tuple([v.json() for v in value.all()])
                else:
                    movie[pub_key] = value
        return movie

    #Class functions to get Movies by ID, right now movieId, imdbId and oxdbId
    #FIXME: this should go into a manager
    def byMovieId(self, movieId):
        if len(movieId) == 7:
            return self.byImdbId(movieId)
        return self.byOxdbId(movieId)
    byMovieId = classmethod(byMovieId)

    def byImdbId(self, imdbId):
        q = self.objects.filter(imdbId=imdbId)
        if q.count() == 0:
            raise self.DoesNotExist("%s matching imdb id %s does not exist." % (self._meta.object_name, imdbId))
        return q[0]
    byImdbId = classmethod(byImdbId)

    def byOxdbId(self, oxdbId):
        q = self.objects.filter(oxdbId=oxdbId)
        if q.count() == 0:
            raise self.DoesNotExist("%s matching oxdb id %s does not exist." % (self._meta.object_name, oxdbId))
        return q[0]
    byOxdbId = classmethod(byOxdbId)

    def oxid(self):
        directors = ",".join([d.name for d in self.directors()])
        return utils.oxid(self.title, directors, self.year, self.series_title, self.episode_title, self.season, self.episode)

'''
    used to search movies, all search values are in here
'''
class MovieFind(models.Model):
    movie = models.ForeignKey('Movie', related_name='find')

    title = models.CharField(max_length=1000)
    director = models.TextField(blank=True)
    country = models.TextField(blank=True)
    year = models.CharField(max_length=4)
    language = models.TextField(blank=True)
    writer = models.TextField(blank=True)
    producer = models.TextField(blank=True)
    editor = models.TextField(blank=True)
    cinematographers = models.TextField(blank=True)
    cast = models.IntegerField(blank=True)
    #person

    genre = models.TextField(blank=True)
    keywords = models.TextField(blank=True)
    summary = models.TextField(blank=True)
    trivia = models.TextField(blank=True)
    locations = models.TextField(blank=True)
    connections = models.TextField(blank=True)

    #only for own files or as admin?
    filename = models.TextField(blank=True)

    _private_fields = ('id', 'movie')
    _public_names = {
        'movieId': 'id'
    }
    def options(self):
        options = []
        for f in self._meta.fields:
            if f.name not in self._private_fields:
                name = f.name
                name = self._public_names.get(name, name)
                options.append((name, 'Find: %s' % name.capitalize()))
        return tuple(options)
    options = classmethod(options)

'''
    used to sort movies, all sort values are in here
'''
class MovieSort(models.Model):
    movie = models.ForeignKey('Movie', related_name='sort')

    title = models.CharField(max_length=1000)
    director = models.TextField(blank=True)
    country = models.TextField(blank=True)
    year = models.CharField(max_length=4)

    producer = models.TextField(blank=True)
    writer = models.TextField(blank=True)
    editor = models.TextField(blank=True)
    cinematographers = models.TextField(blank=True)

    language = models.TextField(blank=True)
    runtime = models.IntegerField(blank=True)

    keywords = models.IntegerField(blank=True)
    genre = models.TextField(blank=True)
    cast = models.IntegerField(blank=True)
    summary = models.IntegerField(blank=True)
    trivia = models.IntegerField(blank=True)
    connections = models.IntegerField(blank=True)

    scenes = models.IntegerField(blank=True)
    words = models.IntegerField(null=True, blank=True)
    wpm = models.IntegerField(null=True, blank=True)
    risk = models.IntegerField(null=True, blank=True)

    movieId = models.CharField(max_length=128, blank=True)

    duration = models.FloatField(default=-1)
    resolution = models.IntegerField(blank=True)
    aspectratio = models.IntegerField(blank=True)
    bitrate = models.IntegerField(blank=True)
    pixels = models.IntegerField(blank=True)
    filename = models.IntegerField(blank=True)
    files = models.IntegerField(blank=True)
    size = models.IntegerField(blank=True)

    _private_fields = ('id', 'movie')
    _public_names = {
        'movieId': 'id'
    }
    def options(self):
        options = []
        for f in self._meta.fields:
            if f.name not in self._private_fields:
                name = f.name
                name = self._public_names.get(name, name)
                options.append((name, 'Sort: %s' % name.capitalize()))
        return tuple(options)
    options = classmethod(options)

class AlternativeTitle(models.Model):
    movie = models.ForeignKey(Movie, related_name='alternative_titles')
    type = models.CharField(max_length=128)
    title = models.TextField()

    class Meta:
        ordering = ('title', )

    def __unicode__(self):
        return self.title

def get_or_create(model, name):
    try:
        o = model.objects.get(name=name)
    except model.DoesNotExist:
        o = model.objects.create(name=name)
        o.save()
    return o

class Person(models.Model):
    name = models.CharField(max_length=200)
    imdbId = models.CharField(max_length=7, blank=True)
    name_sort = models.CharField(max_length=200)
    movies = models.ManyToManyField(Movie, related_name='people', through='Cast')

    class Meta:
        ordering = ('name_sort', )

    def __unicode__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.name_sort:
            self.name_sort = oxlib.normalize.canonicalName(self.name)
        super(Person, self).save(*args, **kwargs)

    def get_or_create(model, name, imdbId=None):
        if imdbId:
            q = model.objects.filter(name=name, imdbId=imdbId)
        else:
            q = model.objects.all().filter(name=name)
        if q.count() > 0:
            o = q[0]
        else:
            o = model.objects.create(name=name)
            if imdbId:
                o.imdbId = imdbId
            o.save()
        return o
    get_or_create = classmethod(get_or_create)

    def json(self):
        return self.name

class Cast(models.Model):
    movie = models.ForeignKey(Movie)
    person = models.ForeignKey(Person)
    role = models.CharField(max_length=200)
    character = models.CharField(max_length=200, blank=True)
    position = models.IntegerField()

    class Meta:
        ordering = ('position', 'person__name_sort')

    def __unicode__(self):
        return "%s <> %s" % (self.person, self.movie)

    def link(self, movie, person, role, character, position):
        q = self.objects.filter(movie=movie, person=person, role=role, character=character)
        if q.count() > 0:
            link = q[0]
            link.position = position
            link.save()
        else:
            link = self()
            link.movie=movie
            link.person=person 
            link.role=role
            link.character=character
            link.position = position
            link.save()
        return link
    link = classmethod(link)

    def json(self):
        return (self.person.json(), self.character)

class Country(models.Model):
    name = models.CharField(max_length=200, unique=True)
    movies = models.ManyToManyField(Movie, related_name='countries', through='MovieCountry')

    class Meta:
        #!! adding this to ordering, breaks:
        #   models.Country.objects.values("name").annotate(movies=Count('movies')) 
        #'moviecountry__position',
        ordering = ('name', )

    def __unicode__(self):
        return self.name

    get_or_create = classmethod(get_or_create)

    def json(self):
        return self.name

class MovieCountry(models.Model):
    movie = models.ForeignKey(Movie)
    country = models.ForeignKey(Country)
    position = models.IntegerField()

    class Meta:
        ordering = ('position', 'country')

    def __unicode__(self):
        return "%s <> %s" % (self.country, self.movie)

    def link(self, movie, country, position):
        q = self.objects.filter(movie=movie, country=country)
        if q.count() > 0:
            link = q[0]
            link.position = position
            link.save()
        else:
            link = self()
            link.movie=movie
            link.country=country
            link.position=position
            link.save()
        return link
    link = classmethod(link)


class Language(models.Model):
    name = models.CharField(max_length=200, unique=True)
    movies = models.ManyToManyField(Movie, related_name='language', through="MovieLanguage")

    class Meta:
        ordering = ('name', )

    def __unicode__(self):
        return self.name
    get_or_create = classmethod(get_or_create)

    def json(self):
        return self.name

class MovieLanguage(models.Model):
    movie = models.ForeignKey(Movie)
    language = models.ForeignKey(Language)
    position = models.IntegerField()

    class Meta:
        ordering = ('position', 'language')

    def __unicode__(self):
        return self.language.name

    def link(self, movie, language, position):
        q = self.objects.filter(movie=movie, language=language)
        if q.count() > 0:
            link = q[0]
            link.position = position
            link.save()
        else:
            link = self()
            link.movie=movie
            link.language=language
            link.position=position
            link.save()
        return link
    link = classmethod(link)

class Keyword(models.Model):
    name = models.CharField(max_length=200, unique=True)
    movies = models.ManyToManyField(Movie, related_name='keywords')

    class Meta:
        ordering = ('name', )

    def __unicode__(self):
        return self.name

    get_or_create = classmethod(get_or_create)

    def json(self):
        return self.name


class Genre(models.Model):
    name = models.CharField(max_length=200, unique=True)
    movies = models.ManyToManyField(Movie, related_name='genres')

    class Meta:
        ordering = ('name', )

    def __unicode__(self):
        return self.name

    get_or_create = classmethod(get_or_create)

    def json(self):
        return self.name

class Location(models.Model):
    name = models.CharField(max_length=200, unique=True)
    movies = models.ManyToManyField(Movie, related_name='locations')
    #fixme: geo data

    class Meta:
        ordering = ('name', )

    def __unicode__(self):
        return self.name

    get_or_create = classmethod(get_or_create)

    def json(self):
        return self.name

class Trivia(models.Model):
    trivia = models.TextField()
    movie = models.ForeignKey(Movie, related_name='trivia')
    position = models.IntegerField()

    class Meta:
        ordering = ('position', )

    def __unicode__(self):
        return self.trivia

    def json(self):
        return self.trivia

class MovieFile(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    oshash = models.CharField(blank=True, unique=True, max_length=16)
    sha1hash = models.CharField(blank=True, unique=True, max_length=40)
    md5sum = models.CharField(blank=True, unique=True, max_length=32)

    movie = models.ForeignKey('Movie', related_name="files")

    computed_path = models.CharField(blank=True, max_length=2048)
    size = models.IntegerField(default=-1)
    duration = models.FloatField(default=-1)

    video_codec = models.CharField(blank=True, max_length=256)
    pixel_format = models.CharField(blank=True, max_length=256)
    width = models.IntegerField(default=-1)
    height = models.IntegerField(default=-1)
    pixel_aspect_ratio = models.CharField(blank=True, max_length=256)
    display_aspect_ratio = models.CharField(blank=True, max_length=256)
    framerate = models.CharField(blank=True, max_length=256)

    audio_codec = models.CharField(blank=True, max_length=256)
    samplerate = models.IntegerField(default=-1)
    channels = models.IntegerField(default=-1)

    #computed values
    bpp = models.FloatField(default=-1)
    pixels = models.IntegerField(default=0)

    part = models.IntegerField(default=1)

    def __unicode__(self):
        return "%s (%s)" % (self.computed_path, self.oshash)

class UserFile(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User)
    movie_file = models.ForeignKey(MovieFile)
    path = models.CharField(blank=True, max_length=2048)

    def __unicode__(self):
        return "%s (%s)" % (self.path, unicode(self.user))

class Subtitle(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User)

    movie_file = models.ForeignKey(MovieFile)
    language = models.CharField(max_length=16)
    srt = models.TextField(blank=True)

    def __unicode__(self):
        return "%s.%s.srt" % (os.path.splitext(self.movie_file.computed_path)[0], self.language)

class Review(models.Model):
    movie = models.ForeignKey('Movie', related_name="reviews")
    title = models.CharField(blank=True, max_length=2048)
    url = models.CharField(blank=True, max_length=2048)

    def __unicode__(self):
        return self.title

    def get_or_create(self, movie, url):
        q = self.objects.filter(movie=movie, url=url)
        if q.count() > 0:
            o = q[0]
        else:
            o = self.objects.create(movie=movie, url=url)
            o.save()
        return o
    get_or_create = classmethod(get_or_create)

    def name(self):
        for w in ReviewWhitelist.objects.all():
            if w.url in self.url:
                return w.name
        return self.title

    def json(self):
        return (self.name(), self.url)

class ReviewWhitelist(models.Model):
    name = models.CharField(max_length=255, unique=True)
    url = models.CharField(max_length=255, unique=True)

class List(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User)
    title = models.CharField(max_length=255, unique=True)
    movies = models.ManyToManyField(Movie, related_name='lists', through='ListItem')

    def add(self, movie):
        q = self.movies.filter(id=movie.id)
        if q.count() == 0:
            l = ListItem()
            l.list = self
            l.movie = movie
            l.save()

    def remove(self, movie):
        self.ListItem.objects.all().filter(movie=movie, list=self).delete()

    def __unicode__(self):
        return u"%s (%s)" % (self.title, unicode(self.user))

class ListItem(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    list = models.ForeignKey(List)
    movie = models.ForeignKey(Movie)

    def __unicode__(self):
        return u"%s in %s" % (unicode(self.movie), unicode(self.list))

