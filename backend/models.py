# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import re
import os.path
from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User

import oxlib
from oxlib import stripTags
from oxlib.normalize import canonicalTitle, canonicalName

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
        for c in Cast.objects.filter(movie=self, role='cast').order_by('position'):
            cast.append((c.person.name, c.character))
        return tuple(cast)
        #return self.person.filter(cast__role='cast').order_by('cast__position')

    def connections_json(self):
        connections = {}
        for connection in self.connections.all():
            if connection.relation not in connections:
                connections[connection.relation] = []
            connections[connection.relation].append(connection.object.movieId)
        return connections

    def filtered_reviews(self):
        whitelist = ReviewWhitelist.objects.all()
        q = Q(id=-1)
        for w in whitelist:
            q = q | Q(url__contains=w.url)
        return self.reviews.filter(q)

    rights_level = models.IntegerField(default=-1)
   
    #FIXME: use data.0xdb.org
    tpb_id = models.CharField(max_length=128, blank=True)
    kg_id = models.CharField(max_length=128, blank=True)
    open_subtitle_id = models.IntegerField(null=True, blank=True)
    wikipedia_url = models.TextField(blank=True)

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
        return u'%s (%s)' % (self.title, self.year)

    def save(self, *args, **kwargs):
        if self.imdbId:
            mid = self.imdbId
        else:
            mid = self.oxdbId
        self.movieId = mid
        
        super(Movie, self).save(*args, **kwargs)
        self.updateFind()
        self.updateSort()

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
        'alternative_titles': 'alternative_titles',
        'connections': 'connections_json'
    }
    def json(self, fields=None):
        movie = {}
        for key in self._public_fields:
            pub_key = self._public_fields.get(key, key)
            if not fields or pub_key in fields:
                value = getattr(self, key)
                if key in ('directors', 'writers', 'filtered_reviews'):
                    movie[pub_key] = tuple([v.json() for v in value()])
                elif key in ('countries', 'keywords', 'genres', 'trivia', 'alternative_titles'):
                    movie[pub_key] = tuple([v.json() for v in value.all()])
                else:
                    movie[pub_key] = value
        for f in fields:
            if f.endswith('.length') and f[:-7] in ('cast', 'genre', 'trivia'):
                movie[f] = getattr(self.sort.all()[0], f[:-7])
        return movie

    def fields(self):
        fields = {}
        for f in self._meta.fields:
            if f.name in self._public_fields:
                fields[f.name] = {}
                fields[f.name]['order'] = 'desc'
                fields[f.name]['type'] = type(f)
        return fields
    fields = classmethod(fields)

    #Class functions to get Movies by ID, right now movieId, imdbId and oxdbId
    #FIXME: this should go into a manager
    def byMovieId(self, movieId):
        if len(movieId) == 7:
            return self.byImdbId(movieId)
        return self.byOxdbId(movieId)
    byMovieId = classmethod(byMovieId)

    def byImdbId(self, imdbId):
        return self.objects.get(imdbId=imdbId)
    byImdbId = classmethod(byImdbId)

    def byOxdbId(self, oxdbId):
        return self.objects.get(oxdbId=oxdbId)
    byOxdbId = classmethod(byOxdbId)

    def oxid(self):
        directors = ','.join([d.name for d in self.directors()])
        return utils.oxid(self.title, directors, self.year,
                          self.series_title, self.episode_title, self.season, self.episode)

    def updateFind(self):
        if self.find.count() == 0:
            f = MovieFind()
            f.movie = self
        else:
            f = self.find.all()[0]
        f.title = self.title + ' '.join([t.title for t in self.alternative_titles.all()])
        f.director = ' '.join([i.name for i in self.directors()])
        f.country = ' '.join([i.name for i in self.countries.all()])
        f.year = self.year
        f.language = ' '.join([i.name for i in self.languages.all()])
        f.writer = ' '.join([i.name for i in self.writers()])
        f.producer = ' '.join([i.name for i in self.producers()])
        f.editor = ' '.join([i.name for i in self.editors()])
        f.cinematographer = ' '.join([i.name for i in self.cinematographers()])
        f.cast = ' '.join(['%s %s' % i for i in self.cast()])
        f.genre = ' '.join([i.name for i in self.genres.all()])
        f.keywords = ' '.join([i.name for i in self.keywords.all()])
        f.summary = self.plot + self.plot_outline
        f.trivia = ' '.join([i.trivia for i in self.trivia.all()])
        f.location = ' '.join([i.name for i in self.locations.all()])
        f.filename = self.filename
        f.all = ' '.join([f.title, f.director, f.country, f.year, f.language,
                          f.writer, f.producer, f.editor, f.cinematographer,
                          f.cast, f.genre, f.keywords, f.summary, f.trivia,
                          f.location, f.filename])
        f.save()

    def updateSort(self):
        if self.sort.count() == 0:
            s = MovieSort()
            s.movie = self
        else:
            s = self.sort.all()[0]

        def sortName(value):
            sort_value = '~'
            if value:
                sort_value = stripTags(value).split(',')
                sort_value = '; '.join([canonicalName(name.strip()) for name in sort_value])
                sort_value = sort_value.replace(u'\xc5k', 'A')
            if not sort_value:
                sort_value = '~'
            return sort_value

        #title
        title = canonicalTitle(self.title)
        title = re.sub(u'[\'!¿¡,\.;\-"\:\*\[\]]', '', title)
        title = title.replace(u'Æ', 'Ae')
        #pad numbered titles
        numbers = re.compile('^(\d+)').findall(title)
        if numbers:
            padded = '%010d' % int(numbers[0])
            title = re.sub('^(\d+)', padded, title)

        s.title = title.strip()

        directors = ','.join([i.name for i in self.directors()])
        s.director = sortName(directors)

        s.country = ','.join([i.name for i in self.countries.all()])
        s.year = self.year

        names = ','.join([i.name for i in self.producers()])
        s.producer = sortName(names)
        names = ','.join([i.name for i in self.writers()])
        s.writer = sortName(names)
        names = ','.join([i.name for i in self.editors()])
        s.editor = sortName(names)
        names = ','.join([i.name for i in self.cinematographers()])
        s.cinematographer = sortName(names)

        s.country = ','.join([i.name for i in self.languages.all()])
        s.runtime = self.runtime

        s.keywords = self.keywords.all().count()
        s.genre = self.genres.all().count()
        s.cast = len(self.cast())
        s.summary = len(self.plot.split())
        s.trivia = self.trivia.all().count()
        s.connections = self.connections.all().count()
        s.movieId = self.movieId

        # data from related subtitles
        s.scenes = 0 #FIXME
        s.words =  0 #FIXME
        s.wpm =    0 #FIXME
        s.risk =   0 #FIXME
        # data from related files
        s.duration = 0 #FIXME
        s.resolution = 0 #FIXME
        s.aspectratio = 0 #FIXME
        s.bitrate = 0 #FIXME
        s.pixels = 0 #FIXME
        s.filename = 0 #FIXME
        s.files = 0 #FIXME
        s.size = 0 #FIXME
        s.save()

class MovieFind(models.Model):
    """
        used to search movies, all search values are in here
    """
    movie = models.ForeignKey('Movie', related_name='find', unique=True)

    all = models.TextField(blank=True)
    title = models.CharField(max_length=1000)
    director = models.TextField(blank=True)
    country = models.TextField(blank=True)
    year = models.CharField(max_length=4)
    language = models.TextField(blank=True)
    writer = models.TextField(blank=True)
    producer = models.TextField(blank=True)
    editor = models.TextField(blank=True)
    cinematographer = models.TextField(blank=True)
    cast = models.TextField(blank=True)
    #person

    genre = models.TextField(blank=True)
    keywords = models.TextField(blank=True)
    summary = models.TextField(blank=True)
    trivia = models.TextField(blank=True)
    locations = models.TextField(blank=True)

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

class MovieSort(models.Model):
    """
        used to sort movies, all sort values are in here
    """
    movie = models.ForeignKey('Movie', related_name='sort', unique=True)

    title = models.CharField(max_length=1000)
    director = models.TextField(blank=True)
    country = models.TextField(blank=True)
    year = models.CharField(max_length=4)

    producer = models.TextField(blank=True)
    writer = models.TextField(blank=True)
    editor = models.TextField(blank=True)
    cinematographer = models.TextField(blank=True)

    language = models.TextField(blank=True)
    runtime = models.IntegerField(blank=True, null=True)

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
    title = models.TextField()
    type = models.CharField(max_length=1000)

    class Meta:
        ordering = ('title', )

    def __unicode__(self):
        return self.title

    def json(self):
        return (self.title, self.type)

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
    movies = models.ManyToManyField(Movie, related_name='languages', through="MovieLanguage")

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

    lat_sw = models.FloatField(default=0)
    lng_sw = models.FloatField(default=0)
    lat_ne = models.FloatField(default=0)
    lng_ne = models.FloatField(default=0)
    lat_center = models.FloatField(default=0)
    lng_center = models.FloatField(default=0)
    area = models.FloatField(default=-1)

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
        trivia = self.trivia
        trivia = oxlib.fixAmpersands(trivia)
        trivia = re.sub('<a href="(/name/nm.*?)">(.*?)</a>', '<a href="/?f=name&amp;q=\\2">\\2</a>', trivia)
        trivia = re.sub('<a href="/title/tt(.*?)/">(.*?)</a>', '<a href="/\\1">\\2</a>', trivia)
        return trivia

class Connection(models.Model):
    subject = models.ForeignKey(Movie, related_name='connections')
    relation = models.CharField(max_length=512)
    object = models.ForeignKey(Movie)

    def get_or_create(model, subject, relation, object, reverse=True):
        q = model.objects.filter(subject=subject, relation=relation, object=object)
        if q.count() > 0:
            o = q[0]
        else:
            o = model.objects.create(subject=subject, relation=relation, object=object)
            o.save()
        if reverse:
            _map = {
                'Edited into': 'Edited from',
                'Features': 'Featured in',
                'Follows': 'Followed by',
                'References': 'Referenced in',
                'Remake of': 'Remade as',
                'Spin off from': 'Spin off',
                'Spoofs': 'Spoofed in',
                'Version of': 'Version of',
            }
            if relation in _map.values():
                for k in _map:
                    if _map[k] == relation:
                        reverse_relation = k
            else:
                reverse_relation = _map[relation]
            o2 = model.get_or_create(object, reverse_relation, subject, reverse=False)
        return o
    get_or_create = classmethod(get_or_create)

    def __unicode__(self):
        return '%s %s %s' % (self.subject, self.relation, self.object)

class File(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    oshash = models.CharField(blank=True, unique=True, max_length=16)
    sha1 = models.CharField(blank=True, unique=True, max_length=40)
    md5 = models.CharField(blank=True, unique=True, max_length=32)

    movie = models.ForeignKey('Movie', related_name="files", default=None)

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

    part = models.IntegerField(default=0)

    def get_or_create(model, oshash):
        try:
            f = model.objects.get(oshash=oshash)
        except model.DoesNotExist:
            f = model.objects.create(oshash=oshash)
            f.save()
        return f
    get_or_create = classmethod(get_or_create)

    def __unicode__(self):
        return "%s (%s)" % (self.computed_path, self.oshash)

class Archive(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=255, unique=True)
    users = models.ManyToManyField(User, related_name='archives')

class ArchiveFile(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    archive = models.ForeignKey(Archive)
    movie_file = models.ForeignKey(File)
    path = models.CharField(blank=True, max_length=2048)

    objects = managers.ArchiveFileManager()
    
    def update(self, data):
        """
            only add, do not overwrite keys in movie_file
        """
        for key in ('duration', 'video_codec', 'pixel_format', 'width', 'height',
                    'pixel_aspect_ratio', 'display_aspect_ratio', 'framerate',
                    'audio_codec', 'samplerate', 'channels', 'size', 'sha1', 'md5'):
            if key in data and not getattr(self.movie_file, key):
                setattr(self.movie_file, key, data[key])
        self.path = data.get('path', '')
        self.movie_file.save()
        self.save()

    def get_or_create(model, archive, oshash):
        try:
            f = model.objects.by_oshash(oshash=oshash)
        except model.DoesNotExist:
            f = model.objects.create()
            f.movie_file = File.get_or_create(oshash)
            f.archive = archive
            f.save()
        return f
    get_or_create = classmethod(get_or_create)

    def __unicode__(self):
        return '%s (%s)' % (self.path, unicode(self.user))

class Subtitle(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User)

    movie_file = models.ForeignKey(File)
    language = models.CharField(max_length=16)
    srt = models.TextField(blank=True)

    def get_or_create(model, user, oshash, language):
        q = model.objects.filter(movie_file__oshash=oshash, language=language, user=user)
        if q.count() > 0:
            s = q[0]
        else:
            movie_file = models.File.get_or_create(oshash=oshash)
            s = model.objects.create(user=user, language=language, movie_file=movie_file)
            s.save()
        return s
    get_or_create = classmethod(get_or_create)

    def __unicode__(self):
        return '%s.%s.srt' % (os.path.splitext(self.movie_file.computed_path)[0], self.language)

class Review(models.Model):
    movie = models.ForeignKey('Movie', related_name='reviews')
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
    name = models.CharField(max_length=255, unique=True)
    public = models.BooleanField(default=False)
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
        return u'%s (%s)' % (self.title, unicode(self.user))

class ListItem(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    list = models.ForeignKey(List)
    movie = models.ForeignKey(Movie)

    def __unicode__(self):
        return u'%s in %s' % (unicode(self.movie), unicode(self.list))

